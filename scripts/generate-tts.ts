#!/usr/bin/env bun
/**
 * Generate TTS voiceover using MiniMax T2A v2 API.
 *
 * Generates ONE audio file per part (not per line) for natural prosody.
 * Uses subtitle_enable to capture word-level timestamps for caption sync.
 *
 * Output:
 *   public/<video>/audio/{cn,en}/part{1-4}-full.mp3   — continuous audio per part
 *   src/videos/<video>/data/alignment-manifest.ts      — word-level timing data
 *
 * Usage:
 *   bun run scripts/generate-tts.ts --video xiaomi-su7
 *   bun run scripts/generate-tts.ts --video xiaomi-su7 --lang cn
 *   bun run scripts/generate-tts.ts --video xiaomi-su7 --part part2
 *   bun run scripts/generate-tts.ts --video xiaomi-su7 --concurrency 4
 *   bun run scripts/generate-tts.ts --video xiaomi-su7 --debug
 *
 * Flags:
 *   --concurrency N   MiniMax API calls run in parallel (default 4).
 *                     Lower to 1 for strict serial, raise cautiously if
 *                     MiniMax rate limits allow.
 *
 * Env:
 *   MINIMAX_API_KEY  (required)
 *   MINIMAX_GROUP_ID (optional)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

// ── CLI Flags ────────────────────────────────────
const args = process.argv.slice(2);
const getFlag = (name: string) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
};
const hasFlag = (name: string) => args.includes(name);

const videoSlug = getFlag("--video");
const onlyLang = getFlag("--lang") as "cn" | "en" | undefined;
const onlyPart = getFlag("--part") as string | undefined;
const debug = hasFlag("--debug");
const concurrency = Math.max(1, parseInt(getFlag("--concurrency") ?? "4", 10));

if (!videoSlug) {
  console.error("ERROR: --video <slug> is required. Example: --video xiaomi-su7");
  console.error("Available videos:");
  const ROOT = path.resolve(import.meta.dir, "..");
  const videosDir = path.join(ROOT, "src", "videos");
  try {
    const dirs = await fs.readdir(videosDir);
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

let contentCN: Record<string, { narration: string[] }>;
let contentEN: Record<string, { narration: string[] }>;

try {
  const cnModule = await import(path.join(VIDEO_DATA_DIR, "content-cn.ts"));
  const enModule = await import(path.join(VIDEO_DATA_DIR, "content-en.ts"));
  contentCN = cnModule.contentCN;
  contentEN = enModule.contentEN;
} catch (err) {
  console.error(`ERROR: Could not load content files from ${VIDEO_DATA_DIR}`);
  console.error(`Make sure content-cn.ts and content-en.ts exist in src/videos/${videoSlug}/data/`);
  process.exit(1);
}

// ── API Configuration ────────────────────────────
const API_KEY =
  process.env.HQ_MINIMAX_API_KEY ??
  process.env.MINIMAX_API_KEY ??
  "";
const GROUP_ID =
  process.env.HQ_MINIMAX_GROUP_ID ??
  process.env.MINIMAX_GROUP_ID ??
  "";
const ENDPOINT =
  process.env.HQ_MINIMAX_ENDPOINT ??
  process.env.MINIMAX_ENDPOINT ??
  "https://api.minimax.io/v1/t2a_v2";
const MODEL = "speech-2.8-hd";

if (!API_KEY) {
  console.error("ERROR: Missing MINIMAX_API_KEY or HQ_MINIMAX_API_KEY environment variable.");
  process.exit(1);
}

// ── Voice Configuration ──────────────────────────
// Tuned for documentary gravitas: slower pace, dynamic range preserved,
// strategic silence injected via PAUSE markers below.
// Reference: Asianometry (~135 WPM, 16% silence) — we sit between that
// and short-video pace to retain emotional headroom for Lei Jun's arc.
const VOICE_CONFIG = {
  cn: {
    voice_id: "moss_audio_9c223de9-7ce1-11f0-9b9f-463feaa3106a",
    speed: 0.97,
    vol: 1.0,
    pitch: 1,
    language_boost: "Chinese",
  },
  en: {
    // Senior storyteller, cold/detached delivery — closest match to
    // Asianometry-style documentary tone in MiniMax's system catalog.
    voice_id: "English_CaptivatingStoryteller",
    speed: 0.95,
    vol: 1.0,
    pitch: 2,
    language_boost: "English",
  },
} as const;

// Modest emotional reserve — kept for dramatic peaks, not flatlined.
const VOICE_MODIFY = {
  intensity: 15,
  pitch: 5,
  timbre: 5,
};

// No pause markers. Forcing <#X#> after every period flattens prosody to a
// uniform beat and overrides MiniMax's learned breath patterns. Instead we
// feed clean punctuated text and let the model pace naturally; the real
// physical silences it produces are then mapped to sequence boundaries by
// scripts/align-boundaries.ts (silencedetect).

const AUDIO_SETTING = {
  sample_rate: 32_000,
  bitrate: 128_000,
  format: "mp3",
  channel: 1,
};

// Pronunciation overrides per language (word → phonetic alias)
const PRONUNCIATIONS: Record<string, Record<string, string>> = {
  cn: {},
  en: {},
};

// ── Types ────────────────────────────────────────
interface MiniMaxSubtitleChunk {
  text: string;
  time_begin: number;
  time_end: number;
  text_begin: number;
  text_end: number;
}

interface WordTiming {
  text: string;
  start: number;
  end: number;
}

interface LineTiming {
  startTime: number;
  endTime: number;
  words: WordTiming[];
}

interface PartAlignment {
  file: string;
  totalDuration: number;
  lines: Record<string, LineTiming>;
}

// ── Helpers ──────────────────────────────────────
async function downloadBuffer(url: string): Promise<Buffer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed: HTTP ${resp.status} for ${url.slice(0, 100)}`);
  return Buffer.from(await resp.arrayBuffer());
}

/**
 * Run async tasks with bounded concurrency. Workers pull from a shared index
 * so slow tasks don't block faster ones. Preserves input-order results.
 */
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await task(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function downloadJson(url: string): Promise<unknown> {
  const buf = await downloadBuffer(url);
  return JSON.parse(buf.toString("utf-8"));
}

// ── MiniMax API Call ─────────────────────────────
async function synthesizePart(
  text: string,
  lang: "cn" | "en"
): Promise<{ audio: Buffer; chunks: MiniMaxSubtitleChunk[] }> {
  const voice = VOICE_CONFIG[lang];

  const pronunciationTone = Object.entries(PRONUNCIATIONS[lang] ?? {})
    .map(([word, alias]) => `${word}/${alias}`)
    .filter((e) => !e.startsWith("/") && !e.endsWith("/"));

  const payload: Record<string, unknown> = {
    model: MODEL,
    text,
    stream: false,
    language_boost: voice.language_boost,
    output_format: "url",
    subtitle_enable: true,
    voice_setting: {
      voice_id: voice.voice_id,
      speed: voice.speed,
      vol: voice.vol,
      pitch: voice.pitch,
    },
    voice_modify: VOICE_MODIFY,
    audio_setting: AUDIO_SETTING,
  };

  if (pronunciationTone.length > 0) {
    payload.pronunciation_dict = { tone: pronunciationTone };
  }

  const url = GROUP_ID
    ? `${ENDPOINT}?GroupId=${encodeURIComponent(GROUP_ID)}`
    : ENDPOINT;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = (await response.json()) as Record<string, unknown>;

    if (debug) {
      console.log(
        "\n  DEBUG response:",
        JSON.stringify(body, null, 2).slice(0, 2000)
      );
    }

    if (!response.ok) {
      throw new Error(
        `MiniMax HTTP ${response.status}: ${JSON.stringify(body).slice(0, 300)}`
      );
    }

    const baseResp = body?.base_resp as Record<string, unknown> | undefined;
    const statusCode = Number(baseResp?.status_code);
    if (statusCode !== 0) {
      throw new Error(
        `MiniMax error: status_code=${statusCode}, msg=${baseResp?.status_msg ?? "unknown"}`
      );
    }

    const data = body?.data as Record<string, unknown> | undefined;

    const audioField = data?.audio;
    let audio: Buffer;

    if (typeof audioField === "string" && audioField.startsWith("http")) {
      audio = await downloadBuffer(audioField);
    } else if (typeof audioField === "string" && audioField.length > 0) {
      const hexData = audioField.replace(/^0x/i, "").replace(/\s+/g, "");
      audio = Buffer.from(hexData, "hex");
    } else {
      throw new Error("MiniMax returned no audio data");
    }

    let chunks: MiniMaxSubtitleChunk[] = [];
    const subtitleField = data?.subtitle_file;

    const parseChunks = (raw: unknown[]): MiniMaxSubtitleChunk[] =>
      raw.map((entry) => {
        const e = entry as Record<string, unknown>;
        return {
          text: String(e.text ?? ""),
          time_begin: Number(e.time_begin ?? 0),
          time_end: Number(e.time_end ?? 0),
          text_begin: Number(e.text_begin ?? 0),
          text_end: Number(e.text_end ?? 0),
        };
      });

    if (typeof subtitleField === "string" && subtitleField.startsWith("http")) {
      try {
        const raw = (await downloadJson(subtitleField)) as unknown[];
        chunks = Array.isArray(raw) ? parseChunks(raw) : [];
      } catch (err) {
        console.warn(`  WARNING: Failed to parse subtitle file: ${err}`);
      }
    } else if (Array.isArray(subtitleField)) {
      chunks = parseChunks(subtitleField);
    }

    if (chunks.length === 0) {
      console.warn(
        "  WARNING: No subtitle chunks returned. Captions will use fallback even-distribution."
      );
    }

    return { audio, chunks };
  } finally {
    clearTimeout(timer);
  }
}

// ── Chunk-to-Line Mapping via character-position interpolation ──
function mapChunksToLines(
  chunks: MiniMaxSubtitleChunk[],
  lineTexts: string[],
  isChinese: boolean,
  totalDuration: number,
): Record<string, LineTiming> {
  if (chunks.length === 0) {
    const result: Record<string, LineTiming> = {};
    for (let i = 0; i < lineTexts.length; i++) {
      result[`line${i + 1}`] = { startTime: 0, endTime: 0, words: [] };
    }
    return result;
  }

  const separator = isChinese ? "" : " ";

  let pos = 0;
  const lineRanges = lineTexts.map((line) => {
    const start = pos;
    pos += line.length + separator.length;
    return { start, end: start + line.length };
  });

  function timeAtChar(charPos: number): number {
    for (const chunk of chunks) {
      if (charPos >= chunk.text_begin && charPos <= chunk.text_end) {
        if (chunk.text_end === chunk.text_begin) return chunk.time_begin;
        const ratio =
          (charPos - chunk.text_begin) / (chunk.text_end - chunk.text_begin);
        return chunk.time_begin + ratio * (chunk.time_end - chunk.time_begin);
      }
    }
    if (charPos <= chunks[0].text_begin) return 0;
    return chunks[chunks.length - 1].time_end;
  }

  const result: Record<string, LineTiming> = {};
  for (let i = 0; i < lineTexts.length; i++) {
    const range = lineRanges[i];
    const startMs = timeAtChar(range.start);
    const endMs = timeAtChar(range.end);
    const startTime = Math.round(startMs) / 1000;
    const endTime = Math.round(endMs) / 1000;

    const words: WordTiming[] = [];
    for (const chunk of chunks) {
      if (chunk.text_end <= range.start || chunk.text_begin >= range.end)
        continue;
      const sliceStart = Math.max(0, range.start - chunk.text_begin);
      const sliceEnd = Math.min(
        chunk.text.length,
        range.end - chunk.text_begin
      );
      const text = chunk.text.slice(sliceStart, sliceEnd);
      if (text.length === 0) continue;

      const wordStart = Math.max(startTime, chunk.time_begin / 1000);
      const wordEnd = Math.min(endTime, chunk.time_end / 1000);
      words.push({ text, start: wordStart, end: wordEnd });
    }

    result[`line${i + 1}`] = { startTime, endTime, words };
  }

  return result;
}

// ── Audio Duration via ffprobe ───────────────────
function getAudioDuration(filePath: string): number {
  const output = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf-8" }
  );
  return parseFloat(output.trim());
}

// ── Main ─────────────────────────────────────────
const OUTPUT_DIR = path.join(ROOT, "public", videoSlug, "audio");
const MANIFEST_PATH = path.join(ROOT, "src", "videos", videoSlug, "data", "alignment-manifest.ts");

console.log(`Video: ${videoSlug}`);
console.log(`Audio output: public/${videoSlug}/audio/`);
console.log(`Manifest: src/videos/${videoSlug}/data/alignment-manifest.ts`);

const PARTS = ["part1", "part2", "part3", "part4", "part5"] as const;
const LANGS = ["cn", "en"] as const;

type PartKey = (typeof PARTS)[number];
type LangKey = (typeof LANGS)[number];

const contentMap: Record<LangKey, Record<PartKey, { narration: string[] }>> = {
  cn: contentCN as Record<PartKey, { narration: string[] }>,
  en: contentEN as Record<PartKey, { narration: string[] }>,
};

const manifest: Record<string, Record<string, PartAlignment>> = {};

// Try to load existing manifest for incremental generation
try {
  const existing = await import(MANIFEST_PATH);
  if (existing?.alignmentManifest) {
    Object.assign(
      manifest,
      JSON.parse(JSON.stringify(existing.alignmentManifest))
    );
  }
} catch {
  // No existing manifest — starting fresh
}

const langsToGenerate = onlyLang ? [onlyLang] : ([...LANGS] as LangKey[]);
const partsToGenerate = onlyPart
  ? [onlyPart as PartKey]
  : ([...PARTS] as PartKey[]);

// Ensure lang dirs exist + manifest slots present
for (const lang of langsToGenerate) {
  if (!manifest[lang]) manifest[lang] = {};
  await fs.mkdir(path.join(OUTPUT_DIR, lang), { recursive: true });
}

// Build the task list up front so concurrency-runner can pull from it.
type Task = {
  lang: LangKey;
  partKey: PartKey;
  rawLines: string[];   // marker-free; matches what's sent verbatim
  fullText: string;     // lines joined with the same separator mapChunksToLines assumes
  lineCount: number;
};
const tasks: Task[] = [];
for (const lang of langsToGenerate) {
  const isChinese = lang === "cn";
  // Separator must match the one in mapChunksToLines so character offsets line up.
  const separator = isChinese ? "" : " ";
  for (const partKey of partsToGenerate) {
    const partContent = contentMap[lang][partKey];
    if (!partContent) {
      console.warn(`Skipping ${lang}/${partKey} — no content found`);
      continue;
    }
    const rawLines = partContent.narration;
    tasks.push({
      lang,
      partKey,
      rawLines,
      fullText: rawLines.join(separator),
      lineCount: rawLines.length,
    });
  }
}

console.log(
  `\nRunning ${tasks.length} TTS tasks with concurrency=${concurrency}...`
);

let totalCalls = 0;

await runWithConcurrency(tasks, concurrency, async (t) => {
  const isChinese = t.lang === "cn";
  const tag = `[${t.lang}/${t.partKey}]`;
  console.log(
    `\n${tag} Synthesizing ${t.lineCount} lines (${t.fullText.length} chars w/ pause markers)...`
  );

  const { audio, chunks } = await synthesizePart(t.fullText, t.lang);
  totalCalls++;

  const audioFileName = `${t.partKey}-full.mp3`;
  const audioPath = path.join(OUTPUT_DIR, t.lang, audioFileName);
  await fs.writeFile(audioPath, audio);
  console.log(
    `  ${tag} Audio: ${audioFileName} (${(audio.length / 1024).toFixed(0)} KB)`
  );

  const totalDuration = getAudioDuration(audioPath);
  console.log(`  ${tag} Duration: ${totalDuration.toFixed(3)}s`);

  // Use marker-free lines for char-position math — MiniMax positions
  // are in the stripped text, not the augmented input.
  const lineTimings = mapChunksToLines(chunks, t.rawLines, isChinese, totalDuration);
  console.log(
    `  ${tag} Subtitle chunks: ${chunks.length} → ${t.lineCount} lines`
  );

  for (const [key, timing] of Object.entries(lineTimings)) {
    const dur = (timing.endTime - timing.startTime).toFixed(2);
    console.log(
      `    ${tag} ${key}: ${timing.startTime.toFixed(2)}s – ${timing.endTime.toFixed(2)}s (${dur}s, ${timing.words.length} words)`
    );
  }

  // Single-threaded JS: assignment below is atomic, safe under concurrency.
  manifest[t.lang][t.partKey] = {
    file: `${videoSlug}/audio/${t.lang}/${audioFileName}`,
    totalDuration,
    lines: lineTimings,
  };
});

// ── Write alignment-manifest.ts ──────────────────
const tsOutput = `// Auto-generated by scripts/generate-tts.ts — do not edit manually.
// MiniMax TTS (${MODEL}) with word-level subtitle timing.
// Generated: ${new Date().toISOString()}

import type { PartAlignment } from "../../../shared/lib/alignment-types";
export type { WordTiming, LineTiming, PartAlignment } from "../../../shared/lib/alignment-types";

export const alignmentManifest: Record<
  string,
  Record<string, PartAlignment>
> = ${JSON.stringify(manifest, null, 2)};
`;

await fs.writeFile(MANIFEST_PATH, tsOutput);
console.log(`\nWrote ${path.relative(ROOT, MANIFEST_PATH)}`);
console.log(
  `Done! ${totalCalls} API call(s), ${Object.keys(manifest).length} language(s).`
);
