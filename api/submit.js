// POST /api/submit - turns a filled-in form (submit.html) into a pull request:
// the Markdown content file(s), an optional PDF, and a PR that maintainers
// approve by replying "/approve" (see .github/workflows/intake-approve.yml).
// GET /api/submit - tells the form what is configured.

import { randomBytes } from "node:crypto";
import { addLabels, createBranchWithFiles, createPullRequest, githubConfig } from "./_lib/github.js";
import {
  CATEGORY_LABELS,
  HttpError,
  KNOWN_FIELDS,
  LEVELS,
  POST_CATEGORIES,
  POST_TYPES,
  SESSION_FORMATS,
  SESSION_KINDS,
  TOPIC_IDS,
  TOPIC_LABELS,
  assertNoForbidden,
  cleanText,
  errorResponse,
  fmtDate,
  initialsCandidates,
  ipKey,
  isHHMM,
  isIsoDate,
  json,
  oneLine,
  rateLimit,
  readJson,
  requirePassphrase,
  safeFileName,
  semesterOf,
  slugify,
  toFrontmatter,
} from "./_lib/util.js";

const MAX_BODY = 4_400_000; // Vercel accepts request bodies up to 4.5 MB
const MAX_FILE = 3 * 1024 * 1024;

export async function GET() {
  const cfg = githubConfig();
  return json({
    ok: true,
    configured: cfg.configured,
    repo: cfg.repo,
    passphraseRequired: Boolean(process.env.INTAKE_PASSPHRASE),
    parser: Boolean(process.env.ANTHROPIC_API_KEY),
    maxFileBytes: MAX_FILE,
  });
}

export async function POST(request) {
  try {
    const cfg = githubConfig();
    if (!cfg.configured) throw new HttpError(503, "not-configured", "The intake is not connected to GitHub yet (GITHUB_TOKEN is not set on the deployment).");
    const body = await readJson(request, MAX_BODY);
    if (body.website) return json({ ok: true, dropped: true }); // honeypot field - bots fill it, people never see it
    requirePassphrase("INTAKE_PASSPHRASE", body.passphrase);
    if (!rateLimit("submit:" + ipKey(request), 5, 60 * 60 * 1000)) {
      throw new HttpError(429, "rate-limited", "Too many submissions from this connection - please try again in an hour.");
    }
    const submitter = {
      name: oneLine(body.submitter && body.submitter.name, 80),
      email: oneLine(body.submitter && body.submitter.email, 120),
      contact: Boolean(body.submitter && body.submitter.contact === true),
    };
    if (!submitter.name) throw new HttpError(400, "missing-name", "Please tell us your name.");
    const known = normaliseKnownPeople(body.knownPeople);
    const plan = body.kind === "post"
      ? planPost(body.post || {}, body.attachment, known)
      : planSession(body.session || {}, body.attachment, known);

    const branch = `intake/${plan.date}-${plan.slug}-${randomBytes(2).toString("hex")}`;
    await createBranchWithFiles(cfg, {
      branch,
      files: plan.files,
      message: `${plan.commitTitle}\n\nSubmitted through the website by ${submitter.name}.`,
    });
    const pr = await createPullRequest(cfg, { head: branch, title: `Intake: ${plan.title}`, body: prBody(plan, submitter) });
    await addLabels(cfg, pr.number, ["intake"]);
    return json({ ok: true, pr, branch, files: plan.files.map((f) => f.path), newPeople: plan.newPeople });
  } catch (error) {
    return errorResponse(error);
  }
}

// ---------------------------------------------------------------- helpers

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normaliseKnownPeople(list) {
  const out = { ids: new Set(), initials: new Set(), names: new Map() };
  if (!Array.isArray(list)) return out;
  for (const p of list.slice(0, 500)) {
    if (!p || typeof p !== "object") continue;
    const id = slugify(p.id || "");
    if (id) out.ids.add(id);
    if (p.initials) out.initials.add(String(p.initials).toUpperCase());
    if (p.name) out.names.set(oneLine(p.name, 80).toLowerCase(), id || slugify(p.name));
  }
  return out;
}

function decodeAttachment(att, folder, baseName) {
  if (!att || !att.base64) return null;
  const name = safeFileName(att.name || "attachment.pdf", 100);
  if (!/\.pdf$/i.test(name)) throw new HttpError(400, "file-type", "Only PDF files can be attached here. Other formats: send them to a maintainer.");
  let buf;
  try {
    buf = Buffer.from(String(att.base64).replace(/^data:[^,]*,/, ""), "base64");
  } catch {
    throw new HttpError(400, "file-encoding", "The attachment could not be decoded.");
  }
  if (buf.length === 0) throw new HttpError(400, "file-empty", "The attached file is empty.");
  if (buf.length > MAX_FILE) throw new HttpError(413, "file-too-large", `The attachment is ${(buf.length / 1048576).toFixed(1)} MB; the limit through the form is 3 MB. Send larger files to a maintainer.`);
  if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") throw new HttpError(400, "file-type", "The attachment does not look like a PDF.");
  const path = `${folder}/${baseName}.pdf`;
  return { path, content: buf.toString("base64"), encoding: "base64", bytes: buf.length, originalName: name };
}

function planSession(s, attachment, known) {
  const date = String(s.date || "");
  if (!isIsoDate(date)) throw new HttpError(400, "date", "The session needs a date (YYYY-MM-DD).");
  const title = oneLine(s.title, 200);
  if (!title) throw new HttpError(400, "title", "The session needs a title.");
  const topic = TOPIC_IDS.includes(s.topic) ? s.topic : "";
  if (!topic) throw new HttpError(400, "topic", "Choose the branch of the Research Atlas the session belongs to.");
  const kind = SESSION_KINDS.includes(s.kind) ? s.kind : "lecture";
  const format = SESSION_FORMATS.includes(s.format) ? s.format : "in-person";
  const start = s.start ? String(s.start) : "";
  const end = s.end ? String(s.end) : "";
  if (start && !isHHMM(start)) throw new HttpError(400, "time", "Start time must be HH:MM.");
  if (end && !isHHMM(end)) throw new HttpError(400, "time", "End time must be HH:MM.");
  const status = s.status === "held" || s.status === "planned" ? s.status : date >= todayIso() ? "planned" : "held";
  const abstract = cleanText(s.abstract, 8000);
  const summary = oneLine(s.summary, 320) || firstSentence(abstract, 240);
  if (!summary) throw new HttpError(400, "summary", "Add a one-sentence summary (or an abstract to take it from).");
  const short = oneLine(s.short, 40) || title.split(/[:\-–]/)[0].split(/\s+/).slice(0, 3).join(" ");
  const venue = oneLine(s.venue, 120) || "UEBS";
  const semester = oneLine(s.semester, 30) || semesterOf(date);
  const journal = oneLine(s.journal, 160);
  const note = oneLine(s.note, 200);
  for (const [label, text] of [["The title", title], ["The abstract", abstract], ["The summary", summary], ["The venue", venue], ["The note", note]]) {
    assertNoForbidden(text, label);
  }

  // speakers: existing ids, or new people described inline
  const speakers = [];
  const speakerNames = [];
  const newPeople = [];
  const files = [];
  const list = Array.isArray(s.speakers) ? s.speakers.slice(0, 6) : [];
  let order = 90;
  for (const sp of list) {
    if (!sp || typeof sp !== "object") continue;
    const name = oneLine(sp.name, 80);
    let id = slugify(sp.id || "");
    if (id && known.ids.size && !known.ids.has(id)) id = ""; // unknown id - fall back to the name
    if (!id && name) id = known.names.get(name.toLowerCase()) || "";
    if (id && (known.ids.has(id) || !name)) {
      speakers.push(id);
      speakerNames.push(name || id);
      continue;
    }
    if (!name) continue;
    id = slugify(name);
    if (known.ids.has(id)) {
      speakers.push(id);
      speakerNames.push(name);
      continue;
    }
    const initials = initialsCandidates(name).find((c) => !known.initials.has(c)) || "XX";
    known.initials.add(initials);
    known.ids.add(id);
    const level = LEVELS.includes(sp.level) ? sp.level : "PhD";
    const field = KNOWN_FIELDS.includes(sp.field) ? sp.field : "Field TBC";
    const bio = cleanText(sp.bio, 600);
    assertNoForbidden(bio, "The speaker biography");
    files.push({
      path: `content/people/${id}.md`,
      content: toFrontmatter({ id, initials, name, kind: "contributor", order: order++, level, field, topic: oneLine(sp.topic, 120), new: true }) + (bio ? "\n" + bio + "\n" : ""),
    });
    newPeople.push({ id, name, initials, level, field });
    speakers.push(id);
    speakerNames.push(name);
  }
  const speakerLabel = oneLine(s.speakerLabel, 60);
  if (speakers.length === 0 && !speakerLabel) throw new HttpError(400, "speakers", "Name at least one speaker (or a label such as \"All members\").");

  const ymd = date.replace(/-/g, "");
  const slug = slugify(short) || slugify(title) || "session";
  const materials = [];
  const att = decodeAttachment(attachment, "assets/talks", `${ymd}_${slugify(short || title, 40)}`);
  if (att) {
    files.push({ path: att.path, content: att.content, encoding: "base64" });
    materials.push({ label: oneLine(s.materialLabel, 40) || "Slides", file: att.path, public: s.materialPublic !== false });
  }
  const url = oneLine(s.materialUrl, 400);
  if (url) {
    if (!/^https?:\/\//i.test(url)) throw new HttpError(400, "url", "The material link must start with http:// or https://");
    assertNoForbidden(url, "The material link");
    materials.push({ label: oneLine(s.materialUrlLabel, 40) || "Link", url });
  }
  const id = `${ymd}_${safeFileName((speakerNames.length ? speakerNames : [speakerLabel]).join(" and "), 60)}_${safeFileName(short || title, 60)}`;
  const front = {
    id,
    type: "session",
    kind,
    status,
    date,
    start,
    end,
    venue,
    format,
    note,
    speakers,
    speaker_label: speakers.length ? "" : speakerLabel,
    title,
    short,
    topic,
    semester,
    journal,
    materials,
    summary,
  };
  files.push({ path: `content/sessions/${date}-${slug}.md`, content: toFrontmatter(front) + (abstract ? "\n" + abstract + "\n" : "") });
  return {
    kindLabel: `Session · ${kind}`,
    title,
    slug,
    date,
    files,
    newPeople,
    commitTitle: `Add session: ${title}`,
    rows: [
      ["Kind", `Session · ${kind} · ${status}`],
      ["When", `${fmtDate(date)}${start ? " · " + start : ""}${end ? "–" + end : ""}`],
      ["Where", `${venue} (${format})`],
      ["Speakers", speakerNames.join(", ") || speakerLabel],
      ["Branch", TOPIC_LABELS[topic]],
      ["Materials", materials.length ? materials.map((m) => m.file ? `${m.label}: ${m.file}${m.public ? "" : " (not public)"}` : `${m.label}: ${m.url}`).join("; ") : "none"],
    ],
  };
}

function planPost(p, attachment, known) {
  const type = POST_TYPES.includes(p.type) ? p.type : "opportunity";
  const cats = POST_CATEGORIES[type];
  const category = cats.includes(p.category) ? p.category : cats[0];
  const date = isIsoDate(p.date) ? String(p.date) : todayIso();
  const title = oneLine(p.title, 200);
  if (!title) throw new HttpError(400, "title", "The post needs a title.");
  const bodyText = cleanText(p.body, 8000);
  const summary = oneLine(p.summary, 400) || firstSentence(bodyText, 240);
  if (!summary) throw new HttpError(400, "summary", "Add a one- or two-sentence summary (or a longer text to take it from).");
  const eventDate = p.event_date ? String(p.event_date) : "";
  const deadline = p.deadline ? String(p.deadline) : "";
  if (eventDate && !isIsoDate(eventDate)) throw new HttpError(400, "date", "The event date must be YYYY-MM-DD.");
  if (deadline && !isIsoDate(deadline)) throw new HttpError(400, "date", "The deadline must be YYYY-MM-DD.");
  const link = oneLine(p.link, 500);
  if (link && !/^https?:\/\//i.test(link)) throw new HttpError(400, "url", "The link must start with http:// or https://");
  for (const [label, text] of [["The title", title], ["The text", bodyText], ["The summary", summary], ["The link", link]]) assertNoForbidden(text, label);
  let source = slugify(p.source || "");
  if (source && known.ids.size && !known.ids.has(source)) source = "";

  const ymd = date.replace(/-/g, "");
  const slug = slugify(title) || "post";
  const files = [];
  const materials = [];
  const att = decodeAttachment(attachment, "assets/posts", `${ymd}_${slugify(title, 40)}`);
  if (att) {
    files.push({ path: att.path, content: att.content, encoding: "base64" });
    materials.push({ label: oneLine(p.materialLabel, 40) || "Attachment (PDF)", file: att.path });
  }
  const visual = ["conference", "cfp"].includes(category) ? "regression"
    : ["hackathon", "competition", "job", "placement"].includes(category) ? "network"
    : "distribution";
  const front = {
    id: `${ymd}_${slug}`,
    type,
    category,
    date,
    event_date: eventDate,
    deadline,
    title,
    source,
    link,
    materials,
    visual,
    img_label: `${type} · ${CATEGORY_LABELS[category].toLowerCase()}`,
    summary,
  };
  files.push({ path: `content/posts/${date}-${slug}.md`, content: toFrontmatter(front) + (bodyText ? "\n" + bodyText + "\n" : "") });
  return {
    kindLabel: `${type} · ${CATEGORY_LABELS[category]}`,
    title,
    slug,
    date,
    files,
    newPeople: [],
    commitTitle: `Add post: ${title}`,
    rows: [
      ["Kind", `${type} · ${CATEGORY_LABELS[category]}`],
      ["Shared on", fmtDate(date)],
      ["Event date", eventDate ? fmtDate(eventDate) : "—"],
      ["Deadline", deadline ? fmtDate(deadline) : "—"],
      ["Link", link || "—"],
      ["Attachment", att ? att.path : "none"],
    ],
  };
}

function firstSentence(text, max) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const m = t.match(/^.{20,}?[.!?](\s|$)/);
  return (m ? m[0] : t).trim().slice(0, max);
}

function prBody(plan, submitter) {
  const rows = plan.rows.map(([k, v]) => `| ${k} | ${escapeCell(v)} |`).join("\n");
  const contact = submitter.contact && submitter.email ? ` (${submitter.email})` : "";
  const newPeople = plan.newPeople.length
    ? `\n\nNew people created: ${plan.newPeople.map((p) => `**${p.name}** (${p.initials}, ${p.level}, ${p.field})`).join(", ")} - check the initials, level and field before approving.`
    : "";
  return `## ${plan.title}

| | |
|---|---|
${rows}
| Submitted by | ${escapeCell(submitter.name)}${contact} |

Files in this pull request:
${plan.files.map((f) => `- \`${f.path}\``).join("\n")}${newPeople}

### How to publish
- **Maintainers:** reply to this notification email with \`/approve\` (or comment it here). The change is merged and the site redeploys on its own.
- Reply \`/changes <what to fix>\` to send it back; the note is posted here for the submitter.
- Wait for the **content check** to turn green; Vercel adds a preview link as a comment so you can look at the rendered page first.

_Created by the website intake form (api/submit)._`;
}

function escapeCell(v) {
  return String(v).replace(/\|/g, "\\|").replace(/\n/g, " ");
}
