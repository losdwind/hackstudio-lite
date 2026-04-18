#!/usr/bin/env bun
/**
 * Validate broll-manifest.proposed.ts against the same invariants as
 * validate-broll.ts (boundary + overlap + adjacency), using real per-line
 * source consumption from alignment-manifest.ts.
 *
 * Usage:
 *   bun run scripts/validate-broll-proposed.ts --video xiaomi-su7
 */

import path from "node:path";
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const getFlag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const slug = getFlag("--video");
if (!slug) {
  console.error("Missing --video <slug>");
  process.exit(1);
}

const PLAYBACK_RATE = 0.6;
const ROOT = path.resolve(import.meta.dir, "..");
const DATA_DIR = path.join(ROOT, "src", "videos", slug, "data");
const VIDEOS_DIR = path.join(ROOT, "public", slug, "videos");

const { brollManifestProposed } = await import(path.join(DATA_DIR, "broll-manifest.proposed.ts"));
const { alignmentManifest } = await import(path.join(DATA_DIR, "alignment-manifest.ts"));

const probeDuration = (file: string): number => {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
      { encoding: "utf-8" },
    );
    return parseFloat(out.trim());
  } catch {
    return -1;
  }
};

const getLineDuration = (partKey: string, lineKey: string): number => {
  const langs = ["cn", "en"];
  let max = 10;
  for (const lang of langs) {
    const p = alignmentManifest[lang]?.[partKey];
    if (!p) continue;
    const lines = Object.keys(p.lines).sort(
      (a: string, b: string) => parseInt(a.replace("line", "")) - parseInt(b.replace("line", "")),
    );
    const idx = lines.indexOf(lineKey);
    if (idx < 0) continue;
    const start = p.lines[lineKey].startTime;
    const next = lines[idx + 1];
    const end = next ? p.lines[next].startTime : p.totalDuration;
    max = Math.max(max, end - start);
  }
  return max;
};

type Entry = {
  partKey: string;
  nKey: string;
  file: string;
  startFrom: number;
  consumed: number;
};

const entries: Entry[] = [];
for (const [partKey, part] of Object.entries(brollManifestProposed) as Array<[string, Record<string, { file: string; startFrom: number }>]>) {
  for (const [nKey, e] of Object.entries(part)) {
    const lineKey = `line${nKey.replace("narration", "")}`;
    const dur = getLineDuration(partKey, lineKey);
    entries.push({ partKey, nKey, file: e.file, startFrom: e.startFrom, consumed: dur * PLAYBACK_RATE });
  }
}

const files = [...new Set(entries.map((e) => e.file))];
const durations: Record<string, number> = {};
console.log("Probing source durations...");
for (const f of files) {
  const d = probeDuration(path.join(ROOT, "public", f));
  durations[f] = d;
  console.log(`  ${f}: ${d < 0 ? "MISSING" : d.toFixed(1) + "s"}`);
}

let boundaryIssues = 0;
let overlapIssues = 0;
let adjacencyIssues = 0;

console.log("\nBoundary check:");
for (const e of entries) {
  const d = durations[e.file];
  if (d < 0) continue;
  const end = e.startFrom + e.consumed;
  if (end > d + 0.1) {
    console.log(`  🔴 ${e.partKey}/${e.nKey}: ${e.startFrom}s + ${e.consumed.toFixed(1)}s = ${end.toFixed(1)}s > ${d.toFixed(1)}s (${e.file})`);
    boundaryIssues++;
  }
}
if (boundaryIssues === 0) console.log("  ✅ all within bounds");

console.log("\nOverlap check:");
const byFile: Record<string, Entry[]> = {};
for (const e of entries) (byFile[e.file] ||= []).push(e);
for (const [file, arr] of Object.entries(byFile)) {
  const sorted = [...arr].sort((a, b) => a.startFrom - b.startFrom);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (a.startFrom + a.consumed > b.startFrom) {
      const ov = (a.startFrom + a.consumed) - b.startFrom;
      console.log(`  ⚠️  ${file}: ${a.partKey}/${a.nKey} overlaps ${b.partKey}/${b.nKey} by ${ov.toFixed(1)}s`);
      overlapIssues++;
    }
  }
}
if (overlapIssues === 0) console.log("  ✅ no overlaps");

console.log("\nAdjacency check (same-file between consecutive narrations in a part):");
const partKeys = [...new Set(entries.map((e) => e.partKey))];
for (const partKey of partKeys) {
  const part = entries.filter((e) => e.partKey === partKey).sort((a, b) => {
    const ai = parseInt(a.nKey.replace("narration", ""));
    const bi = parseInt(b.nKey.replace("narration", ""));
    return ai - bi;
  });
  for (let i = 0; i < part.length - 1; i++) {
    if (part[i].file === part[i + 1].file) {
      console.log(`  ⚠️  ${partKey}: ${part[i].nKey} and ${part[i + 1].nKey} both use ${part[i].file}`);
      adjacencyIssues++;
    }
  }
}
if (adjacencyIssues === 0) console.log("  ✅ no adjacent same-file");

console.log(`\nSummary: ${entries.length} entries, boundary=${boundaryIssues}, overlap=${overlapIssues}, adjacency=${adjacencyIssues}`);
if (boundaryIssues + overlapIssues + adjacencyIssues === 0) {
  console.log("  ✅ proposed manifest passes all invariants");
} else {
  process.exit(1);
}
