// GET  /api/roles - what the roles panel needs to know about the deployment.
// POST /api/roles - turns a new assignment of roles (roles.html) into a pull request
// that changes content/maintainers.json, the generated .github/CODEOWNERS and the
// `github:` handle in any person file that was edited. The admins approve it by
// replying "/approve" (see .github/workflows/intake-approve.yml).
//
// Body: { roles, people: [{id, name, github}], handles: {id: handle}, by, note, passphrase, dryRun }

import { randomBytes } from "node:crypto";
import { addLabels, createBranchWithFiles, createPullRequest, getFile, githubConfig } from "./_lib/github.js";
import { HttpError, errorResponse, ipKey, json, oneLine, rateLimit, readJson, requirePassphrase } from "./_lib/util.js";
import {
  HANDLE_RE,
  PERSON_ID_RE,
  diffRoles,
  normaliseRoles,
  renderCodeowners,
  serialiseRoles,
  todayIso,
  validateRoles,
} from "./_lib/roles.js";

const ROLES_FILE = "content/maintainers.json";
const CODEOWNERS_FILE = ".github/CODEOWNERS";

export async function GET() {
  const cfg = githubConfig();
  return json({
    ok: true,
    configured: cfg.configured,
    repo: cfg.repo,
    passphraseRequired: Boolean(process.env.ROLES_PASSPHRASE || process.env.INTAKE_PASSPHRASE),
  });
}

export async function POST(request) {
  try {
    const cfg = githubConfig();
    if (!cfg.configured) throw new HttpError(503, "not-configured", "The roles panel is not connected to GitHub yet (GITHUB_TOKEN is not set on the deployment).");
    const body = await readJson(request, 400_000);
    if (body.website) return json({ ok: true, dropped: true });
    requirePassphrase(process.env.ROLES_PASSPHRASE ? "ROLES_PASSPHRASE" : "INTAKE_PASSPHRASE", body.passphrase);
    if (!rateLimit("roles:" + ipKey(request), 10, 60 * 60 * 1000)) {
      throw new HttpError(429, "rate-limited", "Too many requests from this connection - please try again in an hour.");
    }

    // People as the panel knows them (from assets/data.js), plus edited handles.
    const people = new Map();
    for (const p of Array.isArray(body.people) ? body.people.slice(0, 500) : []) {
      if (!p || typeof p !== "object") continue;
      const id = String(p.id || "").trim();
      if (!PERSON_ID_RE.test(id)) continue;
      people.set(id, { id, name: oneLine(p.name, 80) || id, github: HANDLE_RE.test(String(p.github || "")) ? String(p.github) : "" });
    }
    if (people.size === 0) throw new HttpError(400, "people", "The request carries no people - reload the page and try again.");
    const nameOf = (id) => people.get(id)?.name || id;

    const handleEdits = [];
    const edits = body.handles && typeof body.handles === "object" ? body.handles : {};
    for (const [id, raw] of Object.entries(edits)) {
      const person = people.get(id);
      if (!person) throw new HttpError(400, "handle", `"${id}" is not a person on the site.`);
      const handle = String(raw || "").trim();
      if (handle && !HANDLE_RE.test(handle)) throw new HttpError(400, "handle", `"${handle}" is not a GitHub username (letters, digits and single hyphens, at most 39 characters).`);
      if (handle === person.github) continue;
      handleEdits.push({ id, name: person.name, from: person.github, to: handle });
      person.github = handle;
    }
    const lower = new Map();
    for (const p of people.values()) {
      if (!p.github) continue;
      const k = p.github.toLowerCase();
      if (lower.has(k)) throw new HttpError(400, "handle", `The handle @${p.github} is on both ${lower.get(k)} and ${p.name}.`);
      lower.set(k, p.name);
    }
    const handleOf = (id) => people.get(id)?.github || "";

    const roles = normaliseRoles(body.roles);
    const errors = validateRoles(roles, (id) => people.has(id));
    if (errors.length) throw new HttpError(400, "roles", errors.join(" · "));

    const by = String(body.by || "").trim();
    if (!people.has(by)) throw new HttpError(400, "by", "Say who you are (pick your name).");
    const note = oneLine(body.note, 300);

    const currentText = await getFile(cfg, ROLES_FILE);
    let before = normaliseRoles({});
    if (currentText) {
      try { before = normaliseRoles(JSON.parse(currentText)); } catch { /* unreadable file on main: treat as empty */ }
    }
    const changes = diffRoles(before, roles, nameOf);
    for (const h of handleEdits) changes.push(`${h.name}: GitHub handle ${h.from ? "@" + h.from : "none"} -> ${h.to ? "@" + h.to : "none"}`);
    if (changes.length === 0) throw new HttpError(400, "no-change", "Nothing has changed compared with the roles on GitHub.");

    roles.history = [{ date: todayIso(), change: changes.join("; "), by, note }, ...before.history].slice(0, 200);
    const files = [
      { path: ROLES_FILE, content: serialiseRoles(roles) },
      { path: CODEOWNERS_FILE, content: renderCodeowners(roles, handleOf) },
    ];
    for (const h of handleEdits) {
      const path = `content/people/${h.id}.md`;
      const text = await getFile(cfg, path);
      if (text === null) throw new HttpError(400, "handle", `${path} does not exist on GitHub yet - add the person first.`);
      files.push({ path, content: setFrontmatterField(text, "github", h.to) });
    }

    if (body.dryRun) {
      return json({ ok: true, dryRun: true, changes, files: files.map((f) => f.path), codeowners: files[1].content });
    }

    const branch = `roles/${todayIso()}-${randomBytes(3).toString("hex")}`;
    const title = `Roles: ${changes[0].length > 70 ? changes[0].slice(0, 67) + "..." : changes[0]}${changes.length > 1 ? ` (+${changes.length - 1} more)` : ""}`;
    await createBranchWithFiles(cfg, { branch, files, message: `${title}\n\nChanged through roles.html by ${nameOf(by)}.${note ? "\n\n" + note : ""}` });
    const pr = await createPullRequest(cfg, { head: branch, title, body: prBody(changes, files, nameOf(by), note, roles, handleOf) });
    await addLabels(cfg, pr.number, ["roles"]);
    return json({ ok: true, pr, branch, changes, files: files.map((f) => f.path) });
  } catch (error) {
    return errorResponse(error);
  }
}

// Sets (or removes, when value is empty) one scalar field in the YAML frontmatter
// of a content file, keeping everything else byte-for-byte.
function setFrontmatterField(text, key, value) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!m) throw new HttpError(400, "frontmatter", "The person file has no frontmatter block.");
  const lines = m[1].split(/\r?\n/);
  const line = value ? `${key}: ${JSON.stringify(value)}` : null;
  const idx = lines.findIndex((l) => l.startsWith(key + ":"));
  if (idx >= 0) {
    if (line) lines[idx] = line; else lines.splice(idx, 1);
  } else if (line) {
    // after email: when present, otherwise at the end of the block
    const after = lines.findIndex((l) => l.startsWith("email:"));
    lines.splice(after >= 0 ? after + 1 : lines.length, 0, line);
  }
  return `---${eol}${lines.join(eol)}${eol}---${text.slice(m[0].length - m[2].length)}`;
}

function prBody(changes, files, byName, note, roles, handleOf) {
  const admins = roles.admins.map(handleOf).filter(Boolean).map((h) => "@" + h).join(" ");
  return `## Roles change

${changes.map((c) => `- ${c}`).join("\n")}

Requested by **${byName}** through roles.html.${note ? `\n\n> ${note.replace(/\n/g, " ")}` : ""}

Files in this pull request:
${files.map((f) => `- \`${f.path}\``).join("\n")}

### How to publish
- **Admins** (${admins || "none with a GitHub handle yet"}): reply to this notification email with \`/approve\` (or comment it here). The change is merged, CODEOWNERS takes effect at once and the site redeploys.
- Reply \`/changes <what to fix>\` to send it back, \`/reject\` to close it.
- Roles are read from \`main\`, so this pull request cannot grant itself rights.

_Created by the roles panel (api/roles)._`;
}
