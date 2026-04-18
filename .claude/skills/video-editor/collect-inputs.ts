#!/usr/bin/env bun
/**
 * Collect editor inputs + score each director profile against the content.
 *
 * Inputs:
 *   - src/videos/<slug>/data/content-{cn,en}.ts
 *   - research/<slug>/{perspectives,visuals}.md
 *   - public/<slug>/videos/*.analysis.md
 *   - .claude/skills/video-editor/directors/*.md
 *
 * Output: JSON to stdout with recommended director + scores + all inputs.
 *
 * Usage:
 *   bun run .claude/skills/video-editor/collect-inputs.ts --video <slug>
 *   bun run .claude/skills/video-editor/collect-inputs.ts --video <slug> --director morris
 */

import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const videoSlug = args[args.indexOf("--video") + 1];
const directorOverride = args.indexOf("--director") >= 0
  ? args[args.indexOf("--director") + 1]
  : null;
if (!videoSlug || videoSlug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dir, "..", "..", "..");
const DATA_DIR = path.join(ROOT, "src", "videos", videoSlug, "data");
const RESEARCH_DIR = path.join(ROOT, "research", videoSlug);
const VIDEOS_DIR = path.join(ROOT, "public", videoSlug, "videos");
const DIRECTORS_DIR = path.join(import.meta.dir, "directors");

// ── 1. Narration ──
type PartContent = { title: string; subtitle: string; narration: string[] };
type Content = Partial<Record<"part1" | "part2" | "part3" | "part4" | "part5", PartContent>>;
const { contentCN } = (await import(path.join(DATA_DIR, "content-cn.ts"))) as { contentCN: Content };
const { contentEN } = (await import(path.join(DATA_DIR, "content-en.ts"))) as { contentEN: Content };
const partKeys = ["part1", "part2", "part3", "part4", "part5"] as const;
const narrationCN = partKeys.map((k) => contentCN[k]?.narration ?? []);
const narrationEN = partKeys.map((k) => contentEN[k]?.narration ?? []);

async function readIfExists(p: string): Promise<string> {
  try { return await fs.readFile(p, "utf-8"); } catch { return ""; }
}
const perspectives = await readIfExists(path.join(RESEARCH_DIR, "perspectives.md"));
const visuals = await readIfExists(path.join(RESEARCH_DIR, "visuals.md"));

// ── 2. Broll pool from .analysis.md ──
type FrameRow = { t: string; visual: string; ocr: string; entities: string[] };
type BrollItem = { file: string; summary: string; entities: string[]; timeline: FrameRow[] };
function parseAnalysis(md: string): Omit<BrollItem, "file"> {
  const summaryMatch = md.match(/##\s+Summary\s*\n+([\s\S]*?)(?=\n##\s|$)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : "";
  const entitiesMatch = md.match(/##\s+Identified Entities\s*\n+([^\n]+)/);
  const entities = entitiesMatch
    ? entitiesMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const rows: FrameRow[] = [];
  const tableMatch = md.match(
    /\|\s*Time\s*\|\s*Visual\s*\|\s*On-screen Text\s*\|\s*Entities\s*\|\s*\n\|[^\n]+\n([\s\S]+?)(?=\n\n|\n---|$)/
  );
  if (tableMatch) {
    for (const line of tableMatch[1].split("\n")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length >= 4) {
        rows.push({
          t: cells[0],
          visual: cells[1],
          ocr: cells[2],
          entities: cells[3] ? cells[3].split(",").map((s) => s.trim()).filter(Boolean) : [],
        });
      }
    }
  }
  return { summary, entities, timeline: rows };
}

const brollPool: BrollItem[] = [];
try {
  const videoFiles = (await fs.readdir(VIDEOS_DIR)).filter((f) => f.endsWith(".mp4"));
  for (const file of videoFiles) {
    const mdPath = path.join(VIDEOS_DIR, file.replace(/\.mp4$/, ".analysis.md"));
    const md = await readIfExists(mdPath);
    if (!md) continue;
    brollPool.push({ file: `${videoSlug}/videos/${file}`, ...parseAnalysis(md) });
  }
} catch {
  // VIDEOS_DIR may not exist
}

// ── 3. Director scoring ──
type ScoringRule = { points: number; phrases: string[] };
type DirectorProfile = {
  name: string;
  identity: string;
  laws: string;
  roleBalance: string;
  rationaleVoice: string;
  signatureMoves: string;
  scoring: ScoringRule[];
  raw: string;
};

function parseDirectorProfile(name: string, md: string): DirectorProfile {
  const section = (heading: string): string => {
    const re = new RegExp(`##\\s+${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s|$)`);
    const m = md.match(re);
    return m ? m[1].trim() : "";
  };
  const identity = section("Identity");
  const laws = section("Three Laws");
  const roleBalance = section("Role Balance Preference \\(per 8-10 line part\\)");
  const rationaleVoice = section("Rationale Voice");
  const signatureMoves = section("Signature Moves");
  const scoringRaw = section("Scoring Signals");

  // Parse scoring — each line like:  **Strong signal (+3 each):** phrase1, phrase2, ...
  const scoring: ScoringRule[] = [];
  for (const line of scoringRaw.split("\n")) {
    const m = line.match(/\*\*[^*]*\(([-+]?\d+)\s*each\)[^*]*\*\*\s*(.*)/);
    if (!m) continue;
    const points = Number(m[1]);
    const rest = m[2].trim();
    const phrases = rest.split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    if (phrases.length > 0) scoring.push({ points, phrases });
  }

  return { name, identity, laws, roleBalance, rationaleVoice, signatureMoves, scoring, raw: md };
}

const directorFiles = (await fs.readdir(DIRECTORS_DIR)).filter(
  (f) => f.endsWith(".md") && f !== "README.md"
);
const directors: DirectorProfile[] = [];
for (const f of directorFiles) {
  const name = f.replace(/\.md$/, "");
  const md = await fs.readFile(path.join(DIRECTORS_DIR, f), "utf-8");
  directors.push(parseDirectorProfile(name, md));
}

// Build scoring corpus: narration text + perspectives + visuals (lowercase for matching)
const corpus = [
  ...narrationCN.flat(),
  ...narrationEN.flat(),
  perspectives,
  visuals,
].join(" ").toLowerCase();

function scoreDirector(d: DirectorProfile): { total: number; hits: { phrase: string; points: number }[] } {
  let total = 0;
  const hits: { phrase: string; points: number }[] = [];
  for (const rule of d.scoring) {
    for (const phrase of rule.phrases) {
      const needle = phrase.toLowerCase();
      if (!needle) continue;
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "g");
      const matches = corpus.match(re);
      if (matches && matches.length > 0) {
        const points = rule.points * matches.length;
        total += points;
        hits.push({ phrase, points });
      }
    }
  }
  return { total, hits };
}

const scores = directors.map((d) => ({
  name: d.name,
  ...scoreDirector(d),
}));
scores.sort((a, b) => b.total - a.total);

const recommended = directorOverride && directors.find((d) => d.name === directorOverride)
  ? directorOverride
  : scores[0]?.name ?? "curtis";

const selectedProfile = directors.find((d) => d.name === recommended);

// ── 4. Emit JSON ──
console.log(JSON.stringify({
  slug: videoSlug,
  narration: { cn: narrationCN, en: narrationEN },
  research: { perspectives, visuals },
  broll_pool: brollPool,
  director: {
    recommended,
    override_used: directorOverride !== null && directors.some((d) => d.name === directorOverride),
    scores,
    profile: selectedProfile ?? null,
  },
}, null, 2));
