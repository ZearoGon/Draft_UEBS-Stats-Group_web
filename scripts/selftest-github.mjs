// Walks the approval path once against the real repository, with one account:
//   1. opens a pull request that only adds a "self-test" line to content/maintainers.json history
//   2. comments "/approve" on it as the token's owner
//   3. waits for .github/workflows/intake-approve.yml to merge it, and prints what happened
//
//   copy .env.example .env.local   (fill in GITHUB_TOKEN, GITHUB_REPO)
//   node scripts/selftest-github.mjs
//
// Needs the workflow on main first (push before running). With a single account GitHub
// sends no review-request email (authors are never asked to review their own pull
// request), so this proves the /approve -> merge path, not the email.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createBranchWithFiles, createComment, createPullRequest, getFile, gh, githubConfig } from "../api/_lib/github.js";
import { normaliseRoles, serialiseRoles, todayIso } from "../api/_lib/roles.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}
const cfg = githubConfig();
if (!cfg.configured) {
  console.error("GITHUB_TOKEN is not set. Put it in .env.local (see .env.example) and run again.");
  process.exit(1);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const me = await gh(cfg, "/user");
log(`token belongs to @${me.login}; repository ${cfg.repo}, base ${cfg.base}`);

const current = await getFile(cfg, "content/maintainers.json");
if (!current) { console.error("content/maintainers.json is not on the base branch yet - push first."); process.exit(1); }
const roles = normaliseRoles(JSON.parse(current));
roles.history.unshift({ date: todayIso(), change: `Self-test of the approval path by @${me.login}`, by: "", note: "scripts/selftest-github.mjs" });

const branch = `roles/selftest-${Date.now().toString(36)}`;
await createBranchWithFiles(cfg, { branch, files: [{ path: "content/maintainers.json", content: serialiseRoles(roles) }], message: "Roles self-test (history line only)" });
const pr = await createPullRequest(cfg, {
  head: branch,
  title: "Roles self-test: approval path",
  body: "Adds one history line to `content/maintainers.json`. Created by `scripts/selftest-github.mjs`; the same script comments `/approve` and waits for the workflow to merge it.",
});
log(`pull request #${pr.number} opened: ${pr.url}`);

await sleep(3000);
await createComment(cfg, pr.number, "/approve");
log("commented /approve - waiting for the Intake approval workflow (it installs npm packages first, so allow a minute or two)");

const deadline = Date.now() + 5 * 60 * 1000;
let merged = false;
let lastCount = 1;
while (Date.now() < deadline) {
  await sleep(10000);
  const p = await gh(cfg, `/repos/${cfg.repo}/pulls/${pr.number}`);
  const comments = await gh(cfg, `/repos/${cfg.repo}/issues/${pr.number}/comments`);
  for (const c of comments.slice(lastCount)) log(`comment by @${c.user.login}: ${c.body.split("\n")[0]}`);
  lastCount = comments.length;
  if (p.merged) { merged = true; break; }
  if (p.state === "closed") { log("the pull request was closed without merging"); break; }
}
if (merged) {
  log(`merged. main now carries the self-test line; run "git pull" locally.`);
  const runs = await gh(cfg, `/repos/${cfg.repo}/actions/runs?event=issue_comment&per_page=3`);
  for (const r of runs.workflow_runs || []) log(`workflow run: ${r.name} - ${r.conclusion || r.status} - ${r.html_url}`);
} else {
  log("not merged within five minutes. Check Actions on GitHub: is the workflow on main, does the comment come from a collaborator, and is the handle in content/people?");
  const runs = await gh(cfg, `/repos/${cfg.repo}/actions/runs?event=issue_comment&per_page=3`);
  for (const r of runs.workflow_runs || []) log(`workflow run: ${r.name} - ${r.conclusion || r.status} - ${r.html_url}`);
  process.exitCode = 1;
}
