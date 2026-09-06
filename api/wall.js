// The anonymous wall. GET /api/wall lists both boards; POST /api/wall adds a message.
//
// Storage is the site's own GitHub repository: one open issue per board (created on
// first use, labelled "wall"), one comment per message, posted by the bot token.
// Nothing about the writer is stored - no account, no email, no address (a
// daily-rotating hash of the address is kept in memory only, to slow down floods).
// Maintainers moderate on GitHub: deleting a comment removes it from the site.
//
// Environment: GITHUB_TOKEN / GITHUB_REPO (see api/_lib/github.js);
// WALL_PASSPHRASE (optional) - if set, posting needs the group passphrase.

import { createComment, findOrCreateIssue, githubConfig, listComments } from "./_lib/github.js";
import {
  HttpError,
  cleanText,
  errorResponse,
  findForbidden,
  ipKey,
  json,
  oneLine,
  rateLimit,
  readJson,
  requirePassphrase,
  stripUrls,
} from "./_lib/util.js";

const BOARDS = {
  wish: {
    title: "[wall] What I'd like to learn",
    body: "Wishes posted anonymously from the website's wall (Research Atlas section). Each comment is one message; delete a comment to take it off the site. Please do not edit this issue's title - the site finds the board by it.",
  },
  chat: {
    title: "[wall] Notes & chatter",
    body: "Notes and chatter posted anonymously from the website's wall (Research Atlas section). Each comment is one message; delete a comment to take it off the site. Please do not edit this issue's title - the site finds the board by it.",
  },
};
const LABEL = "wall";
const MARK = /^<!--wall (\{[^\n]*?\})-->\s*/;
const MAX_TEXT = 500;
const MAX_NICK = 24;
const cache = new Map();

export async function GET() {
  try {
    const cfg = githubConfig();
    const passphraseRequired = Boolean(process.env.WALL_PASSPHRASE);
    if (!cfg.configured) return json({ ok: true, configured: false, passphraseRequired, boards: { wish: [], chat: [] } });
    const boards = {};
    for (const id of Object.keys(BOARDS)) boards[id] = await loadBoard(cfg, id);
    return json({ ok: true, configured: true, passphraseRequired, boards }, 200, {
      "cache-control": "public, s-maxage=20, stale-while-revalidate=120",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const cfg = githubConfig();
    if (!cfg.configured) throw new HttpError(503, "not-configured", "The wall is not connected yet (GITHUB_TOKEN is not set on the deployment).");
    const body = await readJson(request, 20_000);
    if (body.website) return json({ ok: true, dropped: true });
    const board = BOARDS[body.board] ? body.board : null;
    if (!board) throw new HttpError(400, "board", "Unknown board.");
    requirePassphrase("WALL_PASSPHRASE", body.passphrase);
    if (!rateLimit("wall:" + ipKey(request), 6, 10 * 60 * 1000)) throw new HttpError(429, "rate-limited", "That is a lot of messages at once - give it a few minutes.");
    const text = stripUrls(cleanText(body.text, MAX_TEXT)).trim();
    if (text.length < 2) throw new HttpError(400, "empty", "Write something first.");
    const nick = oneLine(body.nick, MAX_NICK) || "Anonymous";
    const what = findForbidden(text) || findForbidden(nick);
    if (what) throw new HttpError(400, "forbidden-content", `Please leave out ${what}.`);

    const issue = await findOrCreateIssue(cfg, { title: BOARDS[board].title, body: BOARDS[board].body, label: LABEL });
    const meta = JSON.stringify({ v: 1, board, nick });
    const comment = await createComment(cfg, issue, `<!--wall ${meta}-->\n\n${text}`);
    cache.delete(board);
    return json({ ok: true, item: { id: comment.id, board, nick, text, at: comment.created_at } });
  } catch (error) {
    return errorResponse(error);
  }
}

async function loadBoard(cfg, board) {
  const cached = cache.get(board);
  if (cached && Date.now() - cached.at < 15_000) return cached.items;
  const issue = await findOrCreateIssue(cfg, { title: BOARDS[board].title, body: BOARDS[board].body, label: LABEL });
  const comments = await listComments(cfg, issue);
  const items = [];
  for (const c of comments) {
    const m = MARK.exec(c.body || "");
    if (!m) continue; // not posted by the wall (a maintainer's own note on the issue, for example)
    let meta = {};
    try { meta = JSON.parse(m[1]); } catch { continue; }
    if (meta.board !== board) continue;
    items.push({ id: c.id, board, nick: oneLine(meta.nick, MAX_NICK) || "Anonymous", text: cleanText(c.body.slice(m[0].length), MAX_TEXT), at: c.created_at });
  }
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  const trimmed = items.slice(0, 200);
  cache.set(board, { at: Date.now(), items: trimmed });
  return trimmed;
}
