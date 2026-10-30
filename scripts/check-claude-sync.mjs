#!/usr/bin/env node
// check-claude-sync: fail if the claude/ bundle has drifted from src/.
// `npm run sync:claude` regenerates it; this guards against forgetting.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAIRS = [
  ["src/report.js", "claude/report.js"],
  ["src/engine.js", "claude/engine.js"],
  ["src/index.js", "claude/server.mjs"],
];

let bad = 0;
for (const [src, dst] of PAIRS) {
  const a = readFileSync(join(ROOT, src), "utf8");
  const b = readFileSync(join(ROOT, dst), "utf8");
  if (a === b) {
    console.log(`  ok    ${dst} matches ${src}`);
  } else {
    bad++;
    console.error(`  DRIFT ${dst} != ${src} (run: npm run sync:claude)`);
  }
}
if (bad) {
  console.error(`\nclaude bundle is out of sync (${bad} file(s)). Run \`npm run sync:claude\` and commit.`);
  process.exit(1);
}
console.log("claude bundle is in sync.");
