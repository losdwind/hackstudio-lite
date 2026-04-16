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
 *   bun run scripts/validate-broll.ts
 *   bun run scripts/validate-broll.ts --verbose    # show all entries, not just issues
 *
 * Reads from:
 *   src/data/broll-manifest.ts     — current video assignments
 *   src/data/alignment-manifest.ts — sequence durations (continuous mode)
 *   src/data/audio-manifest.ts     — sequence durations (legacy fallback)
 *   public/videos/                 — actual video files (for ffprobe duration)
 */

import path from "node:path";
import { execFileSync } from "node:child_process";
import { brollManifest } from "../src/data/broll-manifest";
import { alignmentManifest } from "../src/data/alignment-manifest";
import { audioManifest } from "../src/data/audio-manifest";

const ROOT = path.resolve(import.meta.dir, "..");
const VIDEOS_DIR = path.join(ROOT, "public", "videos");
const verbose = process.argv.includes("--verbose");

const FPS = 30;
const PAD = 30;
const TITLE_DUR_SECONDS = 120 / FPS; // 4 seconds
const ENDING_DUR_SECONDS = 300 / FPS; // 10 seconds
const PLAYBACK_RATE = 0.6; // VideoBackground plays at 60% speed

// ── Get actual video durations ───────────────────
function getVideoDuration(filename: string): number {
  const filePath = path.join(VIDEOS_DIR, filename);
  try {
    const output = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
      { encoding: "utf-8" }
    );
    return parseFloat(output.trim());
  } catch {
    return -1; // file not found
  }
}

// ── Estimate sequence duration in seconds ────────
// How long each sequence plays (in real video seconds consumed from source,
// accounting for 0.6x playback rate)
function getSequenceDuration(
  partKey: string,
  lineKey: string | null,
  lang: string = "cn",
): number {
  if (!lineKey) return TITLE_DUR_SECONDS;

  // Try alignment manifest first (continuous mode)
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
      return (end - start); // seconds of narration
    }
  }

  // Fallback to legacy audio manifest
  const legacyPart = (audioManifest as Record<string, Record<string, Record<string, { duration: number }>>>)?.[lang]?.[partKey];
  if (legacyPart?.[lineKey]) {
    return legacyPart[lineKey].duration + PAD / FPS;
  }

  return 10; // fallback estimate
}

// ── Build flat list of all broll entries ──────────
interface BrollEntry {
  partKey: string;
  seqKey: string;
  lineKey: string | null; // null for title/ending
  file: string;
  startFrom: number; // seconds in source video
  estimatedDuration: number; // seconds of sequence
  sourceConsumed: number; // seconds consumed from source (duration / playbackRate)
}

const entries: BrollEntry[] = [];

const PART_KEYS = ["part1", "part2", "part3", "part4"] as const;
for (const partKey of PART_KEYS) {
  const part = brollManifest[partKey] as Record<string, { file: string; startFrom: number }>;
  for (const [seqKey, entry] of Object.entries(part)) {
    // Map seqKey to lineKey
    let lineKey: string | null = null;
    if (seqKey === "title") {
      lineKey = null;
    } else if (seqKey === "ending") {
      lineKey = null;
    } else if (seqKey.startsWith("narration")) {
      // narration1 → line1, narration2 → line2, etc.
      const num = seqKey.replace("narration", "");
      // Map narration number to actual line number based on Part config
      lineKey = `line${num}`;
    } else {
      // Animation keys like evChart, timeline, talentFlow, etc.
      // These overlay on a narration line — find which line from the Part config
      // For now estimate based on position in the part
      lineKey = null;
    }

    const seqDuration = lineKey
      ? getSequenceDuration(partKey, lineKey)
      : seqKey === "ending"
        ? ENDING_DUR_SECONDS
        : TITLE_DUR_SECONDS;

    // Source video consumed = sequence duration / playback rate
    // At 0.6x playback, a 10s sequence only uses 6s of source video
    const sourceConsumed = seqDuration * PLAYBACK_RATE;

    entries.push({
      partKey,
      seqKey,
      lineKey,
      file: entry.file.replace("videos/", ""),
      startFrom: entry.startFrom,
      estimatedDuration: seqDuration,
      sourceConsumed,
    });
  }
}

// ── Get video durations ──────────────────────────
const videoFiles = [...new Set(entries.map((e) => e.file))];
const videoDurations: Record<string, number> = {};

console.log("Probing video durations...");
for (const file of videoFiles) {
  const dur = getVideoDuration(file);
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
  if (videoDur < 0) continue; // skip missing files

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

// Group entries by source file
const byFile: Record<string, BrollEntry[]> = {};
for (const entry of entries) {
  if (!byFile[entry.file]) byFile[entry.file] = [];
  byFile[entry.file].push(entry);
}

for (const [file, fileEntries] of Object.entries(byFile)) {
  // Sort by startFrom
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

  // Calculate total seconds used
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

  const pct = ((usedSeconds / dur) * 100).toFixed(1);
  const bar = "█".repeat(Math.round(Number(pct) / 5)) + "░".repeat(20 - Math.round(Number(pct) / 5));

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

  // Find largest unused gaps
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

  // Show top unused gaps
  const topGaps = gaps.sort((a, b) => b.size - a.size).slice(0, 3);
  if (topGaps.length > 0) {
    const gapStr = topGaps
      .map((g) => `${g.start.toFixed(0)}–${g.end.toFixed(0)}s (${g.size.toFixed(0)}s)`)
      .join(", ");
    console.log(`    Unused gaps: ${gapStr}`);
  }
}

// ── Summary ──────────────────────────────────────
const totalUsed = entries.reduce((sum, e) => sum + e.sourceConsumed, 0);
const totalAvailable = Object.values(videoDurations).filter((d) => d > 0).reduce((a, b) => a + b, 0);

console.log("\n═══ Summary ═══");
console.log(`  Entries: ${entries.length} broll assignments across ${videoFiles.length} source videos`);
console.log(`  Source used: ${totalUsed.toFixed(0)}s / ${totalAvailable.toFixed(0)}s (${((totalUsed / totalAvailable) * 100).toFixed(1)}%)`);
console.log(`  Boundary issues: ${boundaryIssues}`);
console.log(`  Overlap issues: ${overlapIssues}`);
