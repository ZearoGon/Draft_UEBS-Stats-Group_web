// Who may act on a pull request - used by .github/workflows/intake-approve.yml.
//
//   node scripts/authority.mjs --files a,b,c --who handle --command /approve --approvers h1,h2
//
// Reads content/ from the checked-out branch (the workflow checks out main, so a
// pull request cannot grant itself rights) and prints one JSON object:
//   { allowed, required, have, eligible: [handles], scope, message }
// `message` is the comment to post when allowed is false.

import { compileContent } from "./content.mjs";
import { decideApproval, normaliseRoles } from "../api/_lib/roles.js";

const args = process.argv.slice(2);
const opt = (name, fallback = "") => {
  const i = args.indexOf("--" + name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
};
const list = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

let data;
try {
  ({ data } = compileContent({ write: false }));
} catch (error) {
  // Content on main must be valid; if it is not, only admins named in the raw file can act.
  console.error(String(error && error.message ? error.message : error));
  process.exit(2);
}

const roles = normaliseRoles(data.roles);
const handleOf = (id) => data.people.find((p) => p.id === id)?.github || "";
const result = decideApproval({
  roles,
  files: list(opt("files")),
  who: opt("who"),
  command: opt("command", "/approve"),
  approvers: list(opt("approvers")),
  handleOf,
});
console.log(JSON.stringify(result));
