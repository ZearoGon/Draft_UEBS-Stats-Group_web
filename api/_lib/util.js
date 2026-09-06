// Shared helpers for the site's serverless functions (api/*.js).
// Runtime: Vercel Functions (Node.js, web-standard Request/Response).

import { createHash, timingSafeEqual } from "node:crypto";

// Keep these in step with scripts/content.mjs.
export const TOPIC_IDS = ["core", "stat", "econ", "asset", "credit", "ai", "risk"];
export const TOPIC_LABELS = {
  core: "Statistics (trunk)",
  stat: "Statistical Methods",
  econ: "Econometrics",
  asset: "Asset Pricing",
  credit: "Credit Research",
  ai: "AI & Machine Learning",
  risk: "Risk Management",
};
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
export const LEVELS = ["Faculty", "PhD", "Visiting PhD"];
export const SESSION_KINDS = ["lecture", "workshop", "discussion"];
export const SESSION_FORMATS = ["in-person", "online", "hybrid"];
export const POST_TYPES = ["event", "opportunity", "announcement", "blog"];
export const POST_CATEGORIES = {
  event: ["seminar", "lecture", "conference", "workshop", "hackathon", "competition"],
  opportunity: ["cfp", "summer-school", "job", "placement", "funding", "volunteering"],
  announcement: ["announcement"],
  blog: ["blog"],
};
export const CATEGORY_LABELS = {
  blog: "Blog",
  announcement: "Announcement",
  conference: "Conference",
  cfp: "Call for papers",
  "summer-school": "Summer school",
  seminar: "Seminar",
  lecture: "Public lecture",
  workshop: "Workshop",
  hackathon: "Hackathon",
  competition: "Competition",
  job: "Recruitment",
  placement: "Internship & placement",
  funding: "Funding & fellowships",
  volunteering: "Volunteering",
};
// Meeting links and passcodes never reach the repository.
const FORBIDDEN = [
  [/teams\.microsoft\.com/i, "a Microsoft Teams link"],
  [/zoom\.us\/j\//i, "a Zoom meeting link"],
  [/\bpasscode\b/i, "a meeting passcode"],
  [/meeting id:/i, "a meeting id"],
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export class HttpError extends Error {
  constructor(status, code, detail) {
    super(detail || code);
    this.status = status;
    this.code = code;
    this.detail = detail || "";
  }
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extraHeaders },
  });
}

export function errorResponse(error) {
  if (error instanceof HttpError) return json({ ok: false, error: error.code, detail: error.detail }, error.status);
  console.error(error);
  return json({ ok: false, error: "internal", detail: String(error && error.message ? error.message : error) }, 500);
}

export async function readJson(request, maxBytes = 1_000_000) {
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new HttpError(413, "payload-too-large", `The request is larger than ${Math.round(maxBytes / 1e6)} MB.`);
  try {
    const data = JSON.parse(text || "{}");
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("not an object");
    return data;
  } catch {
    throw new HttpError(400, "bad-json", "The request body is not valid JSON.");
  }
}

export function clientIp(request) {
  const xf = request.headers.get("x-forwarded-for");
  const ip = xf ? xf.split(",")[0] : request.headers.get("x-real-ip") || "0.0.0.0";
  return ip.trim();
}

// A daily-rotating hash of the address: enough to rate-limit, useless to identify.
export function ipKey(request) {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${clientIp(request)}|${process.env.RATE_SALT || "ssg"}|${day}`).digest("hex").slice(0, 16);
}

const buckets = new Map();
// In-memory limiter; per warm instance. It is a courtesy brake, not a security boundary.
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

export function safeEqual(a, b) {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function requirePassphrase(envName, given) {
  const expected = process.env[envName];
  if (!expected) return;
  if (!given || !safeEqual(given, expected)) throw new HttpError(401, "passphrase", "The passphrase is missing or wrong. Ask a maintainer for it.");
}

export function stripHtml(s) {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

export function cleanText(s, max) {
  return stripHtml(s)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

export function oneLine(s, max) {
  return cleanText(s, max * 2).replace(/\s+/g, " ").trim().slice(0, max);
}

export function stripUrls(s) {
  return String(s ?? "").replace(/\bhttps?:\/\/\S+/gi, "[link removed]").replace(/\bwww\.\S+/gi, "[link removed]");
}

export function slugify(s, max = 48) {
  return String(s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

export function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s)) && !Number.isNaN(Date.parse(s));
}

export function isHHMM(s) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s));
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

export function semesterOf(iso) {
  const m = Number(iso.slice(5, 7));
  const y = iso.slice(0, 4);
  return m <= 6 ? `Spring ${y}` : m <= 8 ? `Summer ${y}` : `Autumn ${y}`;
}

export function findForbidden(text) {
  for (const [re, what] of FORBIDDEN) if (re.test(text)) return what;
  return null;
}

export function assertNoForbidden(text, where) {
  const what = findForbidden(text);
  if (what) throw new HttpError(400, "forbidden-content", `${where} contains ${what}. Meeting details are never published - remove them and try again.`);
}

// YAML frontmatter with JSON-quoted scalars (valid YAML, no quoting surprises).
export function toFrontmatter(fields) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      if (v.every((x) => typeof x !== "object")) lines.push(`${k}: [${v.map((x) => JSON.stringify(x)).join(", ")}]`);
      else {
        lines.push(`${k}:`);
        for (const x of v) lines.push(`  - ${JSON.stringify(x)}`);
      }
    } else if (typeof v === "object") {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    } else if (typeof v === "boolean" || typeof v === "number") {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${JSON.stringify(String(v))}`);
    }
  }
  lines.push("---");
  return lines.join("\n") + "\n";
}

export function initialsCandidates(name) {
  const words = String(name)
    .replace(/\b(Dr|Prof|Professor|Mr|Ms|Mrs)\.?\s+/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return ["XX"];
  const first = words[0];
  const last = words[words.length - 1];
  const up = (s) => s.replace(/[^a-z]/gi, "").toUpperCase();
  const out = [];
  if (words.length > 1) {
    out.push(up(first[0] + last[0]));
    if (last.length > 1) out.push(up(first[0] + last[1]));
    if (first.length > 1) out.push(up(first[1] + last[0]));
  } else {
    out.push(up(first.slice(0, 2)));
  }
  for (let i = 2; i < 10; i++) out.push(up(first[0] + last[0]) + i);
  return out.filter((x) => x.length >= 2);
}

export function safeFileName(s, max = 80) {
  return String(s ?? "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}
