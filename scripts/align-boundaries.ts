#!/usr/bin/env bun
/**
 * Anchor sequence boundaries to the real physical silences in each part
 * audio file.
 *
 * Why this exists:
 *   - MiniMax's `subtitle_file` returns where WORDS start/end. Between two
 *     narration lines MiniMax produces a natural silence (derived from its
 *     learned prosody), but that silence isn't represented in the word
 *     timestamps — only in the MP3's actual waveform.
 *   - We want sequence boundaries to fall at the *midpoint* of that silence
 *     so neither side of a cut dumps dead air on a StaticBackground.
 *   - ffmpeg silencedetect reads the waveform directly and reports
 *     (silence_start, silence_end) pairs. We match each pair to a line
 *     transition and write `boundaryEnd` back into alignment-manifest.ts.
 *
 * Flow:
 *   generate-tts.ts   → alignment-manifest.ts (word-level timings, no boundaryEnd)
 *   align-boundaries  → alignment-manifest.ts (boundaryEnd filled in per line)
 *   part-audio.ts     → lineDur prefers line.boundaryEnd when present
 *
 * Usage: bun run scripts/align-boundaries.ts --video xiaomi-su7-bet
 *        bun run scripts/align-boundaries.ts --video xiaomi-su7-bet --debug
 */

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

// ── CLI ─────────────────────────────────────────
const args = process.argv.slice(2);
const videoSlug = args[args.indexOf("--video") + 1];
const debug = args.includes("--debug");
if (!videoSlug || videoSlug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dir, "..");
const MANIFEST_PATH = path.join(
  ROOT,
  "src",
  "videos",
  videoSlug,
  "data",
  "alignment-manifest.ts",
);
const PUBLIC_DIR = path.join(ROOT, "public");

// ── silencedetect parameters (documentary-narration tuned) ──
// -40 dB: anything quieter than -40 dBFS counts as silence. Voice gets close to
//         -10 to -25 dBFS peaks; room tone / breath is typically around -45 to
//         -60 dBFS. -40 splits the difference cleanly.
// d=0.15: minimum silence of 150 ms to register. Shorter than that is just a
//         breath inside a sentence, not a section break. This is below typical
//         inter-line pauses (200-400 ms of natural MiniMax prosody) but above
//         breath pauses (~80 ms), so every real line break registers.
const NOISE_DB = -40;
const MIN_SILENCE = 0.15;

type Silence = { start: number; end: number };

function detectSilences(audioPath: string): Silence[] {
  const res = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-i",
      audioPath,
      "-af",
      `silencedetect=noise=${NOISE_DB}dB:d=${MIN_SILENCE}`,
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf-8" },
  );

  // ffmpeg writes silencedetect output to stderr.
  const stderr = res.stderr || "";
  const starts = [...stderr.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) =>
    parseFloat(m[1]),
  );
  const ends = [...stderr.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) =>
    parseFloat(m[1]),
  );

  const silences: Silence[] = [];
  const n = Math.min(starts.length, ends.length);
  for (let i = 0; i < n; i++) {
    silences.push({ start: starts[i], end: ends[i] });
  }
  return silences;
}

/**
 * Assign silences to line transitions by position-anchored longest-wins.
 *
 * Why not "top-N longest silences": for a noisy audio (slow emotional
 * intro + tight later passage), N-1 longest silences can cluster in one
 * region and miss the real paragraph breaks elsewhere. We lose temporal
 * diversity.
 *
 * Why not "silence containing MiniMax's speech-midpoint": for Chinese
 * with no pause markers, MiniMax's per-line endTime is off by up to a
 * few seconds in absolute terms (though still monotonically ordered).
 * A strict containment check rejects valid silences that are close but
 * just outside the tight window.
 *
 * Strategy: use MiniMax's reported speech-midpoint as an *approximate*
 * anchor per transition. For each transition in order, look for silences
 * within ±SEARCH_WINDOW seconds of the anchor that start after the
 * previously-assigned silence (monotone). Among candidates, pick the
 * longest (paragraph breaks tend to be the longest pauses in their
 * neighborhood, even if not globally longest).
 *
 * Edge-guard: ignore silences within the first/last 0.5s of the audio
 * (that's lead-in / fade-out, not a speech break).
 */
function assignSilences(
  silences: Silence[],
  audioDuration: number,
  transitionAnchors: number[],
): (Silence | null)[] {
  const EDGE_GUARD = 0.5;
  const SEARCH_WINDOW = 3.0; // seconds around the anchor to scan

  const usable = silences.filter(
    (s) => s.start > EDGE_GUARD && s.end < audioDuration - EDGE_GUARD,
  );

  const assigned: (Silence | null)[] = [];
  let prevEnd = EDGE_GUARD; // monotone constraint: later silences must follow

  for (const anchor of transitionAnchors) {
    const candidates = usable.filter(
      (s) =>
        s.start > prevEnd &&
        s.start >= anchor - SEARCH_WINDOW &&
        s.start <= anchor + SEARCH_WINDOW,
    );
    if (candidates.length === 0) {
      // Widen search: look for ANY silence that starts after prevEnd and
      // ends before the next anchor's -SEARCH_WINDOW (so we don't burn
      // a slot that belongs to the next transition).
      assigned.push(null);
      continue;
    }
    const best = candidates.reduce((b, c) =>
      c.end - c.start > b.end - b.start ? c : b,
    );
    assigned.push(best);
    prevEnd = best.end;
  }
  return assigned;
}

// ── Manifest types (mirrors alignment-types.ts) ──
type WordTiming = { text: string; start: number; end: number };
type LineTiming = {
  startTime: number;
  endTime: number;
  words: WordTiming[];
  boundaryEnd?: number;
};
type PartAlignment = {
  file: string;
  totalDuration: number;
  lines: Record<string, LineTiming>;
};

const { alignmentManifest } = (await import(MANIFEST_PATH)) as {
  alignmentManifest: Record<string, Record<string, PartAlignment>>;
};

let anchored = 0;
let fallbacks = 0;
let total = 0;

for (const lang of Object.keys(alignmentManifest)) {
  for (const partKey of Object.keys(alignmentManifest[lang])) {
    const part = alignmentManifest[lang][partKey];
    if (!part || part.totalDuration <= 0) continue;

    const audioPath = path.join(PUBLIC_DIR, part.file);
    try {
      await fs.access(audioPath);
    } catch {
      console.warn(`  ⚠️  ${lang}/${partKey}: audio file missing at ${audioPath}`);
      continue;
    }

    const silences = detectSilences(audioPath);
    if (debug) {
      console.log(
        `\n${lang}/${partKey}: ${silences.length} silences ≥ ${MIN_SILENCE}s`,
      );
      for (const s of silences) {
        console.log(
          `    silence [${s.start.toFixed(2)}s, ${s.end.toFixed(2)}s] (dur ${(s.end - s.start).toFixed(2)}s)`,
        );
      }
    }

    const lineKeys = Object.keys(part.lines).sort(
      (a, b) => parseInt(a.replace("line", "")) - parseInt(b.replace("line", "")),
    );
    const transitions = lineKeys.length - 1;
    // MiniMax-reported approximate transition position = midpoint of the
    // collapsed speech boundary (for CN, endTime == nextStartTime; for EN,
    // they differ by ~50-150 ms). Close enough to anchor our search.
    const anchors: number[] = [];
    for (let i = 0; i < transitions; i++) {
      const cur = part.lines[lineKeys[i]];
      const nxt = part.lines[lineKeys[i + 1]];
      anchors.push((cur.endTime + nxt.startTime) / 2);
    }
    const assigned = assignSilences(silences, part.totalDuration, anchors);
    console.log(
      `\n[${lang}/${partKey}] ${lineKeys.length} lines, ${silences.length} silences detected, ${assigned.filter(Boolean).length}/${transitions} transitions anchored`,
    );

    for (let i = 0; i < transitions; i++) {
      const cur = part.lines[lineKeys[i]];
      const nxt = part.lines[lineKeys[i + 1]];
      total++;
      const sil = assigned[i];
      if (sil) {
        const mid = (sil.start + sil.end) / 2;
        cur.boundaryEnd = mid;
        anchored++;
        const speechMid = (cur.endTime + nxt.startTime) / 2;
        const delta = mid - speechMid;
        const sign = delta >= 0 ? "+" : "";
        console.log(
          `  ✅ ${lineKeys[i]} → ${lineKeys[i + 1]}: silence [${sil.start.toFixed(2)}, ${sil.end.toFixed(2)}] dur=${(sil.end - sil.start).toFixed(2)}s → boundary=${mid.toFixed(3)}s (${sign}${delta.toFixed(3)}s vs speech-midpoint ${speechMid.toFixed(2)})`,
        );
      } else {
        fallbacks++;
        console.log(
          `  ⚠️  ${lineKeys[i]} → ${lineKeys[i + 1]}: no silence available (only ${silences.length} detected, need ${transitions})`,
        );
      }
    }
  }
}

// ── Write back the updated manifest ──
const tsOutput = `// Auto-generated by scripts/generate-tts.ts — do not edit manually.
// Updated with silencedetect boundaries by scripts/align-boundaries.ts.
// MiniMax TTS (speech-2.8-hd) with word-level subtitle timing +
// silencedetect-anchored sequence boundaries.
// Generated: ${new Date().toISOString()}

import type { PartAlignment } from "../../../shared/lib/alignment-types";
export type { WordTiming, LineTiming, PartAlignment } from "../../../shared/lib/alignment-types";

export const alignmentManifest: Record<
  string,
  Record<string, PartAlignment>
> = ${JSON.stringify(alignmentManifest, null, 2)};
`;
await fs.writeFile(MANIFEST_PATH, tsOutput);

console.log(
  `\n━━━ Done. ${anchored}/${total} transitions anchored to real silence. ${fallbacks} fell back to speech-midpoint. ━━━`,
);
console.log(`Wrote ${path.relative(ROOT, MANIFEST_PATH)}`);
