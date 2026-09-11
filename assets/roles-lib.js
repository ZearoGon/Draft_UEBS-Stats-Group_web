// Roles: who looks after which part of the site, and who may approve what.
//
// The single source is content/maintainers.json. This module holds the pure
// logic shared by the content compiler (scripts/content.mjs -> CODEOWNERS and
// the data the pages read), the approval workflow (scripts/authority.mjs), the
// roles function (api/roles.js) and the roles panel (roles.html, which loads a
// copy at assets/roles-lib.js). No Node-only imports here.

export const HANDLE_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
export const AREA_ID_RE = /^[a-z][a-z0-9-]{1,30}$/;
export const PERSON_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ROLE_KEYS = ["owner", "backup"];

export function normaliseRoles(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const areas = (Array.isArray(src.areas) ? src.areas : []).map((a) => ({
    id: str(a && a.id),
    label: str(a && a.label),
    paths: Array.isArray(a && a.paths) ? a.paths.map(str).filter(Boolean) : [],
    owner: str(a && a.owner),
    backup: str(a && a.backup),
    approvals: Number.isInteger(a && a.approvals) && a.approvals > 0 ? a.approvals : 1,
    duty: Boolean(a && a.duty),
    note: str(a && a.note),
  }));
  const duty = (Array.isArray(src.duty) ? src.duty : []).map((d) => ({
    term: str(d && d.term),
    from: str(d && d.from),
    to: str(d && d.to),
    editor: str(d && d.editor),
  }));
  const admins = (Array.isArray(src.admins) ? src.admins : []).map(str).filter(Boolean);
  const history = (Array.isArray(src.history) ? src.history : []).map((h) => ({
    date: str(h && h.date),
    change: str(h && h.change),
    by: str(h && h.by),
    note: str(h && h.note),
  }));
  return { areas, duty, admins, history };
}

function str(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

// isPerson(id) -> true when content/people/<id>.md exists.
export function validateRoles(roles, isPerson) {
  const errors = [];
  const ids = new Set();
  const paths = new Set();
  if (roles.areas.length === 0) errors.push("maintainers.json: at least one area is needed");
  for (const a of roles.areas) {
    const where = `maintainers.json: area "${a.id || "?"}"`;
    if (!AREA_ID_RE.test(a.id)) errors.push(`${where}: id must be lowercase letters, digits and hyphens`);
    if (ids.has(a.id)) errors.push(`${where}: duplicate id`);
    ids.add(a.id);
    if (!a.label) errors.push(`${where}: missing label`);
    for (const p of a.paths) {
      if (p.startsWith("/") || p.includes("..")) errors.push(`${where}: path "${p}" must be repository-relative without a leading slash`);
      if (paths.has(p)) errors.push(`${where}: path "${p}" is already claimed by another area`);
      paths.add(p);
    }
    for (const k of ROLE_KEYS) {
      const v = a[k];
      if (!v) continue;
      if (!PERSON_ID_RE.test(v)) errors.push(`${where}: ${k} "${v}" is not a person id`);
      else if (!isPerson(v)) errors.push(`${where}: ${k} "${v}" has no file in content/people/`);
    }
    if (a.owner && a.owner === a.backup) errors.push(`${where}: owner and backup are the same person`);
  }
  const seenTerms = new Set();
  for (const d of roles.duty) {
    const where = `maintainers.json: duty "${d.term || "?"}"`;
    if (!d.term) errors.push(`${where}: missing term name`);
    if (seenTerms.has(d.term)) errors.push(`${where}: duplicate term`);
    seenTerms.add(d.term);
    if (!ISO_DATE_RE.test(d.from) || !ISO_DATE_RE.test(d.to)) errors.push(`${where}: from/to must be YYYY-MM-DD`);
    else if (d.from > d.to) errors.push(`${where}: from is after to`);
    if (!d.editor) errors.push(`${where}: missing editor`);
    else if (!isPerson(d.editor)) errors.push(`${where}: editor "${d.editor}" has no file in content/people/`);
  }
  for (let i = 0; i < roles.duty.length; i++) {
    for (let j = i + 1; j < roles.duty.length; j++) {
      const a = roles.duty[i], b = roles.duty[j];
      if (a.from <= b.to && b.from <= a.to) errors.push(`maintainers.json: duty terms "${a.term}" and "${b.term}" overlap`);
    }
  }
  if (roles.admins.length === 0) errors.push("maintainers.json: at least one admin is needed");
  for (const id of roles.admins) {
    if (!isPerson(id)) errors.push(`maintainers.json: admin "${id}" has no file in content/people/`);
  }
  return errors;
}

export function currentDuty(roles, today = todayIso()) {
  return roles.duty.find((d) => d.from <= today && today <= d.to) || null;
}

export function nextDuty(roles, today = todayIso()) {
  return roles.duty.filter((d) => d.from > today).sort((a, b) => a.from.localeCompare(b.from))[0] || null;
}

// Longest-prefix match of a repository path to an area. Returns null when no area claims it.
export function areaForPath(roles, path) {
  let best = null;
  let bestLen = -1;
  for (const a of roles.areas) {
    for (const p of a.paths) {
      const dir = p.endsWith("/");
      const hit = dir ? path.startsWith(p) : path === p;
      if (hit && p.length > bestLen) { best = a; bestLen = p.length; }
    }
  }
  return best;
}

export function areasForFiles(roles, files) {
  const areas = new Map();
  const unclaimed = [];
  for (const f of files) {
    const a = areaForPath(roles, f);
    if (a) areas.set(a.id, a); else unclaimed.push(f);
  }
  return { areas: Array.from(areas.values()), unclaimed };
}

// Person ids who may act on a change touching `areas`. Files outside every area
// (`unclaimed`) fall to the admins alone.
export function eligibleFor(roles, areas, unclaimed, today = todayIso()) {
  const set = new Set(roles.admins);
  if (unclaimed.length === 0) {
    for (const a of areas) {
      if (a.owner) set.add(a.owner);
      if (a.backup) set.add(a.backup);
    }
    const duty = currentDuty(roles, today);
    if (duty && duty.editor && areas.length > 0 && areas.every((a) => a.duty)) set.add(duty.editor);
  }
  return set;
}

export function requiredApprovals(areas, unclaimed) {
  let n = 1;
  for (const a of areas) n = Math.max(n, a.approvals);
  if (unclaimed.length) n = Math.max(n, 1);
  return n;
}

// Decides whether `who` (a GitHub handle) may run `command` on a pull request that
// changes `files`. `approvers` are the handles of everyone who has commented
// /approve so far (including `who` when the command is /approve). `handleOf(id)`
// maps person ids to handles (empty when unknown). Handles compare case-insensitively.
export function decideApproval({ roles, files, who, command, approvers = [], handleOf, today = todayIso() }) {
  const { areas, unclaimed } = areasForFiles(roles, files);
  const eligibleIds = eligibleFor(roles, areas, unclaimed, today);
  const eligible = [];
  for (const id of eligibleIds) {
    const h = handleOf(id);
    if (h) eligible.push({ id, handle: h });
  }
  const lc = (s) => String(s || "").toLowerCase();
  const isEligible = (h) => eligible.some((e) => lc(e.handle) === lc(h));
  const areaLabels = areas.map((a) => a.label);
  const scope = areaLabels.length ? areaLabels.join(", ") : "files outside every area";
  const mention = eligible.map((e) => "@" + e.handle).join(" ");
  const base = { areas: areas.map((a) => a.id), unclaimed, eligible: eligible.map((e) => e.handle), scope };

  if (!isEligible(who)) {
    return {
      ...base,
      allowed: false,
      required: 0,
      have: 0,
      message: `@${who} - this pull request changes **${scope}**, which is looked after by ${mention || "the admins (none of whom has a GitHub handle on file yet)"}. One of them replies \`${command}\` to act on it.`,
    };
  }
  if (command !== "/approve") {
    return { ...base, allowed: true, required: 0, have: 0, message: "" };
  }
  const distinctEligible = new Set(eligible.map((e) => lc(e.handle))).size;
  const required = Math.min(requiredApprovals(areas, unclaimed), Math.max(1, distinctEligible));
  const have = Array.from(new Set(approvers.map(lc))).filter((h) => isEligible(h));
  if (have.length >= required) {
    return { ...base, allowed: true, required, have: have.length, message: "" };
  }
  const still = eligible.filter((e) => !have.includes(lc(e.handle))).map((e) => "@" + e.handle).join(" ");
  return {
    ...base,
    allowed: false,
    required,
    have: have.length,
    message: `Approval ${have.length} of ${required} recorded (${have.map((h) => "@" + h).join(", ")}). Changes to **${scope}** need one more \`/approve\` from: ${still}.`,
  };
}

// The CODEOWNERS file: a catch-all line for the admins first, then one line per
// claimed path (last match wins in CODEOWNERS, so specific lines come after).
// People without a handle are left out - the panel flags them.
export function renderCodeowners(roles, handleOf, today = todayIso()) {
  const duty = currentDuty(roles, today);
  const mentions = (ids) => {
    const out = [];
    for (const id of ids) {
      const h = id ? handleOf(id) : "";
      if (h && !out.includes("@" + h)) out.push("@" + h);
    }
    return out;
  };
  const lines = [
    "# Generated from content/maintainers.json by scripts/content.mjs - do not edit.",
    "# Change roles in content/maintainers.json (or through roles.html) and run npm run build.",
    "#",
    "# GitHub asks the owners of the changed paths to review each pull request and emails",
    "# them; replying /approve to that email is what publishes the change.",
    "",
    "# Everything not claimed below: the admins.",
  ];
  const admins = mentions(roles.admins);
  lines.push(admins.length ? `* ${admins.join(" ")}` : "# * (no admin has a GitHub handle on file yet)");
  for (const a of roles.areas) {
    if (a.paths.length === 0) continue;
    const ids = [a.owner, a.backup];
    if (a.duty && duty) ids.push(duty.editor);
    const m = mentions(ids);
    lines.push("", `# ${a.label}${a.duty && duty ? ` (+ this term's editor, ${duty.term})` : ""}`);
    for (const p of a.paths) {
      lines.push(m.length ? `/${p} ${m.join(" ")}` : `# /${p} (no owner with a GitHub handle - falls to the admins)`);
    }
  }
  return lines.join("\n") + "\n";
}

// Human-readable differences between two normalised role sets (for history and PR bodies).
export function diffRoles(before, after, nameOf = (id) => id) {
  const changes = [];
  const name = (id) => (id ? nameOf(id) || id : "vacant");
  const beforeAreas = new Map(before.areas.map((a) => [a.id, a]));
  for (const a of after.areas) {
    const b = beforeAreas.get(a.id);
    if (!b) { changes.push(`New area "${a.label}" (${name(a.owner)} / backup ${name(a.backup)})`); continue; }
    for (const k of ROLE_KEYS) {
      if (a[k] !== b[k]) changes.push(`${a.label}: ${k} ${name(b[k])} -> ${name(a[k])}`);
    }
    if (a.label !== b.label) changes.push(`Area "${b.label}" renamed "${a.label}"`);
    if (a.paths.join("|") !== b.paths.join("|")) changes.push(`${a.label}: paths now ${a.paths.join(", ") || "(none)"}`);
    if (a.approvals !== b.approvals) changes.push(`${a.label}: approvals needed ${b.approvals} -> ${a.approvals}`);
    if (a.duty !== b.duty) changes.push(`${a.label}: ${a.duty ? "now" : "no longer"} covered by the term editor`);
  }
  for (const b of before.areas) if (!after.areas.some((a) => a.id === b.id)) changes.push(`Area "${b.label}" removed`);
  const beforeDuty = new Map(before.duty.map((d) => [d.term, d]));
  for (const d of after.duty) {
    const b = beforeDuty.get(d.term);
    if (!b) changes.push(`Term editor ${d.term} (${d.from} to ${d.to}): ${name(d.editor)}`);
    else if (b.editor !== d.editor || b.from !== d.from || b.to !== d.to) changes.push(`Term editor ${d.term}: ${name(b.editor)} (${b.from} to ${b.to}) -> ${name(d.editor)} (${d.from} to ${d.to})`);
  }
  for (const b of before.duty) if (!after.duty.some((d) => d.term === b.term)) changes.push(`Term editor ${b.term} removed`);
  const bAdmins = before.admins.join("|"), aAdmins = after.admins.join("|");
  if (bAdmins !== aAdmins) changes.push(`Admins: ${before.admins.map(name).join(", ") || "none"} -> ${after.admins.map(name).join(", ") || "none"}`);
  return changes;
}

// The JSON file as committed: history newest first, stable key order.
export function serialiseRoles(roles) {
  const out = {
    areas: roles.areas.map((a) => {
      const o = { id: a.id, label: a.label, paths: a.paths, owner: a.owner, backup: a.backup };
      if (a.approvals !== 1) o.approvals = a.approvals;
      if (a.duty) o.duty = true;
      if (a.note) o.note = a.note;
      return o;
    }),
    duty: roles.duty.map((d) => ({ term: d.term, from: d.from, to: d.to, editor: d.editor })),
    admins: roles.admins,
    history: roles.history,
  };
  return JSON.stringify(out, null, 2) + "\n";
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
