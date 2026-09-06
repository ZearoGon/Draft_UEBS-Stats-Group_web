// POST /api/parse - reads a pasted announcement email and returns the fields the
// submit form needs, extracted by Claude with a fixed JSON schema. The form always
// shows the result for a human to check before anything is submitted.
// Requires ANTHROPIC_API_KEY on the deployment; without it the form falls back to
// its built-in heuristic parser.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { HttpError, cleanText, errorResponse, ipKey, json, rateLimit, readJson } from "./_lib/util.js";

const MODEL = process.env.PARSE_MODEL || "claude-opus-5";

const Extracted = z.object({
  kind: z.enum(["session", "event", "opportunity", "announcement", "unknown"]),
  confidence: z.enum(["high", "medium", "low"]),
  title: z.string(),
  date: z.string(),
  start: z.string(),
  end: z.string(),
  venue: z.string(),
  format: z.enum(["in-person", "online", "hybrid", ""]),
  speakers: z.array(z.string()),
  speaker_affiliation: z.string(),
  moderator: z.string(),
  topic: z.enum(["core", "stat", "econ", "asset", "credit", "ai", "risk", ""]),
  short: z.string(),
  summary: z.string(),
  abstract: z.string(),
  category: z.enum(["seminar", "lecture", "conference", "workshop", "hackathon", "competition", "cfp", "summer-school", "job", "placement", "funding", "volunteering", "announcement", ""]),
  event_date: z.string(),
  deadline: z.string(),
  link: z.string(),
  organiser: z.string(),
  forwarded_by: z.string(),
  notes: z.string(),
});

const SYSTEM = `You extract structured fields from emails circulated in the UEBS Statistics Study Group, a PhD-led study group at the University of Edinburgh Business School. Return only what the email supports; leave unknown fields as empty strings. Never invent dates, names or links.

Two kinds of email arrive:
1. The group's own session announcements (a member presents; typically "Title", "Abstract", "When", "Where"; Boardroom, 4th Floor, UEBS; 17:00-18:00). kind = "session".
2. Forwarded external items. kind = "event" if it is something to attend (seminar, public lecture, conference, workshop, hackathon, competition); kind = "opportunity" if it is something to apply for or submit to (call for papers, summer school, job/recruitment, internship/placement, funding/fellowship, volunteering).

Rules:
- date, event_date and deadline are ISO YYYY-MM-DD. If the year is missing, infer it from the email's sent date given in the input; if that is missing too, leave the field empty.
- start/end are HH:MM (24 h). "17:00–18:00" means start 17:00, end 18:00.
- abstract: the abstract or description verbatim (plain text, no signatures, no meeting links). summary: one sentence of your own, at most 40 words.
- For sessions: topic is the Research Atlas branch - core (research craft/tooling such as Git, or group-wide discussions), stat (estimation, sampling, Bayesian methods, change-point detection, clustering), econ (causal inference, IV, DiD, matching, mechanism analysis, empirical marketing methods), asset (asset pricing, factors, returns), credit (credit scoring, default prediction), ai (machine learning, deep learning, LLMs, AI workflows, synthetic data), risk (risk forecasting, covariance, volatility). short is a 1-3 word label for the atlas.
- speakers: full names only, no titles. speaker_affiliation: e.g. "first-year PhD, Marketing Group".
- Strip Microsoft Teams links, meeting IDs and passcodes entirely; never copy them into any field.
- link: the single most useful public URL (registration, job advert, conference page); unwrap Outlook safelinks (the real URL is in the "url=" query parameter, percent-decoded). Never a Teams or Zoom link.
- forwarded_by: the group member who forwarded the item, if visible (e.g. "Zexun Chen", "Heqing Shi").
- notes: anything a maintainer should double-check, in one line.`;

let client = null;

export async function GET() {
  return json({ ok: true, available: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL });
}

export async function POST(request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new HttpError(503, "parser-unavailable", "The AI parser is not configured (ANTHROPIC_API_KEY is not set).");
    const body = await readJson(request, 200_000);
    const text = cleanText(body.text, 60_000);
    if (text.length < 40) throw new HttpError(400, "too-short", "Paste the whole email, including the subject line if you have it.");
    if (!rateLimit("parse:" + ipKey(request), 20, 60 * 60 * 1000)) throw new HttpError(429, "rate-limited", "Too many parses from this connection - try again later.");
    const sentOn = /^\d{4}-\d{2}-\d{2}$/.test(String(body.sentOn || "")) ? body.sentOn : "";

    client = client || new Anthropic();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: "low", format: zodOutputFormat(Extracted) },
      messages: [{
        role: "user",
        content: `Today is ${new Date().toISOString().slice(0, 10)}. Email sent on: ${sentOn || "unknown"}.\n\n<email>\n${text}\n</email>`,
      }],
    });
    if (response.stop_reason === "refusal") throw new HttpError(422, "refused", "The parser declined this text.");
    const parsed = response.parsed_output;
    if (!parsed) throw new HttpError(502, "parse-failed", "The parser returned nothing usable - fill the form by hand.");
    return json({ ok: true, fields: parsed, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return json({ ok: false, error: "anthropic", detail: `Claude API error ${error.status}: ${error.message}` }, 502);
    }
    return errorResponse(error);
  }
}

export const config = { maxDuration: 60 };
