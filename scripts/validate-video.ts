#!/usr/bin/env bun
/**
 * Pre-render video QA harness.
 *
 * Runs all validators in sequence. Exits nonzero on any failure so it can gate
 * CI / be a Phase 5 → Phase 6 handoff check.
 *
 * Usage: bun run scripts/validate-video.ts --video <slug>
 *        bun run scripts/validate-video.ts --video <slug> --skip text-density
 */

import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const skipIdx = args.indexOf("--skip");
const skips = skipIdx >= 0 ? args[skipIdx + 1].split(",") : [];

const ROOT = path.resolve(import.meta.dir, "..");

const checks = [
  { name: "counts-consistency", script: "scripts/validators/counts-consistency.ts" },
  { name: "tts-integrity",      script: "scripts/validators/tts-integrity.ts" },
  { name: "breathing-time",     script: "scripts/validators/breathing-time.ts" },
  { name: "broll-overlap",      script: "scripts/validate-broll.ts" },
  { name: "text-density",       script: "scripts/validators/text-density.ts" },
];

let anyFailed = false;
for (const { name, script } of checks) {
  if (skips.includes(name)) {
    console.log(`\n━━━ ${name}: SKIPPED ━━━`);
    continue;
  }
  console.log(`\n━━━ ${name} ━━━`);
  try {
    execFileSync("bun", ["run", path.join(ROOT, script), "--video", slug],
      { stdio: "inherit", cwd: ROOT }
    );
  } catch {
    anyFailed = true;
    console.log(`  ✗ ${name} FAILED`);
  }
}

console.log(`\n${anyFailed ? "❌ Some validators failed" : "✅ All validators passed"}`);
process.exit(anyFailed ? 1 : 0);
