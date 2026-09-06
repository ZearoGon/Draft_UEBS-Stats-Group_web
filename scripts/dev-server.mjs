// Local stand-in for Vercel: serves dist/ (or the repository root if dist/ is
// missing) and runs the functions under api/ with web-standard Request/Response.
//
//   node scripts/dev-server.mjs            -> http://127.0.0.1:4174/
//   node scripts/dev-server.mjs --port 5000
//
// Environment variables are read from .env.local (KEY=VALUE per line) if present.

import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const port = Number(args[args.indexOf("--port") + 1]) || 4174;
const staticRoot = existsSync(join(root, "dist")) && !args.includes("--root") ? join(root, "dist") : root;

const envFile = join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".ics": "text/calendar; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".R": "text/plain; charset=utf-8",
};

const handlers = new Map();
async function loadHandler(name) {
  const file = join(root, "api", `${name}.js`);
  if (!existsSync(file)) return null;
  const mtime = statSync(file).mtimeMs;
  const cached = handlers.get(name);
  if (cached && cached.mtime === mtime) return cached.mod;
  const mod = await import(pathToFileURL(file).href + `?t=${mtime}`);
  handlers.set(name, { mtime, mod });
  return mod;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  try {
    const api = url.pathname.match(/^\/api\/([a-z0-9_-]+)\/?$/);
    if (api) {
      const mod = await loadHandler(api[1]);
      if (!mod) { res.writeHead(404, { "content-type": "application/json" }); res.end('{"error":"no such function"}'); return; }
      const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
      const request = new Request(url.href, { method: req.method, headers: req.headers, body, duplex: "half" });
      const fn = mod[req.method] || (mod.default && mod.default.fetch) || mod.default;
      if (typeof fn !== "function") { res.writeHead(405); res.end("method not allowed"); return; }
      const response = await fn(request);
      const headers = {};
      response.headers.forEach((v, k) => { headers[k] = v; });
      res.writeHead(response.status, headers);
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = normalize(join(staticRoot, path));
    if (!file.startsWith(staticRoot) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
    res.end(readFileSync(file));
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(String(error && error.stack ? error.stack : error));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[dev] serving ${staticRoot === root ? "repository root" : "dist/"} + api/ at http://127.0.0.1:${port}/`);
  console.log(`[dev] GitHub: ${process.env.GITHUB_TOKEN ? "token set" : "no token (intake and wall report not-configured)"}; Claude: ${process.env.ANTHROPIC_API_KEY ? "key set" : "no key"}`);
});
