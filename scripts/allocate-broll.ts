#!/usr/bin/env bun
/**
 * Embedding-based B-Roll allocator.
 *
 * For each narration slot that needs B-Roll (video/ending kinds), find the
 * best-semantic-match clip window using OpenAI text-embedding-3-small cosine
 * similarity. Greedy assignment (longest-narration-first) respects:
 *   - Zero time overlap per source clip
 *   - No shared clip between adjacent sequences in the same Part
 *   - Window fits within the clip duration
 *
 * Consumes alignment-manifest.ts (Whisper-accurate durations) so each
 * window sized exactly to the narration it backs.
 *
 * Usage: bun run scripts/allocate-broll.ts --video xiaomi-su7-bet
 *        bun run scripts/allocate-broll.ts --video xiaomi-su7-bet --dry-run
 */

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

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
const dryRun = args.includes("--dry-run");

const ROOT = path.resolve(import.meta.dir, "..");
const DATA_DIR = path.join(ROOT, "src/videos", videoSlug, "data");
const COMPONENTS_DIR = path.join(ROOT, "src/videos", videoSlug, "components");
const VIDEOS_DIR = path.join(ROOT, "public", videoSlug, "videos");

// ── Types ──
type Frame = { time: number; text: string; ocrLen: number };
type Clip = { file: string; duration: number; frames: Frame[] };

// ── Clip topical affinity — narration keywords that favor each clip ──
// Tuned for xiaomi-su7-bet; ship as constants for now. Future: learn from
// clip summaries automatically.
const CLIP_AFFINITY: Record<string, string[]> = {
  "apple-cook-archive.mp4": [
    "apple", "cook", "ipad", "cupertino", "tim cook", "库克", "苹果",
    "just like apple",
  ],
  "lei-jun-su7-launch.mp4": [
    "lei jun", "雷军", "stage", "reveal", "unveil", "presenting",
    "发布会", "keynote", "staking", "stake", "all in", "押上",
    "announce", "宣布", "造车", "entrepreneurial", "paused",
    "停顿", "victory", "胜利",
  ],
  "xiaomi-factory.mp4": [
    "factory", "supply chain", "工厂", "制造", "assembly", "工程师",
    "engineers", "生产", "车间", "automation", "automated",
    "集成", "中国供应链", "die-casting", "robots", "manufacturing",
  ],
  "bloomberg-lei-jun.mp4": [
    "analyst", "western", "media", "reporter", "headline",
    "分析师", "西方", "媒体", "reputation", "报道",
  ],
  "cnbc-china-ev.mp4": [
    "europe", "cnbc", "international", "china ev", "硅谷",
    "silicon valley", "ai startup", "ai 创业",
  ],
  "su7-nurburgring.mp4": [
    "driving", "speed", "accel", "nürburgring", "nurburgring",
    "km/h", "track", "race", "加速", "续航", "时速", "performance",
    "mercedes", "porsche", "taycan", "tesla", "plaid",
    "2.78", "265", "800",
  ],
};

function affinityBoost(clipFile: string, narration: string): number {
  const kws = CLIP_AFFINITY[clipFile] || [];
  const text = narration.toLowerCase();
  let hits = 0;
  for (const kw of kws) {
    if (text.includes(kw.toLowerCase())) hits++;
  }
  return hits * 0.04; // +0.04 per hit (up to ~0.2 for strong matches)
}

function textDensityPenalty(ocrLen: number): number {
  if (ocrLen <= 50) return 0;
  // 50-150 chars: small penalty. 150+: -0.1 cap
  return -Math.min(0.15, (ocrLen - 50) * 0.001);
}
type Narration = {
  brollKey: string;
  part: string;
  seqIdx: number;
  lineIdx: number;
  isEnding: boolean;
  textCN: string;
  textEN: string;
  duration: number;
};

// ── Analysis parsing ──
function parseTimestamp(s: string): number {
  return s.trim().split(":").reduce((acc, v) => acc * 60 + parseInt(v, 10), 0);
}

async function parseClipAnalysis(
  filePath: string,
  clipFile: string,
  duration: number,
): Promise<Clip> {
  const md = await fs.readFile(filePath, "utf8");
  const lines = md.split("\n");
  const frames: Frame[] = [];
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith("## Frame-by-Frame Timeline")) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.startsWith("|")) continue;
    if (/^\|[-| ]+\|$/.test(line)) continue; // table divider
    if (line.startsWith("| Time")) continue; // header
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    const [timeStr, visual, ocr, entities] = cells;
    if (!/^\d+:\d+/.test(timeStr)) continue;
    const time = parseTimestamp(timeStr);
    const text = [visual, entities].filter(Boolean).join(" | ");
    if (text.length === 0) continue;
    frames.push({ time, text, ocrLen: (ocr || "").length });
  }
  return { file: clipFile, duration, frames };
}

function getDuration(filePath: string): number {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf-8" },
  );
  return parseFloat(r.stdout.trim());
}

async function loadClips(): Promise<Clip[]> {
  const files = await fs.readdir(VIDEOS_DIR);
  const mp4s = files.filter((f) => f.endsWith(".mp4"));
  const clips: Clip[] = [];
  for (const mp4 of mp4s) {
    const analysisFile = mp4.replace(".mp4", ".analysis.md");
    const analysisPath = path.join(VIDEOS_DIR, analysisFile);
    try {
      await fs.access(analysisPath);
    } catch {
      console.warn(`  skipping ${mp4} — no analysis.md`);
      continue;
    }
    const duration = getDuration(path.join(VIDEOS_DIR, mp4));
    const clip = await parseClipAnalysis(analysisPath, mp4, duration);
    console.log(`  loaded ${mp4}: ${duration.toFixed(0)}s, ${clip.frames.length} frames`);
    clips.push(clip);
  }
  return clips;
}

// ── Part sequence parsing ──
async function parsePartSequences(
  partKey: string,
): Promise<
  { partKey: string; seqIdx: number; lineIdx: number | null; kind: string; brollKey?: string }[]
> {
  const tsxFile = path.join(
    COMPONENTS_DIR,
    partKey,
    partKey.charAt(0).toUpperCase() + partKey.slice(1) + ".tsx",
  );
  const src = await fs.readFile(tsxFile, "utf8");
  // Match sequence object literals. Supports both single-line and multi-line
  // forms. [^{}] disallows nested braces (our sequences don't nest).
  const matches = [
    ...src.matchAll(/\{[^{}]*?kind:\s*"(video|chart|title|quote|ending)"[^{}]*?\}/g),
  ];
  return matches.map((m, i) => {
    const block = m[0];
    const lineIdx = block.match(/lineIdx:\s*(\d+)/);
    const broll = block.match(/brollKey:\s*"([^"]+)"/);
    return {
      partKey,
      seqIdx: i,
      lineIdx: lineIdx ? parseInt(lineIdx[1]) : null,
      kind: m[1],
      brollKey: broll?.[1],
    };
  });
}

// ── Duration from alignment ──
type AlignLine = { startTime: number; endTime: number; boundaryEnd?: number };
function computeSeqDuration(
  alignment: Record<string, Record<string, { totalDuration: number; lines: Record<string, AlignLine> }>>,
  lang: "cn" | "en",
  partKey: string,
  lineIdx: number,
): number {
  const part = alignment[lang]?.[partKey];
  if (!part) return 0;
  const lineKey = `line${lineIdx + 1}`;
  const line = part.lines[lineKey];
  if (!line) return 0;
  let end: number;
  const nextLine = part.lines[`line${lineIdx + 2}`];
  if (line.boundaryEnd) end = line.boundaryEnd;
  else if (nextLine) end = (line.endTime + nextLine.startTime) / 2;
  else end = part.totalDuration;
  return end - line.startTime;
}

// ── Load narrations ──
async function loadNarrations(): Promise<Narration[]> {
  const { contentCN } = await import(path.join(DATA_DIR, "content-cn.ts"));
  const { contentEN } = await import(path.join(DATA_DIR, "content-en.ts"));
  const { alignmentManifest } = await import(path.join(DATA_DIR, "alignment-manifest.ts"));

  const narrations: Narration[] = [];
  for (const partKey of ["part1", "part2", "part3", "part4"]) {
    const seqs = await parsePartSequences(partKey);
    for (const s of seqs) {
      if (s.kind !== "video" && s.kind !== "ending") continue;
      if (!s.brollKey) continue;
      if (s.kind === "ending") {
        narrations.push({
          brollKey: s.brollKey,
          part: partKey,
          seqIdx: s.seqIdx,
          lineIdx: -1,
          isEnding: true,
          textCN: "结束画面，签名卡",
          textEN: "closing sign-off, ending credit",
          duration: 10.0,
        });
        continue;
      }
      const lineIdx = s.lineIdx ?? 0;
      const textCN = contentCN[partKey]?.narration[lineIdx] || "";
      const textEN = contentEN[partKey]?.narration[lineIdx] || "";
      const cnDur = computeSeqDuration(alignmentManifest, "cn", partKey, lineIdx);
      const enDur = computeSeqDuration(alignmentManifest, "en", partKey, lineIdx);
      narrations.push({
        brollKey: s.brollKey,
        part: partKey,
        seqIdx: s.seqIdx,
        lineIdx,
        isEnding: false,
        textCN,
        textEN,
        duration: Math.max(cnDur, enDur, 3),
      });
    }
  }
  return narrations;
}

// ── OpenAI embeddings ──
async function embedBatch(texts: string[]): Promise<number[][]> {
  const BATCH = 100;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: batch }),
    });
    if (!resp.ok) {
      throw new Error(`Embed API ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
    }
    const data = (await resp.json()) as { data: { embedding: number[] }[] };
    for (const d of data.data) out.push(d.embedding);
  }
  return out;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ── Constraint helpers ──
function overlaps(a: [number, number], b: [number, number]): boolean {
  return !(a[1] <= b[0] || a[0] >= b[1]);
}

function adjacent(a: Narration, b: Narration): boolean {
  return a.part === b.part && Math.abs(a.seqIdx - b.seqIdx) === 1;
}

// ── Main ──
console.log(`Loading clips for ${videoSlug}...`);
const clips = await loadClips();
const clipByFile = new Map(clips.map((c) => [c.file, c]));

console.log(`\nLoading narrations...`);
const narrations = await loadNarrations();
for (const n of narrations) {
  console.log(
    `  ${n.brollKey} (${n.part}.seq${n.seqIdx} line${n.lineIdx}, ${n.duration.toFixed(1)}s${n.isEnding ? ", ending" : ""})`,
  );
}

// Collect all frames flat
type FlatFrame = { clipFile: string; time: number; text: string; ocrLen: number };
const allFrames: FlatFrame[] = [];
for (const clip of clips) {
  for (const f of clip.frames) {
    allFrames.push({ clipFile: clip.file, time: f.time, text: f.text, ocrLen: f.ocrLen });
  }
}
console.log(
  `\n${narrations.length} narration slots × ${allFrames.length} candidate frames → ${narrations.length * allFrames.length} scoring ops`,
);

// Embed narrations
const narrationTexts = narrations.map((n) =>
  n.isEnding ? "closing sign-off / ending credit / closing shot" : `${n.textCN}\n${n.textEN}`,
);
console.log(`\nEmbedding ${narrationTexts.length} narration texts...`);
const narrationEmbs = await embedBatch(narrationTexts);

// Embed frames
console.log(`Embedding ${allFrames.length} frame descriptions...`);
const frameEmbs = await embedBatch(allFrames.map((f) => f.text));

// Build per-narration ranked candidate lists
type Ranked = { frameIdx: number; score: number };
const rankedPer: Ranked[][] = [];
for (let i = 0; i < narrations.length; i++) {
  const n = narrations[i];
  const narrText = `${n.textCN}\n${n.textEN}`;
  const scored: Ranked[] = [];
  for (let j = 0; j < allFrames.length; j++) {
    const frame = allFrames[j];
    const clip = clipByFile.get(frame.clipFile)!;
    const startFrom = Math.max(0, frame.time - 2);
    const endFrom = startFrom + n.duration + 2;
    if (endFrom > clip.duration) continue;
    const base = cosineSim(narrationEmbs[i], frameEmbs[j]);
    const affinity = affinityBoost(frame.clipFile, narrText);
    const density = textDensityPenalty(frame.ocrLen);
    scored.push({ frameIdx: j, score: base + affinity + density });
  }
  scored.sort((a, b) => b.score - a.score);
  rankedPer.push(scored.slice(0, 200));
}

// Greedy assignment — process longest-duration narrations first (hardest to place)
const order = [...narrations.keys()].sort(
  (a, b) => narrations[b].duration - narrations[a].duration,
);

type Assign = {
  clipFile: string;
  startFrom: number;
  frameTime: number;
  frameText: string;
  score: number;
};
const assignments = new Map<string, Assign>();
const clipRanges = new Map<string, [number, number][]>();

for (const nIdx of order) {
  const n = narrations[nIdx];
  const candidates = rankedPer[nIdx];
  let picked: Assign | null = null;
  for (const c of candidates) {
    const frame = allFrames[c.frameIdx];
    const clip = clipByFile.get(frame.clipFile)!;
    const startFrom = Math.max(0, frame.time - 2);
    const endFrom = startFrom + n.duration + 2;
    if (endFrom > clip.duration) continue;
    const range: [number, number] = [startFrom, endFrom];
    const ranges = clipRanges.get(frame.clipFile) || [];
    if (ranges.some((r) => overlaps(r, range))) continue;
    let violatesAdjacency = false;
    for (const [otherKey, a] of assignments) {
      const n2 = narrations.find((x) => x.brollKey === otherKey);
      if (!n2) continue;
      if (adjacent(n, n2) && a.clipFile === frame.clipFile) {
        violatesAdjacency = true;
        break;
      }
    }
    if (violatesAdjacency) continue;
    picked = {
      clipFile: frame.clipFile,
      startFrom,
      frameTime: frame.time,
      frameText: frame.text,
      score: c.score,
    };
    break;
  }
  if (!picked && candidates.length > 0) {
    // Fallback: top candidate even if it violates (rare)
    const c = candidates[0];
    const frame = allFrames[c.frameIdx];
    const startFrom = Math.max(0, frame.time - 2);
    picked = {
      clipFile: frame.clipFile,
      startFrom,
      frameTime: frame.time,
      frameText: frame.text,
      score: c.score,
    };
    console.warn(`  ⚠️  ${n.brollKey}: no conflict-free candidate, took top (score=${c.score.toFixed(2)})`);
  }
  if (!picked) {
    console.error(`  ❌ ${n.brollKey}: NO candidates at all`);
    continue;
  }
  assignments.set(n.brollKey, picked);
  const r: [number, number] = [picked.startFrom, picked.startFrom + n.duration + 2];
  clipRanges.set(picked.clipFile, [...(clipRanges.get(picked.clipFile) || []), r]);
}

// ── Emit broll-manifest.ts ──
const lines: string[] = [];
lines.push(`/**`);
lines.push(` * Auto-generated by scripts/allocate-broll.ts — do not edit manually.`);
lines.push(` *`);
lines.push(` * Algorithm: OpenAI text-embedding-3-small cosine similarity between each`);
lines.push(` * narration line (CN+EN concat) and every frame description across all`);
lines.push(` * source clips. Greedy longest-narration-first assignment under zero-`);
lines.push(` * overlap + no-adjacency constraints. Windows sized to Whisper-accurate`);
lines.push(` * narration durations from alignment-manifest.ts.`);
lines.push(` *`);
lines.push(` * Sources: research/xiaomi-su7-bet/sources.md`);
lines.push(` * Validator: scripts/validate-broll.ts`);
lines.push(` * Generated: ${new Date().toISOString()}`);
lines.push(` */`);
lines.push(``);
lines.push(`export type BrollEntry = { file: string; startFrom: number };`);
lines.push(``);
lines.push(`const V = (name: string) => \`${videoSlug}/videos/\${name}\`;`);
lines.push(``);
lines.push(`export const brollManifest = {`);

for (const partKey of ["part1", "part2", "part3", "part4"]) {
  const partNs = narrations.filter((n) => n.part === partKey).sort((a, b) => a.seqIdx - b.seqIdx);
  lines.push(`  // ── ${partKey} ──`);
  lines.push(`  ${partKey}: {`);
  for (const n of partNs) {
    const a = assignments.get(n.brollKey);
    if (!a) {
      lines.push(`    // UNASSIGNED — allocator failed for ${n.brollKey}`);
      continue;
    }
    const why = a.frameText.replace(/\n/g, " ").replace(/"/g, '\\"').slice(0, 100);
    lines.push(
      `    // sim=${a.score.toFixed(3)} @${a.frameTime}s: ${why}`,
    );
    lines.push(
      `    ${n.brollKey}: { file: V("${a.clipFile}"), startFrom: ${Math.round(a.startFrom)} },`,
    );
  }
  lines.push(`  },`);
  lines.push(``);
}
lines.push(`} as const;`);

const output = lines.join("\n");

if (dryRun) {
  console.log("\n=== DRY RUN ===\n");
  console.log(output);
} else {
  const outPath = path.join(DATA_DIR, "broll-manifest.ts");
  await fs.writeFile(outPath, output);
  console.log(`\n━━━ Wrote ${path.relative(ROOT, outPath)} ━━━`);
}

console.log("\n=== Assignment summary ===");
for (const n of narrations.sort((a, b) => a.part.localeCompare(b.part) || a.seqIdx - b.seqIdx)) {
  const a = assignments.get(n.brollKey);
  if (!a) {
    console.log(`  ${n.brollKey}: ❌ UNASSIGNED`);
    continue;
  }
  console.log(
    `  ${n.part} seq${n.seqIdx} ${n.brollKey} (${n.duration.toFixed(1)}s)`,
  );
  console.log(
    `    → ${a.clipFile} @ ${Math.round(a.startFrom)}s  [sim ${a.score.toFixed(3)}]`,
  );
  console.log(`    "${a.frameText.slice(0, 110)}"`);
}
