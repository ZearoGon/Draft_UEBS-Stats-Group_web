import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { compileContent } from "./content.mjs";

const ESBUILD_VERSION = "0.25.10";
const cliArgs = process.argv.slice(2);
const checkOnly = cliArgs[0] === "--check";
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(projectRoot, "src", "index.source.html");
const jsxPath = join(projectRoot, "src", "app.jsx");
const appBundlePath = join(projectRoot, "assets", "app.min.js");
const outputPath = join(projectRoot, "index.html");
const vendorManifestPath = join(
  projectRoot,
  "assets",
  "vendor",
  "manifest.json",
);

const localScripts = {
  react: "assets/vendor/react.production.min.js",
  reactDom: "assets/vendor/react-dom.production.min.js",
  app: "assets/app.min.js",
  optimisation: "assets/optimisation.js",
};
const localStyles = {
  optimisation: "assets/optimisation.css",
};

function fail(message) {
  throw new Error(`[build] ${message}`);
}

function assertNonEmptyFile(path, label) {
  if (!existsSync(path)) fail(`${label} is missing: ${path}`);
  const size = statSync(path).size;
  if (size <= 0) fail(`${label} is empty: ${path}`);
  return size;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function verifyPinnedVendors() {
  assertNonEmptyFile(vendorManifestPath, "vendor manifest");

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(vendorManifestPath, "utf8"));
  } catch (error) {
    fail(`cannot parse vendor manifest: ${error.message}`);
  }

  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.artifacts)) {
    fail("vendor manifest has an unsupported shape");
  }

  for (const artifact of manifest.artifacts) {
    if (
      typeof artifact.file !== "string" ||
      !Number.isInteger(artifact.bytes) ||
      typeof artifact.sha256 !== "string" ||
      typeof artifact.licenseFile !== "string"
    ) {
      fail("vendor manifest contains an invalid artifact entry");
    }
    const path = join(projectRoot, "assets", "vendor", artifact.file);
    const size = assertNonEmptyFile(path, `vendor ${artifact.file}`);
    if (size !== artifact.bytes) {
      fail(
        `vendor ${artifact.file} has ${size} bytes; expected ${artifact.bytes}`,
      );
    }
    const actualHash = sha256(path);
    if (actualHash !== artifact.sha256) {
      fail(
        `vendor ${artifact.file} SHA-256 is ${actualHash}; expected ${artifact.sha256}`,
      );
    }
    assertNonEmptyFile(
      join(dirname(vendorManifestPath), artifact.licenseFile),
      `license for ${artifact.file}`,
    );
  }
}

function allScriptTagsWithSrc(document) {
  const tags = [];
  const pattern = /<script\b[^>]*\bsrc\s*=\s*(["'])([^"']+)\1[^>]*>\s*<\/script\s*>/gi;
  for (const match of document.matchAll(pattern)) {
    tags.push({
      index: match.index,
      raw: match[0],
      src: match[2],
    });
  }
  return tags;
}

function normaliseLocalUrl(url) {
  return url
    .replace(/[?#].*$/, "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
}

function replaceExternalLibraryScript(
  document,
  { name, localSrc, matchesRemote },
) {
  const tags = allScriptTagsWithSrc(document);
  const localMatches = tags.filter(
    (tag) => normaliseLocalUrl(tag.src) === localSrc,
  );
  const remoteMatches = tags.filter((tag) => matchesRemote(tag.src));

  if (localMatches.length > 1 || remoteMatches.length > 1) {
    fail(
      `${name} must have exactly one script reference; found ${localMatches.length} local and ${remoteMatches.length} remote`,
    );
  }
  if (localMatches.length === 1 && remoteMatches.length === 1) {
    fail(`${name} has both local and remote script references`);
  }
  if (localMatches.length === 1) return document;
  if (remoteMatches.length !== 1) {
    fail(`cannot find the expected ${name} script reference`);
  }

  const target = remoteMatches[0];
  const replacement = `<script src="${localSrc}"></script>`;
  return (
    document.slice(0, target.index) +
    replacement +
    document.slice(target.index + target.raw.length)
  );
}

function removeRuntimeBabel(document) {
  const matches = allScriptTagsWithSrc(document).filter((tag) =>
    /(?:^|\/)(?:@babel\/standalone|babel-standalone)@?[^/]*\/.*babel(?:\.min)?\.js(?:[?#]|$)/i.test(
      tag.src,
    ),
  );
  if (matches.length !== 1) {
    fail(`expected one Babel runtime script, found ${matches.length}`);
  }
  const target = matches[0];
  return (
    document.slice(0, target.index) +
    document.slice(target.index + target.raw.length)
  );
}

function extractSingleBabelBlock(document) {
  const pattern = /<script\b(?=[^>]*\btype\s*=\s*(["'])text\/babel\1)[^>]*>([\s\S]*?)<\/script\s*>/gi;
  const matches = [...document.matchAll(pattern)];
  if (matches.length !== 1) {
    fail(`expected one inline text/babel JSX block, found ${matches.length}`);
  }
  const match = matches[0];
  return {
    body: match[2],
    index: match.index,
    raw: match[0],
  };
}

function replaceBabelBlock(document, block) {
  const existingAppRefs = allScriptTagsWithSrc(document).filter(
    (tag) => normaliseLocalUrl(tag.src) === localScripts.app,
  );
  if (existingAppRefs.length !== 0) {
    fail(
      `source must not contain ${localScripts.app} before JSX extraction; found ${existingAppRefs.length} reference(s)`,
    );
  }

  const replacement = `<script src="${localScripts.app}"></script>`;
  return (
    document.slice(0, block.index) +
    replacement +
    document.slice(block.index + block.raw.length)
  );
}

function insertBeforeUniqueClosingTag(document, tagName, snippet, eol) {
  const closingTag = new RegExp(`</${tagName}\\s*>`, "gi");
  const matches = [...document.matchAll(closingTag)];
  if (matches.length !== 1) {
    fail(`expected one closing </${tagName}> tag, found ${matches.length}`);
  }
  const index = matches[0].index;
  return document.slice(0, index) + snippet + eol + document.slice(index);
}

function ensureOptimisationStyle(document, eol) {
  const links = [];
  const pattern = /<link\b[^>]*>/gi;
  for (const match of document.matchAll(pattern)) {
    const href = match[0].match(/\bhref\s*=\s*(["'])([^"']+)\1/i)?.[2];
    if (href && normaliseLocalUrl(href) === localStyles.optimisation) {
      links.push(match[0]);
    }
  }
  if (links.length > 1) {
    fail(`found ${links.length} references to ${localStyles.optimisation}`);
  }
  if (links.length === 1) {
    if (!/\brel\s*=\s*(["'])stylesheet\1/i.test(links[0])) {
      fail(`${localStyles.optimisation} exists but is not a stylesheet link`);
    }
    return document;
  }
  return insertBeforeUniqueClosingTag(
    document,
    "head",
    `<link rel="stylesheet" href="${localStyles.optimisation}" />`,
    eol,
  );
}

function ensureOptimisationModule(document, eol) {
  const refs = allScriptTagsWithSrc(document).filter(
    (tag) => normaliseLocalUrl(tag.src) === localScripts.optimisation,
  );
  if (refs.length > 1) {
    fail(`found ${refs.length} references to ${localScripts.optimisation}`);
  }
  if (refs.length === 1) {
    if (!/\btype\s*=\s*(["'])module\1/i.test(refs[0].raw)) {
      fail(`${localScripts.optimisation} exists but is not type="module"`);
    }
    return document;
  }
  return insertBeforeUniqueClosingTag(
    document,
    "body",
    `<script type="module" src="${localScripts.optimisation}"></script>`,
    eol,
  );
}

function compileJsx() {
  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = [
    "--yes",
    `esbuild@${ESBUILD_VERSION}`,
    relative(projectRoot, jsxPath),
    `--outfile=${relative(projectRoot, appBundlePath)}`,
    "--bundle",
    "--platform=browser",
    "--format=iife",
    "--target=es2020",
    "--minify",
    "--legal-comments=none",
    "--charset=utf8",
    "--log-level=warning",
  ];
  const result = spawnSync(npxCommand, args, {
    cwd: projectRoot,
    stdio: "inherit",
    // Node 22 no longer launches Windows batch shims such as npx.cmd
    // directly. Keep the POSIX path shell-free and use cmd only for the
    // fixed, version-pinned Windows invocation above.
    shell: process.platform === "win32",
  });
  if (result.error) fail(`could not launch npx: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`esbuild ${ESBUILD_VERSION} exited with status ${result.status}`);
  }
  assertNonEmptyFile(appBundlePath, "compiled application bundle");
}

function main() {
  if (cliArgs.some((argument) => argument !== "--check") || cliArgs.length > 1) {
    fail(`unknown arguments: ${cliArgs.join(" ") || "(none)"}`);
  }
  // Content first: content/ -> assets/data.js (+ topic pages, contributors.html).
  // In --check mode it is validated without writing anything.
  const content = compileContent({ write: !checkOnly });
  console.log(`[build] content ${checkOnly ? "valid" : "compiled"}: ${content.summary}`);

  assertNonEmptyFile(sourcePath, "source HTML");
  verifyPinnedVendors();
  assertNonEmptyFile(
    join(projectRoot, localStyles.optimisation),
    "optimisation stylesheet",
  );
  assertNonEmptyFile(
    join(projectRoot, localScripts.optimisation),
    "optimisation module",
  );

  const source = readFileSync(sourcePath, "utf8");
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const babelBlock = extractSingleBabelBlock(source);
  const jsx = babelBlock.body.replace(/^\r?\n/, "").replace(/\s+$/, "") + eol;

  let output = replaceBabelBlock(source, babelBlock);
  output = replaceExternalLibraryScript(output, {
    name: "React 18.3.1",
    localSrc: localScripts.react,
    matchesRemote: (src) =>
      /(?:^|\/)react@18\.3\.1\/umd\/react(?:\.development|\.production\.min)\.js(?:[?#]|$)/i.test(
        src,
      ),
  });
  output = replaceExternalLibraryScript(output, {
    name: "ReactDOM 18.3.1",
    localSrc: localScripts.reactDom,
    matchesRemote: (src) =>
      /(?:^|\/)react-dom@18\.3\.1\/umd\/react-dom(?:\.development|\.production\.min)\.js(?:[?#]|$)/i.test(
        src,
      ),
  });
  output = removeRuntimeBabel(output);
  output = ensureOptimisationStyle(output, eol);
  output = ensureOptimisationModule(output, eol);

  if (/text\/babel|@babel\/standalone|react(?:-dom)?\.development\.js/i.test(output)) {
    fail("generated HTML still contains a development runtime reference");
  }

  if (checkOnly) {
    console.log(
      `[build] preflight passed: one JSX block (${Buffer.byteLength(jsx, "utf8")} bytes), pinned vendors, and production HTML transforms are valid`,
    );
    return;
  }

  writeFileSync(jsxPath, jsx, "utf8");
  compileJsx();

  if (readFileSync(sourcePath, "utf8") !== source) {
    fail("source HTML changed during the build; rerun to avoid mixed revisions");
  }

  writeFileSync(outputPath, output, "utf8");
  console.log(
    `[build] wrote ${relative(projectRoot, jsxPath)}, ${relative(projectRoot, appBundlePath)}, and ${relative(projectRoot, outputPath)} with esbuild ${ESBUILD_VERSION}`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
