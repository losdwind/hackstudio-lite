#!/usr/bin/env bun
/**
 * B-roll validation & coverage report.
 *
 * Checks:
 *   1. Boundary — does startFrom + sequence duration exceed source video length?
 *   2. Overlap — do two entries from the same source video use overlapping time windows?
 *   3. Coverage — what % of each source video is used? What segments are unused?
 *
 * Usage:
 *   bun run scripts/validate-broll.ts --video xiaomi-su7
 *   bun run scripts/validate-broll.ts --video xiaomi-su7 --verbose
 *
 * Reads from:
 *   src/videos/<video>/data/broll-manifest.ts      — current video assignments
 *   src/videos/<video>/data/alignment-manifest.ts   — sequence durations (continuous mode)
 *   src/videos/<video>/data/audio-manifest.ts       — sequence durations (legacy fallback)
 *   public/<video>/videos/                          — actual video files (for ffprobe duration)
 */

import path from "node:path";
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";

// ── CLI Flags ────────────────────────────────────
const args = process.argv.slice(2);
const getFlag = (name: string) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const videoSlug = getFlag("--video");
const verbose = args.includes("--verbose");

if (!videoSlug) {
  console.error("ERROR: --video <slug> is required. Example: --video xiaomi-su7");
  const ROOT = path.resolve(import.meta.dir, "..");
  const videosDir = path.join(ROOT, "src", "videos");
  try {
    const dirs = await fs.readdir(videosDir);
    console.error("Available videos:");
    for (const d of dirs) {
      const stat = await fs.stat(path.join(videosDir, d));
      if (stat.isDirectory()) console.error(`  --video ${d}`);
    }
  } catch {
    console.error("  (no videos found)");
  }
  process.exit(1);
}

// ── Dynamic imports for video-specific data ─────
const ROOT = path.resolve(import.meta.dir, "..");
const VIDEO_DATA_DIR = path.join(ROOT, "src", "videos", videoSlug, "data");
const VIDEOS_DIR = path.join(ROOT, "public", videoSlug, "videos");

const { brollManifest } = await import(path.join(VIDEO_DATA_DIR, "broll-manifest.ts"));
const { alignmentManifest } = await import(path.join(VIDEO_DATA_DIR, "alignment-manifest.ts"));
const { audioManifest } = await import(path.join(VIDEO_DATA_DIR, "audio-manifest.ts"));

console.log(`Validating B-roll for: ${videoSlug}`);

const FPS = 30;
const PAD = 30;
const TITLE_DUR_SECONDS = 120 / FPS; // 4 seconds
const ENDING_DUR_SECONDS = 300 / FPS; // 10 seconds
const PLAYBACK_RATE = 0.6; // VideoBackground plays at 60% speed

// ── Get actual video durations ───────────────────
function getVideoDuration(filepath: string): number {
  try {
    const output = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filepath],
      { encoding: "utf-8" }
    );
    return parseFloat(output.trim());
  } catch {
    return -1;
  }
}

// ── Estimate sequence duration in seconds ────────
function getSequenceDuration(
  partKey: string,
  lineKey: string | null,
  lang: string = "cn",
): number {
  if (!lineKey) return TITLE_DUR_SECONDS;

  const alignment = alignmentManifest?.[lang]?.[partKey];
  if (alignment && alignment.totalDuration > 0) {
    const lines = Object.keys(alignment.lines).sort();
    const lineIdx = lines.indexOf(lineKey);
    if (lineIdx >= 0) {
      const start = alignment.lines[lineKey].startTime;
      const nextKey = lines[lineIdx + 1];
      const end = nextKey
        ? alignment.lines[nextKey].startTime
        : alignment.totalDuration;
      return (end - start);
    }
  }

  const legacyPart = (audioManifest as Record<string, Record<string, Record<string, { duration: number }>>>)?.[lang]?.[partKey];
  if (legacyPart?.[lineKey]) {
    return legacyPart[lineKey].duration + PAD / FPS;
  }

  return 10;
}

// ── Build flat list of all broll entries ──────────
interface BrollEntry {
  partKey: string;
  seqKey: string;
  lineKey: string | null;
  file: string;
  fullPath: string;
  startFrom: number;
  estimatedDuration: number;
  sourceConsumed: number;
}

const entries: BrollEntry[] = [];

const PART_KEYS = ["part1", "part2", "part3", "part4"] as const;
for (const partKey of PART_KEYS) {
  const part = brollManifest[partKey] as Record<string, { file: string; startFrom: number }>;
  if (!part) continue;
  for (const [seqKey, entry] of Object.entries(part)) {
    let lineKey: string | null = null;
    if (seqKey === "title" || seqKey === "ending") {
      lineKey = null;
    } else if (seqKey.startsWith("narration")) {
      const num = seqKey.replace("narration", "");
      lineKey = `line${num}`;
    }

    const seqDuration = lineKey
      ? getSequenceDuration(partKey, lineKey)
      : seqKey === "ending"
        ? ENDING_DUR_SECONDS
        : TITLE_DUR_SECONDS;

    const sourceConsumed = seqDuration * PLAYBACK_RATE;

    // Resolve full path: entry.file is like "xiaomi-su7/videos/official-xxx.mp4"
    const fullPath = path.join(ROOT, "public", entry.file);

    entries.push({
      partKey,
      seqKey,
      lineKey,
      file: entry.file,
      fullPath,
      startFrom: entry.startFrom,
      estimatedDuration: seqDuration,
      sourceConsumed,
    });
  }
}

// ── Get video durations ──────────────────────────
const videoFiles = [...new Set(entries.map((e) => e.file))];
const videoDurations: Record<string, number> = {};

console.log("\nProbing video durations...");
for (const file of videoFiles) {
  const fullPath = path.join(ROOT, "public", file);
  const dur = getVideoDuration(fullPath);
  videoDurations[file] = dur;
  if (dur < 0) {
    console.log(`  ⚠️  ${file}: NOT FOUND`);
  } else {
    console.log(`  ${file}: ${dur.toFixed(1)}s`);
  }
}

// ── Check 1: Boundary violations ─────────────────
console.log("\n═══ Boundary Check ═══");
let boundaryIssues = 0;

for (const entry of entries) {
  const videoDur = videoDurations[entry.file];
  if (videoDur < 0) continue;

  const endPoint = entry.startFrom + entry.sourceConsumed;
  const isOverrun = endPoint > videoDur;

  if (isOverrun) {
    console.log(
      `  🔴 ${entry.partKey}/${entry.seqKey}: startFrom=${entry.startFrom}s + ${entry.sourceConsumed.toFixed(1)}s consumed = ${endPoint.toFixed(1)}s > ${videoDur.toFixed(1)}s (${entry.file})`
    );
    boundaryIssues++;
  } else if (verbose) {
    const margin = videoDur - endPoint;
    console.log(
      `  ✅ ${entry.partKey}/${entry.seqKey}: ${entry.startFrom}s → ${endPoint.toFixed(1)}s of ${videoDur.toFixed(1)}s (${margin.toFixed(1)}s margin) — ${entry.file}`
    );
  }
}

if (boundaryIssues === 0) {
  console.log("  ✅ All entries within source video bounds.");
}

// ── Check 2: Overlap detection ───────────────────
console.log("\n═══ Overlap Detection ═══");
let overlapIssues = 0;

const byFile: Record<string, BrollEntry[]> = {};
for (const entry of entries) {
  if (!byFile[entry.file]) byFile[entry.file] = [];
  byFile[entry.file].push(entry);
}

for (const [file, fileEntries] of Object.entries(byFile)) {
  const sorted = [...fileEntries].sort((a, b) => a.startFrom - b.startFrom);

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const aEnd = a.startFrom + a.sourceConsumed;

    if (aEnd > b.startFrom) {
      const overlap = aEnd - b.startFrom;
      console.log(
        `  ⚠️  ${file}: ${a.partKey}/${a.seqKey} [${a.startFrom}–${aEnd.toFixed(1)}s] overlaps ${b.partKey}/${b.seqKey} [${b.startFrom}–${(b.startFrom + b.sourceConsumed).toFixed(1)}s] by ${overlap.toFixed(1)}s`
      );
      overlapIssues++;
    }
  }
}

if (overlapIssues === 0) {
  console.log("  ✅ No overlapping segments detected.");
}

// ── Check 3: Coverage report ─────────────────────
console.log("\n═══ Coverage Report ═══");

for (const [file, dur] of Object.entries(videoDurations)) {
  if (dur < 0) continue;
  const fileEntries = byFile[file] || [];
  const sorted = [...fileEntries].sort((a, b) => a.startFrom - b.startFrom);

  let usedSeconds = 0;
  const usedRanges: { start: number; end: number; label: string }[] = [];

  for (const entry of sorted) {
    const end = entry.startFrom + entry.sourceConsumed;
    usedRanges.push({
      start: entry.startFrom,
      end,
      label: `${entry.partKey}/${entry.seqKey}`,
    });
    usedSeconds += entry.sourceConsumed;
  }

  const pctNum = dur > 0 ? Math.min(100, (usedSeconds / dur) * 100) : 0;
  const pct = pctNum.toFixed(1);
  const barLen = Math.max(0, Math.min(20, Math.round(pctNum / 5)));
  const bar = "█".repeat(barLen) + "░".repeat(20 - barLen);

  console.log(
    `  ${file} [${bar}] ${pct}% (${usedSeconds.toFixed(0)}s / ${dur.toFixed(0)}s)`
  );

  if (verbose) {
    for (const range of usedRanges) {
      console.log(
        `    ${range.start.toFixed(0)}s–${range.end.toFixed(0)}s  ${range.label}`
      );
    }
  }

  const gaps: { start: number; end: number; size: number }[] = [];
  let prevEnd = 0;
  for (const range of usedRanges) {
    if (range.start - prevEnd > 10) {
      gaps.push({ start: prevEnd, end: range.start, size: range.start - prevEnd });
    }
    prevEnd = Math.max(prevEnd, range.end);
  }
  if (dur - prevEnd > 10) {
    gaps.push({ start: prevEnd, end: dur, size: dur - prevEnd });
  }

  const topGaps = gaps.sort((a, b) => b.size - a.size).slice(0, 3);
  if (topGaps.length > 0) {
    const gapStr = topGaps
      .map((g) => `${g.start.toFixed(0)}–${g.end.toFixed(0)}s (${g.size.toFixed(0)}s)`)
      .join(", ");
    console.log(`    Unused gaps: ${gapStr}`);
  }
}

// ── Check 4: kind:"video" cross-reference ────────
// Every kind:"video" sequence in a Part file must have a matching broll entry.
console.log("\n═══ Sequence/Broll Cross-Check ═══");
let crossCheckIssues = 0;
const componentsDir = path.join(ROOT, "src", "videos", videoSlug, "components");
for (const partKey of PART_KEYS) {
  const partPath = path.join(
    componentsDir,
    partKey,
    `${partKey.charAt(0).toUpperCase() + partKey.slice(1)}.tsx`
  );
  try {
    await fs.access(partPath);
  } catch {
    continue;
  }
  const src = await fs.readFile(partPath, "utf-8");
  const videoKinds = [...src.matchAll(/kind:\s*"video"[^}]*brollKey:\s*"([^"]+)"/g)].map((m) => m[1]);
  const partBroll = (brollManifest as Record<string, Record<string, unknown>>)[partKey] || {};
  for (const brollKey of videoKinds) {
    if (!partBroll[brollKey]) {
      console.log(`  🔴 ${partKey}: kind:"video" references missing broll entry "${brollKey}"`);
      crossCheckIssues++;
    }
  }
}
if (crossCheckIssues === 0) console.log("  ✅ All kind:\"video\" sequences have broll entries.");

// ── Summary ──────────────────────────────────────
const totalUsed = entries.reduce((sum, e) => sum + e.sourceConsumed, 0);
const totalAvailable = Object.values(videoDurations).filter((d) => d > 0).reduce((a, b) => a + b, 0);

console.log("\n═══ Summary ═══");
console.log(`  Video: ${videoSlug}`);
console.log(`  Entries: ${entries.length} broll assignments across ${videoFiles.length} source videos`);
console.log(`  Source used: ${totalUsed.toFixed(0)}s / ${totalAvailable.toFixed(0)}s (${((totalUsed / totalAvailable) * 100).toFixed(1)}%)`);
console.log(`  Boundary issues: ${boundaryIssues}`);
console.log(`  Overlap issues: ${overlapIssues}`);
console.log(`  Cross-check issues: ${crossCheckIssues}`);
