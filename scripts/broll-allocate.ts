#!/usr/bin/env bun
/**
 * Greedy per-shot B-roll allocator.
 *
 * For every narration line across every part, scores all indexed shots,
 * then picks the highest-scoring candidate that:
 *   1. Does not overlap any already-allocated window in the same source file
 *   2. Is not in the same file as the previous narration in the same part (variety)
 *   3. Fits inside the source video's duration
 *
 * Anchors `startFrom = max(0, shot.tSec - leadIn)` so the matching moment
 * hits ~1–2s into the visible clip. Uses alignment-manifest.ts to derive
 * real per-line source consumption (line_duration × playbackRate).
 *
 * Output:
 *   src/videos/<slug>/data/broll-manifest.proposed.ts   — new manifest
 *   research/<slug>/broll-allocation-diff.md            — current vs proposed diff
 *
 * Usage:
 *   bun run scripts/broll-allocate.ts --video xiaomi-su7
 *   bun run scripts/broll-allocate.ts --video xiaomi-su7 --leadIn 1.5 --minScore 0.1
 */

import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const getFlag = (name: string, fallback?: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};

const slug = getFlag("--video");
const leadInSec = parseFloat(getFlag("--leadIn", "1.5")!);
const minScore = parseFloat(getFlag("--minScore", "0")!);
const playbackRate = parseFloat(getFlag("--playbackRate", "0.6")!);

if (!slug) {
  console.error("Missing --video <slug>");
  process.exit(1);
}

// ── Token / entity helpers (shared with indexer) ─────────────
const STOPWORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","of","in","on","at","to","for","with",
  "by","from","as","and","or","but","if","then","so","that","this","these","those","it","its","their",
  "there","here","which","what","who","whom","whose","when","where","why","how","not","no","yes","do",
  "does","did","done","have","has","had","having","can","could","should","would","may","might","will",
  "shall","about","into","onto","upon","over","under","up","down","out","off","than","very","also",
  "appears","appear","showing","shows","shown","seems","seem","looks","look","image","video","frame",
  "scene","depicts","depict","features","feature","displayed","display","visible","situated","located",
  "positioned","centered","prominent","prominently","background","foreground","text","reads","small",
  "large","top","bottom","left","right","side","corner","center","middle","close","view",
  "against","partially","fully","primarily","mostly","partly","some","any","each","other",
  "another","more","most","less","least","many","much","few","several","all","both","either","neither",
  "one","two","three","four","five","six","seven","eight","nine","ten","first","second","third",
]);

const ENTITIES: Array<{ key: string; variants: string[] }> = [
  { key: "leijun", variants: ["lei jun", "leijun", "chairman"] }, // "ceo" removed — too noisy
  { key: "xiaomi", variants: ["xiaomi", "mi logo"] },
  { key: "su7", variants: ["su7", "su 7", "sedan"] },
  { key: "apple", variants: ["apple"] },
  { key: "tesla", variants: ["tesla", "model 3"] },
  { key: "byd", variants: ["byd"] },
  { key: "porsche", variants: ["porsche", "taycan"] },
  { key: "factory", variants: ["factory", "assembly", "production line", "robotic arm", "manufacturing"] },
  { key: "stage", variants: ["stage", "keynote", "presentation", "podium", "speaker", "audience"] },
  { key: "showroom", variants: ["showroom", "dealership"] },
  { key: "driving", variants: ["driving", "highway", "road", "street", "traffic", "racetrack"] },
  { key: "interior", variants: ["dashboard", "steering wheel", "cockpit", "seat"] },
  { key: "phone", variants: ["smartphone", "phone", "mobile"] },
  { key: "ecosystem", variants: ["ecosystem", "aiot", "connected device", "smart home"] },
  { key: "chart", variants: ["chart", "graph", "data visualization", "penetration rate"] },
  { key: "city", variants: ["city", "skyline", "urban", "skyscraper"] },
];

const tokenize = (text: string): string[] =>
  [...new Set(
    text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  )];

const extractEntities = (text: string): string[] => {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const { key, variants } of ENTITIES) {
    if (variants.some((v) => lower.includes(v))) hits.push(key);
  }
  return hits;
};

type Shot = {
  file: string;
  tSec: number;
  startSec: number;
  endSec: number;
  text: string;
  tokens: string[];
  entities: string[];
  isTextFrame: boolean;
};

type FileIndex = {
  file: string;
  displayName: string;
  durationSec: number | null;
  intervalSec: number | null;
  summary: string;
  shots: Shot[];
};

type ScoredShot = Shot & { score: number };

const ochiai = (a: string[], b: string[]): number => {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let overlap = 0;
  for (const t of a) if (setB.has(t)) overlap++;
  return overlap / Math.sqrt(a.length * b.length);
};

const scoreShot = (nTokens: string[], nEntities: string[], shot: Shot): ScoredShot => {
  const token = ochiai(nTokens, shot.tokens);
  let entHits = 0;
  for (const e of nEntities) if (shot.entities.includes(e)) entHits++;
  const raw = (token + entHits * 0.25) * (shot.isTextFrame ? 0.25 : 1);
  return { ...shot, score: Math.round(raw * 1000) / 1000 };
};

// ── Allocator ─────────────
type Allocation = {
  partKey: string;
  nKey: string;
  file: string;
  startFrom: number;
  anchorTSec: number;
  anchorText: string;
  score: number;
  sourceConsumedSec: number;
};

const rangesOverlap = (a: [number, number], b: [number, number]) =>
  !(a[1] <= b[0] || a[0] >= b[1]);

const main = async () => {
  const indexPath = path.join("research", slug, "shot-index.json");
  const index: FileIndex[] = JSON.parse(await fs.readFile(indexPath, "utf8"));
  const allShots: Shot[] = index.flatMap((f) => f.shots);
  const fileByPath = new Map(index.map((f) => [f.file, f]));

  const contentPath = path.resolve("src/videos", slug, "data/content-en.ts");
  const manifestPath = path.resolve("src/videos", slug, "data/broll-manifest.ts");
  const alignmentPath = path.resolve("src/videos", slug, "data/alignment-manifest.ts");

  const contentMod = await import(contentPath);
  const currentManifestMod = await import(manifestPath);
  const alignmentMod = await import(alignmentPath);

  const contentEN: Record<string, { narration?: string[] }> = contentMod.contentEN;
  const currentManifest = currentManifestMod.brollManifest as Record<
    string,
    Record<string, { file: string; startFrom: number }>
  >;
  const alignment = alignmentMod.alignmentManifest as Record<
    string,
    Record<string, { totalDuration: number; lines: Record<string, { startTime: number }> }>
  >;

  // Compute per-line duration in seconds — use MAX(cn, en) so the window holds for both languages.
  const getLineDurationSec = (partKey: string, lineKey: string): number => {
    const langs = ["cn", "en"] as const;
    let max = 10; // fallback
    for (const lang of langs) {
      const p = alignment[lang]?.[partKey];
      if (!p) continue;
      const lines = Object.keys(p.lines).sort((a, b) => parseInt(a.replace("line", "")) - parseInt(b.replace("line", "")));
      const idx = lines.indexOf(lineKey);
      if (idx < 0) continue;
      const start = p.lines[lineKey].startTime;
      const next = lines[idx + 1];
      const end = next ? p.lines[next].startTime : p.totalDuration;
      max = Math.max(max, end - start);
    }
    return max;
  };

  // Flatten narrations in video order.
  const flatNarrations: Array<{ partKey: string; nKey: string; idx: number; text: string; sourceConsumedSec: number }> = [];
  const partKeys = Object.keys(contentEN).filter((k) => contentEN[k]?.narration);
  for (const partKey of partKeys) {
    const part = contentEN[partKey];
    if (!part.narration) continue;
    part.narration.forEach((text, i) => {
      const lineKey = `line${i + 1}`;
      const lineDur = getLineDurationSec(partKey, lineKey);
      flatNarrations.push({
        partKey,
        nKey: `narration${i + 1}`,
        idx: i,
        text,
        sourceConsumedSec: lineDur * playbackRate,
      });
    });
  }

  console.log(`Allocating ${flatNarrations.length} narration slots across ${partKeys.length} parts (playback=${playbackRate}x, leadIn=${leadInSec}s)`);

  // State: used windows per file.
  const usedByFile = new Map<string, Array<[number, number]>>();
  const prevFileByPart = new Map<string, string>();
  const allocations: Allocation[] = [];
  const failures: string[] = [];

  for (const n of flatNarrations) {
    const nTokens = tokenize(n.text);
    const nEntities = extractEntities(n.text);
    const scored = allShots
      .map((s) => scoreShot(nTokens, nEntities, s))
      .sort((a, b) => b.score - a.score);

    let picked: Allocation | null = null;

    // Two passes — the second relaxes the adjacency constraint.
    for (const allowAdjacent of [false, true]) {
      for (const cand of scored) {
        if (cand.score < minScore) break;
        const fi = fileByPath.get(cand.file);
        if (!fi || !fi.durationSec) continue;

        const maxStart = Math.max(0, fi.durationSec - n.sourceConsumedSec);
        const startFrom = Math.max(0, Math.min(cand.tSec - leadInSec, maxStart));
        const endAt = startFrom + n.sourceConsumedSec;

        if (endAt > fi.durationSec + 0.1) continue;

        const windows = usedByFile.get(cand.file) ?? [];
        if (windows.some((w) => rangesOverlap(w, [startFrom, endAt]))) continue;

        if (!allowAdjacent && prevFileByPart.get(n.partKey) === cand.file) continue;

        picked = {
          partKey: n.partKey,
          nKey: n.nKey,
          file: cand.file,
          startFrom: Math.floor(startFrom),
          anchorTSec: cand.tSec,
          anchorText: cand.text,
          score: cand.score,
          sourceConsumedSec: n.sourceConsumedSec,
        };
        break;
      }
      if (picked) break;
    }

    if (!picked) {
      failures.push(`${n.partKey}/${n.nKey}`);
      continue;
    }

    const wins = usedByFile.get(picked.file) ?? [];
    wins.push([picked.startFrom, picked.startFrom + n.sourceConsumedSec]);
    usedByFile.set(picked.file, wins);
    prevFileByPart.set(n.partKey, picked.file);
    allocations.push(picked);
  }

  // ── Emit proposed manifest ─────────────
  const byPart: Record<string, Allocation[]> = {};
  for (const a of allocations) {
    (byPart[a.partKey] ||= []).push(a);
  }

  const manifestLines: string[] = [];
  manifestLines.push("// Auto-generated by scripts/broll-allocate.ts — do not edit manually.");
  manifestLines.push("// Greedy shot-level allocator with anti-overlap + adjacency + lead-in anchoring.");
  manifestLines.push(`// Generated: ${new Date().toISOString()}`);
  manifestLines.push("");
  manifestLines.push("export const brollManifestProposed = {");
  for (const partKey of partKeys) {
    const entries = byPart[partKey] ?? [];
    if (entries.length === 0) continue;
    manifestLines.push(`  ${partKey}: {`);
    for (const a of entries) {
      manifestLines.push(
        `    ${a.nKey}: { file: "${a.file}", startFrom: ${a.startFrom} },` +
          ` // score=${a.score} @${a.anchorTSec}s — ${a.anchorText.slice(0, 80).replace(/"/g, "'")}${a.anchorText.length > 80 ? "…" : ""}`,
      );
    }
    manifestLines.push("  },");
  }
  manifestLines.push("} as const;");
  manifestLines.push("");

  const proposedPath = path.resolve("src/videos", slug, "data/broll-manifest.proposed.ts");
  await fs.writeFile(proposedPath, manifestLines.join("\n"));

  // ── Emit diff report ─────────────
  const diffLines: string[] = [];
  diffLines.push(`# B-Roll Allocation Diff — ${slug}`);
  diffLines.push("");
  diffLines.push(`**Allocator:** greedy shot-level with anti-overlap, adjacency, and lead-in anchoring (${leadInSec}s).  `);
  diffLines.push(`**Source consumption:** line_duration × ${playbackRate} (matches VideoBackground playbackRate).`);
  diffLines.push("");

  let currentTotal = 0;
  let proposedTotal = 0;
  let wins = 0, ties = 0, losses = 0;

  const scoreCurrentEntry = (partKey: string, nKey: string, text: string): { score: number; anchor: string } => {
    const entry = currentManifest[partKey]?.[nKey];
    if (!entry) return { score: 0, anchor: "" };
    const fi = fileByPath.get(entry.file);
    if (!fi) return { score: 0, anchor: "" };
    const nTokens = tokenize(text);
    const nEntities = extractEntities(text);
    const windowSec = 40;
    const shots = fi.shots.filter((s) => s.tSec >= entry.startFrom && s.tSec < entry.startFrom + windowSec);
    if (shots.length === 0) return { score: 0, anchor: "" };
    const scored = shots.map((s) => scoreShot(nTokens, nEntities, s));
    const best = scored.reduce((a, b) => (a.score >= b.score ? a : b));
    return { score: best.score, anchor: `${fi.displayName} @${entry.startFrom}s, best shot ${best.tSec}s` };
  };

  for (const partKey of partKeys) {
    const entries = byPart[partKey] ?? [];
    if (entries.length === 0) continue;
    diffLines.push(`## ${partKey}`);
    diffLines.push("");
    diffLines.push("| Line | Current | Proposed | Δ score | Anchor shot |");
    diffLines.push("|------|---------|----------|---------|-------------|");
    for (const a of entries) {
      const narration = contentEN[partKey].narration![a.nKey === "narration1" ? 0 : parseInt(a.nKey.replace("narration", "")) - 1];
      const curr = scoreCurrentEntry(partKey, a.nKey, narration);
      const delta = Math.round((a.score - curr.score) * 1000) / 1000;
      currentTotal += curr.score;
      proposedTotal += a.score;
      if (a.score > curr.score + 0.01) wins++;
      else if (curr.score > a.score + 0.01) losses++;
      else ties++;
      const fi = fileByPath.get(a.file);
      const fn = fi?.displayName ?? a.file;
      const marker = delta > 0 ? "✅" : delta < 0 ? "❌" : "=";
      diffLines.push(
        `| ${a.nKey} | ${curr.score.toFixed(3)} — ${curr.anchor} | **${a.score.toFixed(3)}** — ${fn} @${a.startFrom}s (shot ${a.anchorTSec}s) | ${marker} ${delta >= 0 ? "+" : ""}${delta.toFixed(3)} | ${a.anchorText.slice(0, 100)}${a.anchorText.length > 100 ? "…" : ""} |`,
      );
    }
    diffLines.push("");
  }

  diffLines.push("## Summary");
  diffLines.push("");
  diffLines.push(`- **Wins:** ${wins}  |  **Ties:** ${ties}  |  **Losses:** ${losses}`);
  diffLines.push(`- **Total score:** current **${currentTotal.toFixed(2)}** → proposed **${proposedTotal.toFixed(2)}** (Δ ${(proposedTotal - currentTotal).toFixed(2)})`);
  diffLines.push(`- **Narrations allocated:** ${allocations.length} / ${flatNarrations.length}`);
  if (failures.length > 0) {
    diffLines.push(`- **⚠️ Failed allocations:** ${failures.join(", ")}`);
  }
  diffLines.push("");

  // Per-file usage stats
  diffLines.push("## Source file usage");
  diffLines.push("");
  diffLines.push("| File | Duration | Proposed slots | Used / Total | Unused large gaps |");
  diffLines.push("|------|----------|----------------|--------------|-------------------|");
  for (const fi of index) {
    const wins = usedByFile.get(fi.file) ?? [];
    const sorted = [...wins].sort((a, b) => a[0] - b[0]);
    const used = sorted.reduce((sum, [s, e]) => sum + (e - s), 0);
    const dur = fi.durationSec ?? 0;
    const pct = dur > 0 ? ((used / dur) * 100).toFixed(0) : "0";
    const gaps: Array<[number, number]> = [];
    let prev = 0;
    for (const [s, e] of sorted) {
      if (s - prev > 20) gaps.push([prev, s]);
      prev = Math.max(prev, e);
    }
    if (dur - prev > 20) gaps.push([prev, dur]);
    const gapStr = gaps
      .sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))
      .slice(0, 2)
      .map(([s, e]) => `${Math.round(s)}–${Math.round(e)}s`)
      .join(", ");
    diffLines.push(
      `| ${fi.displayName} | ${dur.toFixed(0)}s | ${sorted.length} | ${used.toFixed(0)}s (${pct}%) | ${gapStr || "_none_"} |`,
    );
  }
  diffLines.push("");

  const diffPath = path.join("research", slug, "broll-allocation-diff.md");
  await fs.writeFile(diffPath, diffLines.join("\n"));

  console.log(`\nAllocated ${allocations.length} / ${flatNarrations.length} narrations`);
  console.log(`  Wins: ${wins}  Ties: ${ties}  Losses: ${losses}`);
  console.log(`  Total score: ${currentTotal.toFixed(2)} → ${proposedTotal.toFixed(2)} (Δ ${(proposedTotal - currentTotal).toFixed(2)})`);
  if (failures.length > 0) console.log(`  Failures: ${failures.join(", ")}`);
  console.log(`\nWrote ${proposedPath}`);
  console.log(`Wrote ${diffPath}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
