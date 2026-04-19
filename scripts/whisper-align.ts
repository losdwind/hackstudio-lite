#!/usr/bin/env bun
/**
 * Whisper re-alignment.
 *
 * What this solves:
 *   MiniMax's subtitle_file returns ONE chunk per narration line when no
 *   <#X#> markers are used, with times that drift from actual speech by
 *   1-2 seconds. SubtitleOverlay then splits the line uniformly by chars,
 *   which doesn't match variable speech rates or intra-sentence pauses.
 *   Result: captions appear to lag voice by ~1 second.
 *
 * What this does:
 *   After TTS generates each part mp3, run OpenAI Whisper (whisper-1)
 *   with word-level timestamps. Map Whisper's word list back to the
 *   source narration lines by normalized-character proportional
 *   assignment. Replace line.words with per-phrase Whisper timings and
 *   update line.startTime / line.endTime to the actual speech edges.
 *
 * Pipeline position:
 *   generate-tts.ts    → alignment-manifest.ts (coarse MiniMax)
 *   whisper-align.ts   → alignment-manifest.ts (accurate word timings)   ← THIS
 *   align-boundaries.ts → alignment-manifest.ts (+ boundaryEnd)
 *
 * Usage: bun run scripts/whisper-align.ts --video xiaomi-su7-bet
 *        bun run scripts/whisper-align.ts --video xiaomi-su7-bet --lang cn
 *        bun run scripts/whisper-align.ts --video xiaomi-su7-bet --debug
 */

import fs from "node:fs/promises";
import path from "node:path";

// ── Env / CLI ───────────────────────────────────
const API_KEY =
  process.env.OPENAI_API_KEY ?? process.env.HQ_OPENAI_API_KEY ?? "";
if (!API_KEY) {
  console.error("ERROR: OPENAI_API_KEY required");
  process.exit(1);
}

const args = process.argv.slice(2);
const videoSlug = args[args.indexOf("--video") + 1];
if (!videoSlug || videoSlug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}
const onlyLang = args[args.indexOf("--lang") + 1] as "cn" | "en" | undefined;
const debug = args.includes("--debug");

const ROOT = path.resolve(import.meta.dir, "..");
const MANIFEST_PATH = path.join(
  ROOT,
  "src",
  "videos",
  videoSlug,
  "data",
  "alignment-manifest.ts",
);
const CONTENT_CN_PATH = path.join(
  ROOT,
  "src",
  "videos",
  videoSlug,
  "data",
  "content-cn.ts",
);
const CONTENT_EN_PATH = path.join(
  ROOT,
  "src",
  "videos",
  videoSlug,
  "data",
  "content-en.ts",
);
const PUBLIC_DIR = path.join(ROOT, "public");

// ── Types (mirror alignment-types.ts) ───────────
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
type WhisperWord = { word: string; start: number; end: number };

const { alignmentManifest } = (await import(MANIFEST_PATH)) as {
  alignmentManifest: Record<string, Record<string, PartAlignment>>;
};
const { contentCN } = (await import(CONTENT_CN_PATH)) as {
  contentCN: Record<string, { narration: string[] }>;
};
const { contentEN } = (await import(CONTENT_EN_PATH)) as {
  contentEN: Record<string, { narration: string[] }>;
};

// ── Whisper API call ────────────────────────────
async function transcribe(
  audioPath: string,
  lang: "cn" | "en",
  promptHint: string,
): Promise<{ words: WhisperWord[]; text: string; duration: number }> {
  const buf = await fs.readFile(audioPath);
  const form = new FormData();
  form.append(
    "file",
    new Blob([buf], { type: "audio/mpeg" }),
    path.basename(audioPath),
  );
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("language", lang === "cn" ? "zh" : "en");
  // Whisper's prompt param is capped at the last 224 tokens; truncate to
  // roughly the tail of the source text to stay under the limit while still
  // biasing the decoder toward our vocabulary (proper names, brands, numbers).
  if (promptHint) {
    const trimmed =
      lang === "cn"
        ? promptHint.slice(-400) // ~CJK tokens are ~1.5-2 chars each
        : promptHint.slice(-800); // ~English tokens are ~4 chars each
    form.append("prompt", trimmed);
  }
  // Temperature 0 so Whisper sticks closer to the prompt-biased decoding path.
  form.append("temperature", "0");

  const resp = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: form,
    },
  );
  if (!resp.ok) {
    throw new Error(
      `Whisper API ${resp.status}: ${(await resp.text()).slice(0, 400)}`,
    );
  }
  const data = (await resp.json()) as {
    words?: WhisperWord[];
    text: string;
    duration: number;
  };
  return {
    words: data.words ?? [],
    text: data.text,
    duration: data.duration,
  };
}

// ── Alignment helpers ───────────────────────────
/**
 * Strip punctuation & whitespace for char-count alignment. Keeps CJK,
 * ASCII letters and digits.
 */
function normalize(text: string, isChinese: boolean): string {
  if (isChinese) {
    return text.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "");
  }
  return text.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

// ── Main loop ───────────────────────────────────
const langs = onlyLang ? [onlyLang] : (Object.keys(alignmentManifest) as ("cn" | "en")[]);

for (const lang of langs) {
  const content = lang === "cn" ? contentCN : contentEN;
  const isChinese = lang === "cn";
  const parts = alignmentManifest[lang];
  if (!parts) continue;

  for (const partKey of Object.keys(parts)) {
    const part = parts[partKey];
    const rawLines = content[partKey]?.narration;
    if (!part || !rawLines || rawLines.length === 0) continue;

    const audioPath = path.join(PUBLIC_DIR, part.file);
    const sep = lang === "cn" ? "" : " ";
    const promptHint = rawLines.join(sep);
    console.log(`\n[${lang}/${partKey}] transcribing ${path.relative(ROOT, audioPath)} ...`);

    const { words: wWords, duration: wDuration } = await transcribe(
      audioPath,
      lang,
      promptHint,
    );
    console.log(
      `  ${wWords.length} Whisper words over ${wDuration.toFixed(2)}s audio`,
    );

    if (wWords.length === 0) {
      console.warn(`  ⚠️  empty Whisper words; skipping`);
      continue;
    }

    // Build cumulative normalized char array for Whisper words.
    const wCumChars: number[] = [];
    let wSum = 0;
    for (const w of wWords) {
      wSum += normalize(w.word, isChinese).length;
      wCumChars.push(wSum);
    }
    const totalWChars = wSum;

    // Source line normalized char ranges.
    const srcRanges: { start: number; end: number }[] = [];
    let sSum = 0;
    for (const rawLine of rawLines) {
      const normLen = normalize(rawLine, isChinese).length;
      srcRanges.push({ start: sSum, end: sSum + normLen });
      sSum += normLen;
    }
    const totalSChars = sSum;

    const drift = Math.abs(totalWChars - totalSChars) / Math.max(totalSChars, 1);
    console.log(
      `  char counts: source=${totalSChars} whisper=${totalWChars} drift=${(drift * 100).toFixed(1)}%`,
    );

    // If Whisper dropped or invented too much content, proportional alignment
    // is unreliable. Keep MiniMax's line timings for this part and skip
    // Whisper override. (MiniMax is off by <1s typically, which is still
    // closer than scale-warped proportions would be.)
    const DRIFT_SAFETY_THRESHOLD = 0.15;
    if (drift > DRIFT_SAFETY_THRESHOLD) {
      console.warn(
        `  🛟 drift > ${(DRIFT_SAFETY_THRESHOLD * 100).toFixed(0)}% — keeping MiniMax timings for this part`,
      );
      continue;
    }

    const scale = totalWChars / totalSChars;

    // Assign each Whisper word to exactly one source line by midpoint
    // containment in the scaled source range.
    const assigned: WhisperWord[][] = srcRanges.map(() => []);
    for (let j = 0; j < wWords.length; j++) {
      const wCharStart = j === 0 ? 0 : wCumChars[j - 1];
      const wCharEnd = wCumChars[j];
      const mid = (wCharStart + wCharEnd) / 2;
      // Find which source range (scaled) contains this midpoint.
      for (let i = 0; i < srcRanges.length; i++) {
        const scaledStart = srcRanges[i].start * scale;
        const scaledEnd = srcRanges[i].end * scale;
        if (mid >= scaledStart && mid < scaledEnd) {
          assigned[i].push(wWords[j]);
          break;
        }
      }
    }

    // Rewrite lines with accurate Whisper timings, grouped by SENTENCE.
    //
    // Why sentence-level instead of word-level: captions should advance per
    // sentence (human-readable phrasing), not per word. We keep the Whisper
    // word-level precision internally for char-time interpolation, then
    // collapse into sentence chunks before writing.
    for (let i = 0; i < srcRanges.length; i++) {
      const lineKey = `line${i + 1}`;
      const line = part.lines[lineKey];
      if (!line) continue;
      const assignedWords = assigned[i];
      if (assignedWords.length === 0) {
        console.warn(
          `  ⚠️  ${lineKey}: 0 Whisper words assigned — keeping MiniMax timing`,
        );
        continue;
      }

      // Build char→time lookup from the Whisper words assigned to this line.
      // Times are absolute (within the part audio), so lookups return absolute
      // sentence start/end timestamps.
      type Bp = { startChar: number; endChar: number; startTime: number; endTime: number };
      const breakpoints: Bp[] = [];
      let cur = 0;
      for (const w of assignedWords) {
        const normLen = normalize(w.word, isChinese).length;
        breakpoints.push({
          startChar: cur,
          endChar: cur + normLen,
          startTime: w.start,
          endTime: w.end,
        });
        cur += normLen;
      }
      const wordCharCount = cur;
      const lookup = (pos: number): number => {
        if (breakpoints.length === 0) return 0;
        if (pos <= 0) return breakpoints[0].startTime;
        if (pos >= wordCharCount) return breakpoints[breakpoints.length - 1].endTime;
        for (const bp of breakpoints) {
          if (pos >= bp.startChar && pos <= bp.endChar) {
            const span = bp.endChar - bp.startChar;
            if (span === 0) return bp.startTime;
            const ratio = (pos - bp.startChar) / span;
            return bp.startTime + ratio * (bp.endTime - bp.startTime);
          }
        }
        return breakpoints[breakpoints.length - 1].endTime;
      };

      // Split the SOURCE line into sentences at terminal punctuation.
      const rawLine = rawLines[i];
      const sentenceRegex = isChinese
        ? /[^。！？\n]+[。！？]+/g
        : /[^.!?\n]+[.!?]+/g;
      const allMatches = [...rawLine.matchAll(sentenceRegex)];
      const sentences = allMatches.map((m) => m[0].trim());
      // Any trailing text after the last terminal-punct sentence (rare —
      // e.g. line ends with comma instead of period). Use slice-by-position,
      // not string replacement, so inter-sentence whitespace doesn't trip us.
      const lastEnd =
        allMatches.length > 0
          ? (allMatches[allMatches.length - 1].index ?? 0) +
            allMatches[allMatches.length - 1][0].length
          : 0;
      const tail = rawLine.slice(lastEnd).trim();
      if (tail.length > 0) sentences.push(tail);
      if (sentences.length === 0) sentences.push(rawLine);

      // Map each sentence's source-char range to Whisper-char range, then to time.
      const normLineLen = normalize(rawLine, isChinese).length;
      const lineScale = normLineLen > 0 ? wordCharCount / normLineLen : 1;

      let srcCursor = 0;
      const sentenceWords: WordTiming[] = [];
      for (const sent of sentences) {
        const normSent = normalize(sent, isChinese);
        const srcStart = srcCursor;
        const srcEnd = srcCursor + normSent.length;
        srcCursor = srcEnd;
        const wStart = srcStart * lineScale;
        const wEnd = srcEnd * lineScale;
        const startTime = lookup(wStart);
        const endTime = lookup(wEnd);
        sentenceWords.push({ text: sent, start: startTime, end: endTime });
      }

      const newStart = sentenceWords[0].start;
      const newEnd = sentenceWords[sentenceWords.length - 1].end;
      const oldStart = line.startTime;
      const oldEnd = line.endTime;

      line.startTime = newStart;
      line.endTime = newEnd;
      line.words = sentenceWords;
      // Drop any stale boundaryEnd — align-boundaries.ts will recompute.
      delete line.boundaryEnd;

      if (debug || Math.abs(newStart - oldStart) > 0.3 || Math.abs(newEnd - oldEnd) > 0.3) {
        console.log(
          `  ${lineKey}: [${oldStart.toFixed(2)},${oldEnd.toFixed(2)}] → [${newStart.toFixed(2)},${newEnd.toFixed(2)}] (Δstart ${(newStart - oldStart).toFixed(2)}s, Δend ${(newEnd - oldEnd).toFixed(2)}s, ${sentenceWords.length} sentences from ${assignedWords.length} whisper words)`,
        );
      } else {
        console.log(
          `  ${lineKey}: ${sentenceWords.length} sentences, [${newStart.toFixed(2)},${newEnd.toFixed(2)}]`,
        );
      }
    }
  }
}

// ── Write back manifest ─────────────────────────
const tsOutput = `// Auto-generated by scripts/generate-tts.ts — do not edit manually.
// Updated by whisper-align.ts (word timings) and align-boundaries.ts (boundaryEnd).
// MiniMax TTS (speech-2.8-hd) + OpenAI Whisper word-level alignment +
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
console.log(`\n━━━ Wrote ${path.relative(ROOT, MANIFEST_PATH)} ━━━`);
