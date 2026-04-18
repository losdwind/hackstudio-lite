#!/usr/bin/env bun
/**
 * Counts consistency check.
 *
 * For each part, these numbers MUST agree:
 *   - sequences.length in PartN.tsx (excluding ending)
 *   - content.partN.narration.length in content-cn.ts and content-en.ts
 *   - Object.keys(alignment.partN.lines).length in alignment-manifest.ts (both langs)
 *
 * Usage: bun run scripts/validators/counts-consistency.ts --video <slug>
 */

import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dir, "..", "..");
const DATA_DIR = path.join(ROOT, "src", "videos", slug, "data");
const COMPONENTS_DIR = path.join(ROOT, "src", "videos", slug, "components");

type Content = Partial<Record<string, { narration: string[] }>>;
const { contentCN } = await import(path.join(DATA_DIR, "content-cn.ts")) as { contentCN: Content };
const { contentEN } = await import(path.join(DATA_DIR, "content-en.ts")) as { contentEN: Content };

type PartAlignment = { lines: Record<string, unknown> };
const { alignmentManifest } = await import(path.join(DATA_DIR, "alignment-manifest.ts")) as {
  alignmentManifest: Record<string, Record<string, PartAlignment>>;
};

let issues = 0;

const partDirs = (await fs.readdir(COMPONENTS_DIR)).filter((d) => /^part\d+$/.test(d));
for (const partDir of partDirs.sort()) {
  const partKey = partDir;

  const partFile = path.join(COMPONENTS_DIR, partDir,
    `${partDir.charAt(0).toUpperCase() + partDir.slice(1)}.tsx`);
  const src = await fs.readFile(partFile, "utf-8").catch(() => "");
  const narrationCount =
    (src.match(/type:\s*"narration"/g)?.length ?? 0) +
    (src.match(/kind:\s*"(video|chart|title|quote)"/g)?.length ?? 0);

  const cnLines = contentCN[partKey]?.narration?.length ?? 0;
  const enLines = contentEN[partKey]?.narration?.length ?? 0;

  const alignCN = Object.keys(alignmentManifest.cn?.[partKey]?.lines ?? {}).length;
  const alignEN = Object.keys(alignmentManifest.en?.[partKey]?.lines ?? {}).length;

  const all = [narrationCount, cnLines, enLines, alignCN, alignEN];
  const allEqual = all.every((n) => n === all[0]);

  if (allEqual && all[0] > 0) {
    console.log(`  ✅ ${partKey}: ${all[0]} lines — sequences/content-cn/content-en/align-cn/align-en agree`);
  } else {
    console.log(`  🔴 ${partKey}: sequences=${narrationCount} content-cn=${cnLines} content-en=${enLines} align-cn=${alignCN} align-en=${alignEN}`);
    issues++;
  }
}

console.log(`\nCounts-consistency issues: ${issues}`);
process.exit(issues > 0 ? 1 : 0);
