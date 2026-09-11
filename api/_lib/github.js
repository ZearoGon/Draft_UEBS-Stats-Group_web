// Minimal GitHub REST client for the intake and the wall.
// Configuration (Vercel environment variables):
//   GITHUB_TOKEN        fine-grained token for the repository: Contents RW, Pull requests RW, Issues RW
//   GITHUB_REPO         owner/name            (default: ZearoGon/Draft_UEBS-Stats-Group_web)
//   GITHUB_BASE_BRANCH  branch to open PRs against (default: main)
//   GITHUB_API_BASE     override for tests     (default: https://api.github.com)

import { HttpError } from "./util.js";

export function githubConfig() {
  const token = process.env.GITHUB_TOKEN || "";
  const repo = process.env.GITHUB_REPO || "ZearoGon/Draft_UEBS-Stats-Group_web";
  const base = process.env.GITHUB_BASE_BRANCH || "main";
  const api = (process.env.GITHUB_API_BASE || "https://api.github.com").replace(/\/+$/, "");
  return { token, repo, base, api, configured: Boolean(token) };
}

export async function gh(cfg, path, { method = "GET", body, raw = false, headers = {} } = {}) {
  const res = await fetch(cfg.api + path, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${cfg.token}`,
      "x-github-api-version": "2022-11-28",
      "user-agent": "uebs-stats-group-site",
      ...(body ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = (data && data.message) || res.statusText;
    throw new HttpError(res.status === 401 || res.status === 403 ? 502 : 502, "github", `GitHub ${method} ${path} failed (${res.status}): ${msg}`);
  }
  return data;
}

// Creates `branch` from `base` with `files` committed on it, using the Git Data API
// (blobs -> tree -> commit -> ref) so binary files of any reasonable size are fine.
// files: [{ path, content: string, encoding: "utf-8" | "base64" }]
export async function createBranchWithFiles(cfg, { branch, files, message }) {
  const r = `/repos/${cfg.repo}`;
  const ref = await gh(cfg, `${r}/git/ref/heads/${encodeURIComponent(cfg.base)}`);
  const baseSha = ref.object.sha;
  const baseCommit = await gh(cfg, `${r}/git/commits/${baseSha}`);
  const tree = [];
  for (const f of files) {
    const blob = await gh(cfg, `${r}/git/blobs`, { method: "POST", body: { content: f.content, encoding: f.encoding || "utf-8" } });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await gh(cfg, `${r}/git/trees`, { method: "POST", body: { base_tree: baseCommit.tree.sha, tree } });
  const commit = await gh(cfg, `${r}/git/commits`, { method: "POST", body: { message, tree: newTree.sha, parents: [baseSha] } });
  await gh(cfg, `${r}/git/refs`, { method: "POST", body: { ref: `refs/heads/${branch}`, sha: commit.sha } });
  return { sha: commit.sha, branch };
}

// A text file from the base branch (null when it does not exist).
export async function getFile(cfg, path) {
  const res = await gh(cfg, `/repos/${cfg.repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(cfg.base)}`, { raw: true });
  if (res.status === 404) return null;
  if (!res.ok) throw new HttpError(502, "github", `GitHub read ${path} failed (${res.status})`);
  const data = await res.json();
  if (!data || data.type !== "file") return null;
  return Buffer.from(String(data.content || ""), "base64").toString("utf8");
}

export async function createPullRequest(cfg, { head, title, body }) {
  const pr = await gh(cfg, `/repos/${cfg.repo}/pulls`, { method: "POST", body: { title, head, base: cfg.base, body, maintainer_can_modify: true } });
  return { number: pr.number, url: pr.html_url };
}

export async function addLabels(cfg, issueNumber, labels) {
  try {
    await gh(cfg, `/repos/${cfg.repo}/issues/${issueNumber}/labels`, { method: "POST", body: { labels } });
  } catch {
    // labels are a nicety; a missing label must not fail the submission
  }
}

// Wall storage: one open issue per board, found by title, created on first use.
const issueCache = new Map();
export async function findOrCreateIssue(cfg, { title, body, label }) {
  const cached = issueCache.get(title);
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.number;
  const list = await gh(cfg, `/repos/${cfg.repo}/issues?state=open&per_page=100&labels=${encodeURIComponent(label)}`);
  let found = Array.isArray(list) ? list.find((i) => i.title === title && !i.pull_request) : null;
  if (!found) {
    const all = await gh(cfg, `/repos/${cfg.repo}/issues?state=open&per_page=100`);
    found = Array.isArray(all) ? all.find((i) => i.title === title && !i.pull_request) : null;
  }
  if (!found) {
    try {
      found = await gh(cfg, `/repos/${cfg.repo}/issues`, { method: "POST", body: { title, body, labels: [label] } });
    } catch {
      found = await gh(cfg, `/repos/${cfg.repo}/issues`, { method: "POST", body: { title, body } });
    }
  }
  issueCache.set(title, { number: found.number, at: Date.now() });
  return found.number;
}

// Newest comments of an issue (up to ~200), oldest page first from GitHub, so we
// fetch the last two pages when there are more than 100.
export async function listComments(cfg, issueNumber) {
  const r = `/repos/${cfg.repo}/issues/${issueNumber}/comments?per_page=100`;
  const first = await gh(cfg, r, { raw: true });
  if (!first.ok) throw new HttpError(502, "github", `GitHub comments failed (${first.status})`);
  const link = first.headers.get("link") || "";
  const m = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  let comments = await first.json();
  if (m) {
    const last = Number(m[1]);
    const pages = last > 2 ? [last - 1, last] : [last];
    comments = [];
    for (const p of pages) comments = comments.concat(await gh(cfg, `${r}&page=${p}`));
  }
  return comments;
}

export async function createComment(cfg, issueNumber, body) {
  return gh(cfg, `/repos/${cfg.repo}/issues/${issueNumber}/comments`, { method: "POST", body: { body } });
}
