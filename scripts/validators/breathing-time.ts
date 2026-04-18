#!/usr/bin/env bun
/**
 * Breathing-time check.
 *
 * For every sequence with kind ∈ {chart, title, quote}, the narration duration
 * (seconds of TTS audio paired with it) must be ≥ MIN_BREATHING seconds so the
 * viewer has time to read the chart / title / quote.
 *
 * Chart: 4.0s minimum
 * Title: 2.5s minimum
 * Quote: 3.5s minimum
 *
 * Usage: bun run scripts/validators/breathing-time.ts --video <slug>
 */

import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const MIN = { chart: 4.0, title: 2.5, quote: 3.5 } as const;

const ROOT = path.resolve(import.meta.dir, "..", "..");
const DATA_DIR = path.join(ROOT, "src", "videos", slug, "data");
const COMPONENTS_DIR = path.join(ROOT, "src", "videos", slug, "components");

type PartAlignment = {
  file: string;
  totalDuration: number;
  lines: Record<string, { startTime: number; endTime: number }>;
};
const { alignmentManifest } = await import(path.join(DATA_DIR, "alignment-manifest.ts")) as {
  alignmentManifest: Record<string, Record<string, PartAlignment>>;
};

type SeqKind = "video" | "chart" | "title" | "quote" | "ending";
type ParsedSeq = { partKey: string; lineIdx: number; kind: SeqKind };

const seqEntries: ParsedSeq[] = [];
const partDirs = (await fs.readdir(COMPONENTS_DIR)).filter((d) => /^part\d+$/.test(d));
for (const partDir of partDirs) {
  const partKey = partDir;
  const partFile = path.join(COMPONENTS_DIR, partDir,
    `${partDir.charAt(0).toUpperCase() + partDir.slice(1)}.tsx`);
  let src: string;
  try { src = await fs.readFile(partFile, "utf-8"); }
  catch { continue; }

  // New Plan A format: kind: "video"|"chart"|"title"|"quote"|"ending"
  const newMatches = [...src.matchAll(/kind:\s*"(video|chart|title|quote|ending)"[^}]*?lineIdx:\s*(\d+)/g)];
  if (newMatches.length > 0) {
    for (const m of newMatches) {
      seqEntries.push({ partKey, lineIdx: Number(m[2]), kind: m[1] as SeqKind });
    }
    continue;
  }

  // Legacy fallback: { type: "narration", lineIdx: N, ..., Overlay?: X, showTitle?: true }
  const legacyMatches = [...src.matchAll(/\{\s*type:\s*"narration"[^}]*?lineIdx:\s*(\d+)[^}]*?\}/g)];
  for (const m of legacyMatches) {
    const lineIdx = Number(m[1]);
    const chunk = m[0];
    const kind: SeqKind = chunk.includes("Overlay:") ? "chart"
      : chunk.includes("showTitle: true") ? "title"
      : "video";
    seqEntries.push({ partKey, lineIdx, kind });
  }
}

if (seqEntries.length === 0) {
  console.log("  ⚠️  No sequences parsed from Part files — regex may not match your Part style");
}

let issues = 0;
for (const lang of Object.keys(alignmentManifest)) {
  for (const { partKey, lineIdx, kind } of seqEntries) {
    if (kind === "video" || kind === "ending") continue;
    const min = MIN[kind];
    const part = alignmentManifest[lang]?.[partKey];
    if (!part) continue;
    const lineKey = `line${lineIdx + 1}`;
    const line = part.lines[lineKey];
    if (!line) {
      console.log(`  ⚠️  ${lang}/${partKey}/${lineKey}: kind=${kind} but no alignment data`);
      continue;
    }
    const dur = line.endTime - line.startTime;
    if (dur < min) {
      console.log(`  🔴 ${lang}/${partKey}/${lineKey} (${kind}): ${dur.toFixed(2)}s < ${min}s minimum — extend narration or swap to video kind`);
      issues++;
    } else {
      console.log(`  ✅ ${lang}/${partKey}/${lineKey} (${kind}): ${dur.toFixed(2)}s`);
    }
  }
}

console.log(`\nBreathing-time issues: ${issues}`);
process.exit(issues > 0 ? 1 : 0);
