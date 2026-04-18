#!/usr/bin/env bun
/**
 * B-roll text density check.
 *
 * For every kind:"video" entry in broll-manifest.ts, inspect the .analysis.md
 * sibling of the source mp4. If the frames at (startFrom .. startFrom+3s) have
 * ≥2/3 frames with non-empty ocr_text (>8 chars), flag it — B-roll should not be
 * text-heavy backgrounds.
 *
 * Usage: bun run scripts/validators/text-density.ts --video <slug>
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
const VIDEOS_DIR = path.join(ROOT, "public", slug, "videos");

const { brollManifest } = await import(path.join(DATA_DIR, "broll-manifest.ts")) as {
  brollManifest: Record<string, Record<string, { file: string; startFrom: number }>>;
};

type FrameRow = { tSec: number; visual: string; ocr: string };

function parseTimestampToSec(t: string): number {
  const parts = t.split(":");
  if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1]);
  return Number(t);
}

function parseAnalysisRows(md: string): FrameRow[] {
  const tableMatch = md.match(
    /\|\s*Time\s*\|\s*Visual\s*\|\s*On-screen Text\s*\|\s*Entities\s*\|\s*\n\|[^\n]+\n([\s\S]+?)(?=\n\n|\n---|$)/
  );
  if (!tableMatch) return [];
  const rows: FrameRow[] = [];
  for (const line of tableMatch[1].split("\n")) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length >= 3) {
      rows.push({
        tSec: parseTimestampToSec(cells[0]),
        visual: cells[1],
        ocr: cells[2],
      });
    }
  }
  return rows;
}

const cache: Record<string, FrameRow[]> = {};
async function getRows(file: string): Promise<FrameRow[]> {
  if (cache[file]) return cache[file];
  const relMp4 = file.replace(new RegExp(`^${slug}/videos/`), "");
  const mdPath = path.join(VIDEOS_DIR, relMp4.replace(/\.mp4$/, ".analysis.md"));
  try {
    const md = await fs.readFile(mdPath, "utf-8");
    cache[file] = parseAnalysisRows(md);
  } catch {
    cache[file] = [];
  }
  return cache[file];
}

let issues = 0;

for (const [partKey, part] of Object.entries(brollManifest)) {
  for (const [seqKey, entry] of Object.entries(part)) {
    const rows = await getRows(entry.file);
    if (rows.length === 0) {
      console.log(`  ⚠️  ${partKey}/${seqKey}: no 4-column analysis.md for ${entry.file} — run video-describe-fast first`);
      continue;
    }
    const windowRows = rows.filter((r) => r.tSec >= entry.startFrom && r.tSec < entry.startFrom + 3);
    if (windowRows.length < 2) {
      console.log(`  ⚠️  ${partKey}/${seqKey}: fewer than 2 analysis frames in window — interval too coarse`);
      continue;
    }
    const withText = windowRows.filter((r) => r.ocr && r.ocr.length > 8);
    if (withText.length >= Math.ceil(windowRows.length * 0.67)) {
      console.log(`  🔴 ${partKey}/${seqKey}: ${withText.length}/${windowRows.length} frames at ${entry.startFrom}s have heavy text — poor background material`);
      issues++;
    } else {
      console.log(`  ✅ ${partKey}/${seqKey}: ${withText.length}/${windowRows.length} text-heavy frames`);
    }
  }
}

console.log(`\nText-density issues: ${issues}`);
process.exit(issues > 0 ? 1 : 0);
