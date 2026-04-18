#!/usr/bin/env bun
/**
 * Retrieve top-K shot candidates for each narration line in a given part,
 * compare against the current broll-manifest.ts allocation, and emit a
 * side-by-side markdown report.
 *
 * Scoring:
 *   - Ochiai similarity on stopword-filtered tokens (narration ∩ shot_description)
 *   - +0.25 per shared entity (leijun, factory, showroom, driving, etc.)
 *   - × 0.25 penalty for pure text-frame shots (title cards)
 *   - Dedupe top-K by source file so the list shows variety
 *
 * Usage:
 *   bun run scripts/broll-retrieve.ts --video xiaomi-su7 --part part1
 */

import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const getFlag = (name: string, fallback?: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};

const slug = getFlag("--video");
const partKey = getFlag("--part", "part1")!;
const topK = parseInt(getFlag("--topK", "3")!, 10);

if (!slug) {
  console.error("Missing --video <slug>");
  process.exit(1);
}

// ── Same tokenizer/entity extractor as the indexer ─────────────
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
  { key: "leijun", variants: ["lei jun", "leijun", "chairman", "ceo"] },
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

const tokenize = (text: string): string[] => {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  )];
};

const extractEntities = (text: string): string[] => {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const { key, variants } of ENTITIES) {
    if (variants.some((v) => lower.includes(v))) hits.push(key);
  }
  return hits;
};

// ── Types mirroring the index ─────────────
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

// ── Scoring ─────────────
const ochiai = (a: string[], b: string[]): number => {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let overlap = 0;
  for (const t of a) if (setB.has(t)) overlap++;
  return overlap / Math.sqrt(a.length * b.length);
};

type ScoredShot = Shot & { score: number; breakdown: string };

const scoreShot = (narrationTokens: string[], narrationEntities: string[], shot: Shot): ScoredShot => {
  const token = ochiai(narrationTokens, shot.tokens);
  let entityHits = 0;
  for (const e of narrationEntities) if (shot.entities.includes(e)) entityHits++;
  const entityBoost = entityHits * 0.25;
  const textPenalty = shot.isTextFrame ? 0.25 : 1.0;

  const raw = (token + entityBoost) * textPenalty;
  const breakdown = `tok=${token.toFixed(2)} ent=${entityHits}${shot.isTextFrame ? " TXT×0.25" : ""}`;
  return { ...shot, score: Math.round(raw * 1000) / 1000, breakdown };
};

// Keep only the top-K results where each source file appears at most once,
// so the list demonstrates diversity rather than 3 near-duplicates from the
// same clip.
const diversifyTopK = (scored: ScoredShot[], k: number): ScoredShot[] => {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: ScoredShot[] = [];
  for (const s of sorted) {
    if (seen.has(s.file)) continue;
    seen.add(s.file);
    out.push(s);
    if (out.length >= k) break;
  }
  return out;
};

const scoreWindow = (
  narrationTokens: string[],
  narrationEntities: string[],
  fileIndex: FileIndex,
  startSec: number,
  windowSec: number,
): { best: ScoredShot | null; avg: number; shotsInWindow: number } => {
  const endSec = startSec + windowSec;
  const shots = fileIndex.shots.filter((s) => s.tSec >= startSec && s.tSec < endSec);
  if (shots.length === 0) return { best: null, avg: 0, shotsInWindow: 0 };
  const scored = shots.map((s) => scoreShot(narrationTokens, narrationEntities, s));
  const best = scored.reduce((a, b) => (a.score >= b.score ? a : b));
  const avg = scored.reduce((sum, s) => sum + s.score, 0) / scored.length;
  return { best, avg: Math.round(avg * 1000) / 1000, shotsInWindow: shots.length };
};

// ── Main ─────────────
const main = async () => {
  const indexPath = path.join("research", slug, "shot-index.json");
  const index: FileIndex[] = JSON.parse(await fs.readFile(indexPath, "utf8"));
  const allShots: Shot[] = index.flatMap((f) => f.shots);
  const fileByPath = new Map(index.map((f) => [f.file, f]));

  // Dynamic import of the content + broll manifest so the script works for any video/part.
  const contentPath = path.resolve("src/videos", slug, "data/content-en.ts");
  const manifestPath = path.resolve("src/videos", slug, "data/broll-manifest.ts");
  const contentMod = await import(contentPath);
  const manifestMod = await import(manifestPath);

  const content = contentMod.contentEN[partKey as keyof typeof contentMod.contentEN];
  const manifest = manifestMod.brollManifest[partKey];
  if (!content || !manifest) {
    console.error(`Could not find ${partKey} in content-en.ts or broll-manifest.ts`);
    process.exit(1);
  }

  const narrationLines: string[] = content.narration;
  const reportLines: string[] = [];

  reportLines.push(`# B-Roll Retrieval Comparison — ${slug} / ${partKey}`);
  reportLines.push("");
  reportLines.push(`**Title:** ${content.title}  `);
  reportLines.push(`**Subtitle:** ${content.subtitle}`);
  reportLines.push("");
  reportLines.push("Current allocation comes from `broll-manifest.ts`. Proposed picks come from ranking all " +
    `${allShots.length} shots across ${index.length} source files via token+entity similarity, penalizing ` +
    `text-frames. Top-${topK} is deduplicated by source file for variety.`);
  reportLines.push("");

  for (let i = 0; i < narrationLines.length; i++) {
    const narration = narrationLines[i];
    const nKey = `narration${i + 1}`;
    const current = manifest[nKey];
    const nTokens = tokenize(narration);
    const nEntities = extractEntities(narration);

    reportLines.push(`## ${nKey}`);
    reportLines.push("");
    reportLines.push(`> ${narration}`);
    reportLines.push("");
    reportLines.push(`**Narration tokens:** ${nTokens.slice(0, 14).join(", ")}${nTokens.length > 14 ? "…" : ""}  `);
    reportLines.push(`**Narration entities:** ${nEntities.length > 0 ? nEntities.join(", ") : "_(none detected)_"}`);
    reportLines.push("");

    if (current) {
      const currentFile = fileByPath.get(current.file);
      if (currentFile) {
        const { best, avg, shotsInWindow } = scoreWindow(nTokens, nEntities, currentFile, current.startFrom, 40);
        reportLines.push("### Current allocation");
        reportLines.push(
          `\`${currentFile.displayName}\` @ ${current.startFrom}s–${current.startFrom + 40}s ` +
            `(${shotsInWindow} shots, avg score **${avg}**)`,
        );
        if (best) {
          reportLines.push("");
          reportLines.push(
            `Best moment in the window: \`${best.tSec}s\` — score **${best.score}** (${best.breakdown})  `,
          );
          reportLines.push(`> ${best.text.slice(0, 220)}${best.text.length > 220 ? "…" : ""}`);
        }
      }
    }
    reportLines.push("");

    const scored = allShots.map((s) => scoreShot(nTokens, nEntities, s));
    const top = diversifyTopK(scored, topK);
    reportLines.push(`### Proposed top-${topK} (file-deduped)`);
    reportLines.push("");
    reportLines.push("| Rank | File | Shot time | Score | Why |");
    reportLines.push("|------|------|-----------|-------|-----|");
    top.forEach((s, idx) => {
      const displayName = s.file.split("/").pop()?.replace(".mp4", "") ?? s.file;
      const snippet = s.text.slice(0, 130).replace(/\|/g, "\\|");
      reportLines.push(
        `| ${idx + 1} | ${displayName} | ${s.tSec}s | **${s.score}** | ${s.breakdown} — ${snippet}${s.text.length > 130 ? "…" : ""} |`,
      );
    });
    reportLines.push("");
  }

  const outFile = path.join("research", slug, `broll-comparison-${partKey}.md`);
  await fs.writeFile(outFile, reportLines.join("\n"));
  console.log(`Wrote ${outFile}`);

  // Quick console summary: how many lines does the current allocation out-score vs lose to the top proposal?
  let wins = 0, losses = 0, ties = 0;
  for (let i = 0; i < narrationLines.length; i++) {
    const nTokens = tokenize(narrationLines[i]);
    const nEntities = extractEntities(narrationLines[i]);
    const current = manifest[`narration${i + 1}`];
    if (!current) continue;
    const cf = fileByPath.get(current.file);
    if (!cf) continue;
    const curr = scoreWindow(nTokens, nEntities, cf, current.startFrom, 40);
    const proposed = diversifyTopK(allShots.map((s) => scoreShot(nTokens, nEntities, s)), 1)[0];
    const currScore = curr.best?.score ?? 0;
    const propScore = proposed?.score ?? 0;
    if (propScore > currScore + 0.01) losses++;
    else if (currScore > propScore + 0.01) wins++;
    else ties++;
  }
  console.log(`Current vs proposed: ${wins} wins / ${ties} ties / ${losses} losses (current is beaten ${losses}/${narrationLines.length} times)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
