// Compiles the Markdown/JSON content under content/ into the data the site consumes.
//
//   content/site.json          -> site-wide settings (hero slides, founding year, contact)
//   content/topics/*.md        -> the seven branches of the Research Atlas (+ the topic sub-pages)
//   content/people/*.md        -> maintainers, contributors and members
//   content/sessions/*.md      -> one file per session (lecture / workshop / discussion)
//   content/posts/*.md         -> blog posts, opportunities, announcements
//
// Outputs (all derived - never edit them by hand):
//   assets/data.json           -> canonical compiled data
//   assets/data.js             -> the same data as `window.SSG_DATA = {...}` for the pages
//   topics/*.html              -> rendered from src/templates/topic.html
//   contributors.html          -> its CONTRIBUTORS block is regenerated in place
//
// Usage:  node scripts/content.mjs           (validate + write)
//         node scripts/content.mjs --check   (validate only)
// scripts/build.mjs imports compileContent() and runs it first.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { marked } from "marked";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(projectRoot, "content");

// Fields must have a colour in ART.deepsky.hue (src/index.source.html). Add the
// colour first, then the field here - an unknown field would blank the canvas.
export const KNOWN_FIELDS = [
  "MSBE",
  "FinTech",
  "Accounting & Finance",
  "MSBE & Finance",
  "Finance",
  "Economics & Finance",
  "Marketing",
  "School of Mathematics",
  "Field TBC",
];
const PERSON_KINDS = ["maintainer", "contributor", "member"];
const SESSION_KINDS = ["lecture", "workshop", "discussion"];
const SESSION_STATUS = ["planned", "held", "postponed", "cancelled"];
const SESSION_FORMATS = ["in-person", "online", "hybrid"];
const POST_TYPES = ["blog", "opportunity", "announcement"];
const POST_CATEGORIES = {
  blog: "Blog",
  announcement: "Announcement",
  conference: "Conference",
  cfp: "Call for papers",
  "summer-school": "Summer school",
  seminar: "Seminar",
  workshop: "Workshop",
  hackathon: "Hackathon",
  job: "Recruitment",
  funding: "Funding & placements",
  volunteering: "Volunteering",
};
const VISUALS = ["distribution", "network", "regression", "breaks"];
// Meeting links and passcodes must never reach the public site.
const FORBIDDEN = [
  [/teams\.microsoft\.com/i, "a Microsoft Teams link"],
  [/zoom\.us\/j\//i, "a Zoom meeting link"],
  [/\bpasscode\b/i, "a meeting passcode"],
  [/meeting id:/i, "a meeting id"],
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^\d{2}:\d{2}$/;

class ContentError extends Error {}

function fail(messages) {
  throw new ContentError("[content] " + messages.join("\n[content] "));
}

function parseFrontmatter(text, file) {
  const m = text.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) fail([`${file}: missing frontmatter block`]);
  let data;
  try {
    data = yaml.load(m[1]) || {};
  } catch (error) {
    fail([`${file}: invalid YAML frontmatter - ${error.message}`]);
  }
  if (typeof data !== "object" || Array.isArray(data)) fail([`${file}: frontmatter must be a mapping`]);
  return { data, body: m[2].trim() };
}

function readCollection(sub) {
  const dir = join(contentDir, sub);
  if (!existsSync(dir)) fail([`missing directory content/${sub}`]);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const file = `content/${sub}/${f}`;
      const { data, body } = parseFrontmatter(readFileSync(join(dir, f), "utf8"), file);
      return { file, slug: basename(f, ".md"), data, body };
    });
}

function fmtDate(iso) {
  const [y, mo, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[mo - 1]} ${y}`;
}

function encodePath(p) {
  return encodeURI(p).replace(/#/g, "%23").replace(/\?/g, "%3F");
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function md(body) {
  return marked.parse(body, { gfm: true, breaks: false }).trim();
}

function scanForbidden(text, where, errors) {
  for (const [re, what] of FORBIDDEN) {
    if (re.test(text)) errors.push(`${where}: contains ${what} - remove it, meeting details are never published`);
  }
}

function localFileExists(rel) {
  const p = join(projectRoot, rel);
  return existsSync(p) && statSync(p).isFile();
}

// ---------------------------------------------------------------- loading

function loadSite(errors) {
  const p = join(contentDir, "site.json");
  if (!existsSync(p)) fail(["missing content/site.json"]);
  const site = JSON.parse(readFileSync(p, "utf8"));
  if (!Number.isInteger(site.founded)) errors.push("site.json: founded must be a year");
  const slides = site.hero?.slides;
  if (!Array.isArray(slides) || slides.length === 0) errors.push("site.json: hero.slides must be a non-empty list");
  else slides.forEach((s, i) => {
    if (!s.src || !s.label) errors.push(`site.json: hero.slides[${i}] needs src and label`);
  });
  return site;
}

function loadTopics(errors) {
  const topics = readCollection("topics").map(({ file, data, body }) => {
    for (const k of ["id", "label", "x", "y", "blurb"]) {
      if (data[k] === undefined || data[k] === "") errors.push(`${file}: missing ${k}`);
    }
    if (data.page) {
      for (const k of ["file", "title", "eyebrow", "h1", "desc", "related"]) {
        if (!data.page[k]) errors.push(`${file}: page.${k} is required when page is set`);
      }
    }
    return {
      id: data.id,
      label: data.label,
      caption: data.caption || "",
      order: data.order ?? 99,
      x: data.x,
      y: data.y,
      href: data.href || "",
      blurb: data.blurb,
      page: data.page || null,
      introHtml: body, // raw HTML, not Markdown - it is the hand-written intro of the sub-page
    };
  });
  topics.sort((a, b) => a.order - b.order);
  const ids = new Set(topics.map((t) => t.id));
  if (ids.size !== topics.length) errors.push("topics: duplicate ids");
  return topics;
}

function loadPeople(errors) {
  const people = readCollection("people").map(({ file, slug, data, body }) => {
    for (const k of ["id", "initials", "name", "kind", "field"]) {
      if (!data[k]) errors.push(`${file}: missing ${k}`);
    }
    if (data.id && data.id !== slug) errors.push(`${file}: id "${data.id}" must match the file name`);
    if (data.kind && !PERSON_KINDS.includes(data.kind)) errors.push(`${file}: kind must be one of ${PERSON_KINDS.join(", ")}`);
    if (data.field && !KNOWN_FIELDS.includes(data.field)) {
      errors.push(`${file}: field "${data.field}" has no colour yet - add it to ART.deepsky.hue in src/index.source.html and to KNOWN_FIELDS in scripts/content.mjs`);
    }
    if (data.kind === "member" && !Number.isInteger(data.slot)) errors.push(`${file}: members sit on the ring and need a slot number`);
    if (data.kind !== "member" && data.slot !== undefined) errors.push(`${file}: only members have a slot`);
    if (data.introduced_date && !ISO_DATE.test(String(data.introduced_date))) errors.push(`${file}: introduced_date must be YYYY-MM-DD`);
    scanForbidden(body, file, errors);
    return {
      id: data.id,
      initials: data.initials,
      name: data.name,
      kind: data.kind,
      order: data.order ?? 99,
      slot: Number.isInteger(data.slot) ? data.slot : null,
      role: data.role || "",
      speakerRole: data.speaker_role || "",
      standing: data.standing || "",
      field: data.field,
      topic: data.topic || "",
      email: data.email || "",
      bio: body,
      isNew: data.new === true,
      contributorFlag: data.contributor === true,
      introducedId: data.introduced || "",
      introducedDate: data.introduced_date ? String(data.introduced_date) : "",
      ties: Array.isArray(data.ties) ? data.ties : [],
      extraLectures: Array.isArray(data.extra_lectures) ? data.extra_lectures : [],
    };
  });
  const ids = new Map(people.map((p) => [p.id, p]));
  const initials = new Set();
  for (const p of people) {
    if (initials.has(p.initials)) errors.push(`people: initials "${p.initials}" used twice`);
    initials.add(p.initials);
    if (p.introducedId && !ids.has(p.introducedId)) errors.push(`content/people/${p.id}.md: introduced "${p.introducedId}" is not a person`);
    for (const t of p.ties) if (!ids.has(t)) errors.push(`content/people/${p.id}.md: tie "${t}" is not a person`);
  }
  return people;
}

function normaliseMaterials(list, file, errors) {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) {
    errors.push(`${file}: materials must be a list`);
    return [];
  }
  return list
    .map((m, i) => {
      const where = `${file}: materials[${i}]`;
      if (!m || typeof m !== "object") { errors.push(`${where}: must be an object`); return null; }
      if (!m.label) errors.push(`${where}: missing label`);
      if (!m.file && !m.url) errors.push(`${where}: needs file or url`);
      if (m.file && !localFileExists(m.file)) errors.push(`${where}: file not found: ${m.file}`);
      if (m.url) scanForbidden(m.url, where, errors);
      const isPublic = m.public !== false;
      return {
        label: m.label || "",
        file: m.file || "",
        url: m.url || "",
        public: isPublic,
        href: isPublic ? (m.file ? encodePath(m.file) : m.url) : "",
      };
    })
    .filter(Boolean);
}

function loadSessions(topics, people, errors) {
  const topicIds = new Set(topics.map((t) => t.id));
  const byId = new Map(people.map((p) => [p.id, p]));
  const seenIds = new Set();
  const sessions = readCollection("sessions").map(({ file, slug, data, body }) => {
    for (const k of ["id", "date", "title", "short", "topic"]) {
      if (!data[k]) errors.push(`${file}: missing ${k}`);
    }
    const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || "");
    if (!ISO_DATE.test(date)) errors.push(`${file}: date must be YYYY-MM-DD (quote it)`);
    if (!slug.startsWith(date)) errors.push(`${file}: file name must start with the date ${date}`);
    if (data.id) {
      if (seenIds.has(data.id)) errors.push(`${file}: duplicate id ${data.id}`);
      seenIds.add(data.id);
    }
    const kind = data.kind || "lecture";
    const status = data.status || "held";
    const format = data.format || "in-person";
    if (!SESSION_KINDS.includes(kind)) errors.push(`${file}: kind must be one of ${SESSION_KINDS.join(", ")}`);
    if (!SESSION_STATUS.includes(status)) errors.push(`${file}: status must be one of ${SESSION_STATUS.join(", ")}`);
    if (!SESSION_FORMATS.includes(format)) errors.push(`${file}: format must be one of ${SESSION_FORMATS.join(", ")}`);
    if (data.topic && !topicIds.has(data.topic)) errors.push(`${file}: topic "${data.topic}" is not in content/topics`);
    const also = Array.isArray(data.also) ? data.also : [];
    for (const t of also) if (!topicIds.has(t)) errors.push(`${file}: also "${t}" is not in content/topics`);
    const speakers = Array.isArray(data.speakers) ? data.speakers : [];
    for (const s of speakers) if (!byId.has(s)) errors.push(`${file}: speaker "${s}" is not in content/people`);
    if (speakers.length === 0 && !data.speaker_label) errors.push(`${file}: needs speakers or a speaker_label`);
    if (data.moderator && !byId.has(data.moderator)) errors.push(`${file}: moderator "${data.moderator}" is not in content/people`);
    if (data.introduced_by && !byId.has(data.introduced_by)) errors.push(`${file}: introduced_by "${data.introduced_by}" is not in content/people`);
    for (const k of ["start", "end"]) {
      if (data[k] !== undefined && !HHMM.test(String(data[k]))) errors.push(`${file}: ${k} must be HH:MM (quote it)`);
    }
    if (data.visual && !VISUALS.includes(data.visual)) errors.push(`${file}: visual must be one of ${VISUALS.join(", ")}`);
    if (data.cover && !/^https?:/.test(data.cover) && !localFileExists(data.cover)) errors.push(`${file}: cover not found: ${data.cover}`);
    if (!data.summary) errors.push(`${file}: missing summary (one sentence, used on cards)`);
    scanForbidden(body + " " + JSON.stringify(data), file, errors);
    const materials = normaliseMaterials(data.materials, file, errors);
    const start = data.start ? String(data.start) : "";
    const end = data.end ? String(data.end) : "";
    const speakerNames = speakers.length
      ? speakers.map((s) => byId.get(s)?.name || s).join(", ")
      : data.speaker_label || "";
    const firstFile = materials.find((m) => m.public && m.file);
    const firstAny = materials.find((m) => m.public);
    return {
      id: data.id,
      slug,
      date,
      dateLabel: ISO_DATE.test(date) ? fmtDate(date) : date,
      dateVerified: data.date_verified !== false,
      dateNote: data.date_note || "",
      start,
      end,
      timeLabel: start && end ? `${start} - ${end}` : start,
      venue: data.venue || "",
      format,
      kind,
      status,
      note: data.note || "",
      speakers,
      speakerNames,
      moderator: data.moderator ? byId.get(data.moderator)?.name || "" : "",
      introducedBy: data.introduced_by || "",
      title: data.title,
      short: data.short,
      topic: data.topic,
      also,
      semester: data.semester || "",
      journal: data.journal || "",
      materials,
      pdf: firstFile ? firstFile.href : firstAny ? firstAny.href : "",
      summary: data.summary || "",
      bodyHtml: body ? md(body) : "",
      featured: data.featured === true,
      visual: data.visual || "distribution",
      cover: data.cover || "",
      coverAlt: data.cover_alt || "",
      imgLabel: data.img_label || `${kind} · ${String(data.short || "").toLowerCase()}`,
    };
  });
  sessions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return sessions;
}

function loadPosts(people, errors) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const posts = readCollection("posts").map(({ file, slug, data, body }) => {
    for (const k of ["id", "type", "category", "date", "title", "summary"]) {
      if (!data[k]) errors.push(`${file}: missing ${k}`);
    }
    const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || "");
    if (!ISO_DATE.test(date)) errors.push(`${file}: date must be YYYY-MM-DD (quote it)`);
    if (!slug.startsWith(date)) errors.push(`${file}: file name must start with the date ${date}`);
    if (data.type && !POST_TYPES.includes(data.type)) errors.push(`${file}: type must be one of ${POST_TYPES.join(", ")}`);
    if (data.category && !POST_CATEGORIES[data.category]) errors.push(`${file}: category must be one of ${Object.keys(POST_CATEGORIES).join(", ")}`);
    for (const k of ["event_date", "deadline"]) {
      const v = data[k] instanceof Date ? data[k].toISOString().slice(0, 10) : data[k];
      if (v !== undefined && !ISO_DATE.test(String(v))) errors.push(`${file}: ${k} must be YYYY-MM-DD (quote it)`);
    }
    if (data.source && !byId.has(data.source)) errors.push(`${file}: source "${data.source}" is not in content/people`);
    if (data.visual && !VISUALS.includes(data.visual)) errors.push(`${file}: visual must be one of ${VISUALS.join(", ")}`);
    if (data.cover && !/^https?:/.test(data.cover) && !localFileExists(data.cover)) errors.push(`${file}: cover not found: ${data.cover}`);
    if (data.link) scanForbidden(data.link, file, errors);
    scanForbidden(body + " " + JSON.stringify(data), file, errors);
    const materials = normaliseMaterials(data.materials, file, errors);
    const eventDate = data.event_date ? String(data.event_date instanceof Date ? data.event_date.toISOString().slice(0, 10) : data.event_date) : "";
    const deadline = data.deadline ? String(data.deadline instanceof Date ? data.deadline.toISOString().slice(0, 10) : data.deadline) : "";
    return {
      id: data.id,
      slug,
      type: data.type,
      category: data.category,
      categoryLabel: POST_CATEGORIES[data.category] || data.category,
      date,
      dateLabel: ISO_DATE.test(date) ? fmtDate(date) : date,
      eventDate,
      eventDateLabel: eventDate ? fmtDate(eventDate) : "",
      deadline,
      deadlineLabel: deadline ? fmtDate(deadline) : "",
      title: data.title,
      source: data.source ? byId.get(data.source)?.name || "" : "",
      authors: Array.isArray(data.authors) ? data.authors.map((a) => byId.get(a)?.name || a) : [],
      link: data.link || "",
      href: data.href || "",
      materials,
      visual: data.visual || "distribution",
      cover: data.cover || "",
      coverAlt: data.cover_alt || "",
      imgLabel: data.img_label || `${data.type} · ${(POST_CATEGORIES[data.category] || "").toLowerCase()}`,
      summary: data.summary || "",
      bodyHtml: body ? md(body) : "",
    };
  });
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

// ---------------------------------------------------------------- deriving

function derivePeople(people, sessions) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const initialsOf = (id) => byId.get(id)?.initials || "";
  const out = people.map((p) => {
    const lectures = sessions
      .filter((s) => s.speakers.includes(p.id) && s.status !== "cancelled")
      .map((s) => ({
        title: s.title,
        date: s.dateLabel,
        pdf: s.pdf,
        venue: s.journal || undefined,
        sessionId: s.id,
      }));
    for (const x of p.extraLectures) lectures.push({ title: x.title, date: String(x.date || ""), pdf: x.pdf || "" });
    const speakerRole = p.speakerRole || (p.kind === "maintainer" && lectures.length ? `${p.role} & Speaker` : p.role);
    return {
      id: p.id,
      initials: p.initials,
      name: p.name,
      kind: p.kind,
      order: p.order,
      slot: p.slot,
      role: p.role,
      speakerRole,
      standing: p.standing,
      field: p.field,
      topic: p.topic,
      email: p.email,
      bio: p.bio,
      lectures,
      introduced: p.introducedId ? initialsOf(p.introducedId) : "",
      introducedDate: p.introducedDate ? fmtDate(p.introducedDate) : "",
      new: p.isNew,
      contributor: p.contributorFlag || lectures.length > 0 || !!p.introducedId,
    };
  });
  const rank = { maintainer: 0, contributor: 1, member: 2 };
  out.sort((a, b) => rank[a.kind] - rank[b.kind] || a.order - b.order || a.name.localeCompare(b.name));
  const ties = [];
  const seen = new Set();
  for (const p of people) {
    for (const t of p.ties) {
      const pair = [p.initials, initialsOf(t)].sort();
      const key = pair.join("|");
      if (!seen.has(key)) { seen.add(key); ties.push([p.initials, initialsOf(t)]); }
    }
  }
  return { people: out, ties };
}

function deriveNews(sessions, posts, topics) {
  const topicHref = new Map(topics.map((t) => [t.id, t.href]));
  const cards = [];
  for (const s of sessions) {
    if (!s.featured || s.status === "cancelled") continue;
    cards.push({
      kind: "lecture",
      cat: s.kind === "workshop" ? "Workshop" : s.kind === "discussion" ? "Discussion" : "Lecture",
      sub: s.speakerNames,
      date: s.date,
      dateLabel: s.dateLabel,
      title: s.title,
      excerpt: s.summary,
      img: s.imgLabel,
      visual: s.visual,
      cover: s.cover,
      coverAlt: s.coverAlt,
      href: s.pdf || topicHref.get(s.topic) || "",
      external: false,
      deadline: "",
      deadlineLabel: "",
      sessionId: s.id,
    });
  }
  for (const p of posts) {
    const href = p.link || p.href || (p.materials.find((m) => m.href)?.href ?? "");
    cards.push({
      kind: p.type,
      cat: p.type === "blog" ? "Blog" : p.type === "announcement" ? "Announcement" : "Opportunity",
      sub: p.type === "blog" ? (p.authors[0] || "") : p.categoryLabel,
      date: p.date,
      dateLabel: p.dateLabel,
      title: p.title,
      excerpt: p.summary,
      img: p.imgLabel,
      visual: p.visual,
      cover: p.cover,
      coverAlt: p.coverAlt,
      href,
      external: /^https?:/.test(href),
      deadline: p.deadline,
      deadlineLabel: p.deadlineLabel,
      eventDate: p.eventDate,
      eventDateLabel: p.eventDateLabel,
      postId: p.id,
    });
  }
  cards.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return cards;
}

function deriveStats(site, people, sessions) {
  const held = sessions.filter((s) => s.status === "held");
  return {
    maintainers: people.filter((p) => p.kind === "maintainer").length,
    contributors: people.filter((p) => p.contributor).length,
    lectures: held.filter((s) => s.kind !== "discussion").length,
    sessions: held.length,
    topics: new Set(held.map((s) => s.topic).filter((t) => t !== "core")).size,
    founded: site.founded,
  };
}

// ---------------------------------------------------------------- rendering

function lectureCard(s, rel) {
  const who = s.kind === "discussion" ? "Discussion" : s.kind === "workshop" ? "Workshop" : "Lecture";
  const cat = `${who} · ${escapeHtml(s.speakerNames)} · ${s.dateLabel}`;
  const links = s.materials
    .filter((m) => m.public && m.href)
    .map((m) => {
      const href = m.file ? rel + m.href : m.href;
      const ext = m.file ? "" : ' rel="noopener noreferrer"';
      return `<a href="${escapeHtml(href)}" target="_blank"${ext}>${escapeHtml(m.label)} →</a>`;
    })
    .join(" · ");
  const tail = links ? ` - ${links}` : "";
  const summary = links ? s.summary.replace(/[.]\s*$/, "") : s.summary;
  return [
    '  <div class="post-card">',
    `    <div class="cat">${cat}</div>`,
    `    <h4>${escapeHtml(s.title)}</h4>`,
    `    <p>${escapeHtml(summary)}${tail}</p>`,
    "  </div>",
  ].join("\n");
}

function renderTopicPage(topic, topics, sessions, template) {
  const rel = "../";
  const held = sessions.filter((s) => s.status !== "cancelled" && s.status !== "postponed");
  const primary = held.filter((s) => s.topic === topic.id);
  const cross = held.filter((s) => s.topic !== topic.id && s.also.includes(topic.id));
  const parts = [];
  if (primary.length) {
    parts.push(`  <h2>Lectures on this branch</h2>`);
    parts.push(...primary.map((s) => lectureCard(s, rel)));
  }
  if (cross.length) {
    parts.push(`  <h2>Related lectures from other branches</h2>`);
    parts.push(...cross.map((s) => lectureCard(s, rel)));
  }
  if (!primary.length && !cross.length) {
    parts.push('  <div class="wip">');
    parts.push('    <div class="icon">🔬</div>');
    parts.push("    <h3>Content Under Construction</h3>");
    parts.push(`    <p>Detailed blog posts and materials for ${escapeHtml(stripTags(topic.page.h1))} are being developed. The first dedicated lecture is waiting for a speaker - join the study group to contribute!</p>`);
    parts.push("  </div>");
  }
  const byId = new Map(topics.map((t) => [t.id, t]));
  const related = topic.page.related
    .map((id) => byId.get(id))
    .filter((t) => t && t.page)
    .map((t) => {
      const label = ["stat", "econ", "core"].includes(t.id) ? "Methodology" : "Finance";
      return [
        `    <a href="${basename(t.page.file)}">`,
        `      <div class="label">${label}</div>`,
        `      <div class="name">${escapeHtml(stripTags(t.page.h1))}</div>`,
        "    </a>",
      ].join("\n");
    })
    .join("\n");
  const intro = topic.introHtml ? "  " + topic.introHtml.replace(/\n/g, "\n") : "";
  return template
    .replace("{{TITLE}}", escapeHtml(topic.page.title))
    .replace("{{META_DESC}}", escapeHtml(topic.page.meta_description || topic.page.desc))
    .replace("{{EYEBROW}}", escapeHtml(topic.page.eyebrow))
    .replace("{{H1}}", topic.page.h1)
    .replace("{{DESC}}", escapeHtml(topic.page.desc))
    .replace("{{INTRO}}", intro)
    .replace("{{LECTURES}}", parts.join("\n"))
    .replace("{{RELATED}}", related)
    .replace("{{YEAR}}", String(new Date().getFullYear()));
}

function patchContributorsPage(people) {
  const p = join(projectRoot, "contributors.html");
  if (!existsSync(p)) return false;
  const html = readFileSync(p, "utf8");
  const eol = html.includes("\r\n") ? "\r\n" : "\n";
  const list = people
    .filter((x) => x.lectures.length > 0 && x.kind !== "member")
    .map((x) => ({
      initials: x.initials,
      name: x.name,
      role: x.speakerRole || x.role,
      field: x.field,
      topic: x.topic,
      bio: x.bio,
      talks: x.lectures.map((l) => ({ title: l.title, date: l.date, pdf: l.pdf || "" })),
    }));
  const json = JSON.stringify(list, null, 2).replace(/</g, "\\u003c").replace(/\n/g, eol + "    ");
  const block = `/*SSG-CONTRIBUTORS-BEGIN generated from content/ by scripts/content.mjs - do not edit */${eol}    const CONTRIBUTORS = ${json};${eol}    /*SSG-CONTRIBUTORS-END*/`;
  let out;
  if (html.includes("/*SSG-CONTRIBUTORS-BEGIN")) {
    out = html.replace(/\/\*SSG-CONTRIBUTORS-BEGIN[\s\S]*?\/\*SSG-CONTRIBUTORS-END\*\//, block);
  } else {
    const m = html.match(/[ \t]*const CONTRIBUTORS = \[[\s\S]*?\r?\n[ \t]*\];/);
    if (!m) fail(["contributors.html: cannot find the CONTRIBUTORS block to replace"]);
    out = html.slice(0, m.index) + "    " + block + html.slice(m.index + m[0].length);
  }
  if (out !== html) writeFileSync(p, out, "utf8");
  return out !== html;
}

// ---------------------------------------------------------------- main

export function compileContent({ write = true } = {}) {
  const errors = [];
  const site = loadSite(errors);
  const topics = loadTopics(errors);
  const rawPeople = loadPeople(errors);
  const sessions = loadSessions(topics, rawPeople, errors);
  const posts = loadPosts(rawPeople, errors);
  if (errors.length) fail(errors);

  const { people, ties } = derivePeople(rawPeople, sessions);
  const news = deriveNews(sessions, posts, topics);
  const stats = deriveStats(site, people, sessions);
  const data = {
    generatedAt: new Date().toISOString(),
    site,
    stats,
    fields: KNOWN_FIELDS,
    topics: topics.map(({ introHtml, page, ...t }) => ({ ...t, hasPage: !!page })),
    people,
    ties,
    sessions,
    posts,
    news,
  };

  const summary = `${sessions.length} sessions, ${posts.length} posts, ${people.length} people, ${topics.length} topics`;
  if (!write) return { data, summary, written: [] };

  const written = [];
  const assetsDir = join(projectRoot, "assets");
  if (!existsSync(assetsDir)) mkdirSync(assetsDir);
  const json = JSON.stringify(data, null, 2);
  writeFileSync(join(assetsDir, "data.json"), json + "\n", "utf8");
  written.push("assets/data.json");
  const js = "// Generated from content/ by scripts/content.mjs - do not edit.\n" +
    "window.SSG_DATA = " + JSON.stringify(data).replace(/</g, "\\u003c") + ";\n";
  writeFileSync(join(assetsDir, "data.js"), js, "utf8");
  written.push("assets/data.js");

  const templatePath = join(projectRoot, "src", "templates", "topic.html");
  if (!existsSync(templatePath)) fail(["missing src/templates/topic.html"]);
  const template = readFileSync(templatePath, "utf8");
  for (const t of topics) {
    if (!t.page) continue;
    const out = join(projectRoot, t.page.file);
    const dir = dirname(out);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(out, renderTopicPage(t, topics, sessions, template), "utf8");
    written.push(t.page.file);
  }
  if (patchContributorsPage(people)) written.push("contributors.html");
  return { data, summary, written };
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  const checkOnly = process.argv.includes("--check");
  try {
    const { summary, written } = compileContent({ write: !checkOnly });
    console.log(`[content] ${checkOnly ? "valid" : "compiled"}: ${summary}${written.length ? " -> " + written.join(", ") : ""}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
