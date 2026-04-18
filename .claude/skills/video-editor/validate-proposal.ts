#!/usr/bin/env bun
/**
 * Validate a broll-manifest.proposed.ts from the video-editor skill.
 * Checks role comment presence, role balance (vs selected director's preference),
 * zero overlap (40s slot), no adjacent same-file.
 *
 * Usage: bun run .claude/skills/video-editor/validate-proposal.ts --video <slug>
 */

import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dir, "..", "..", "..");
const proposalPath = path.join(ROOT, "src", "videos", slug, "data", "broll-manifest.proposed.ts");
const src = await fs.readFile(proposalPath, "utf-8");

// Parse director from the proposal header comment
const directorMatch = src.match(/\/\/\s*Director:\s*(\w+)/);
const directorName = directorMatch ? directorMatch[1] : "unknown";

// Load director's role balance preference
const DIRECTORS_DIR = path.join(import.meta.dir, "directors");
let roleTargets: Record<string, [number, number]> = {
  literal: [3, 4], emotional: [2, 3], implication: [1, 2], contrast: [1, 2],
};
try {
  const profilePath = path.join(DIRECTORS_DIR, `${directorName}.md`);
  const profileMd = await fs.readFile(profilePath, "utf-8");
  const balanceMatch = profileMd.match(/##\s+Role Balance Preference[^\n]*\n+([\s\S]*?)(?=\n##\s|$)/);
  if (balanceMatch) {
    const parsed: Record<string, [number, number]> = {};
    for (const line of balanceMatch[1].split("\n")) {
      const m = line.match(/^\s*-\s*(literal|emotional|implication|contrast):\s*(\d+)\s*-\s*(\d+)/);
      if (m) parsed[m[1]] = [Number(m[2]), Number(m[3])];
    }
    if (Object.keys(parsed).length === 4) roleTargets = parsed;
  }
} catch {
  console.log(`⚠️  Could not load director profile "${directorName}" — using default role targets`);
}

type Entry = {
  partKey: string;
  narrationKey: string;
  role: string;
  rationale: string;
  file: string;
  startFrom: number;
};

const entries: Entry[] = [];
let currentPart = "";
const partRe = /^\s*(part[1-9]):/;
const commentRe = /\/\/\s*line\s+\d+\s+\[(literal|emotional|implication|contrast)\]\s*(.*)/;
const entryRe = /(narration\d+|ending):\s*\{\s*file:\s*"([^"]+)",\s*startFrom:\s*(\d+)/;

const lines = src.split("\n");
let pendingComment: { role: string; rationale: string } | null = null;
for (const rawLine of lines) {
  const line = rawLine.trim();
  const partMatch = partRe.exec(rawLine);
  if (partMatch) { currentPart = partMatch[1]; continue; }
  const commentMatch = commentRe.exec(line);
  if (commentMatch) {
    pendingComment = { role: commentMatch[1], rationale: commentMatch[2].trim() };
    continue;
  }
  const entryMatch = entryRe.exec(line);
  if (entryMatch && currentPart) {
    entries.push({
      partKey: currentPart,
      narrationKey: entryMatch[1],
      role: pendingComment?.role ?? "MISSING",
      rationale: pendingComment?.rationale ?? "",
      file: entryMatch[2],
      startFrom: Number(entryMatch[3]),
    });
    pendingComment = null;
  }
}

console.log(`Parsed ${entries.length} entries from ${slug}/broll-manifest.proposed.ts`);
console.log(`Director: ${directorName}  (targets: literal=${roleTargets.literal.join("-")}, emotional=${roleTargets.emotional.join("-")}, implication=${roleTargets.implication.join("-")}, contrast=${roleTargets.contrast.join("-")})`);

let fatal = 0;

// ── 1. role comment present ──
let missingRole = 0;
for (const e of entries) {
  if (e.role === "MISSING" && e.narrationKey !== "ending") {
    console.log(`  🔴 ${e.partKey}/${e.narrationKey}: missing role comment`);
    missingRole++;
  }
}
if (missingRole === 0) console.log("  ✅ Every entry has a role comment.");
fatal += missingRole;

// ── 2. role balance per part (vs director preference) ──
console.log("\n═══ Role Balance (vs director targets) ═══");
const byPart: Record<string, string[]> = {};
for (const e of entries) {
  if (e.narrationKey === "ending") continue;
  (byPart[e.partKey] ||= []).push(e.role);
}
for (const [part, roles] of Object.entries(byPart)) {
  const counts = roles.reduce<Record<string, number>>((acc, r) => {
    acc[r] = (acc[r] || 0) + 1; return acc;
  }, {});
  const tot = roles.length;
  console.log(`  ${part}: ${tot} lines — literal=${counts.literal || 0} emotional=${counts.emotional || 0} implication=${counts.implication || 0} contrast=${counts.contrast || 0}`);
  for (const role of ["literal", "emotional", "implication", "contrast"] as const) {
    const n = counts[role] || 0;
    const [lo, hi] = roleTargets[role];
    if (tot >= 6 && (n < lo || n > hi)) {
      console.log(`    ⚠️  ${role} count ${n} outside target ${lo}-${hi} for ${directorName}`);
    }
  }
}

// ── 3. overlap ──
console.log("\n═══ Overlap (40s slot) ═══");
const SLOT = 40;
const byFile: Record<string, Entry[]> = {};
for (const e of entries) (byFile[e.file] ||= []).push(e);
let overlaps = 0;
for (const [file, fes] of Object.entries(byFile)) {
  const sorted = fes.slice().sort((a, b) => a.startFrom - b.startFrom);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].startFrom + SLOT > sorted[i + 1].startFrom) {
      console.log(`  🔴 ${file}: ${sorted[i].partKey}/${sorted[i].narrationKey} [${sorted[i].startFrom}s] overlaps ${sorted[i+1].partKey}/${sorted[i+1].narrationKey} [${sorted[i+1].startFrom}s]`);
      overlaps++;
    }
  }
}
if (overlaps === 0) console.log("  ✅ No overlapping slots.");
fatal += overlaps;

// ── 4. adjacent same-file ──
console.log("\n═══ Adjacent Same-File ═══");
let adjacent = 0;
for (const part of Object.keys(byPart)) {
  const seq = entries.filter((e) => e.partKey === part).map((e) => e.file);
  for (let i = 0; i < seq.length - 1; i++) {
    if (seq[i] && seq[i] === seq[i + 1]) {
      console.log(`  🔴 ${part}: adjacent entries both use ${seq[i]}`);
      adjacent++;
    }
  }
}
if (adjacent === 0) console.log("  ✅ No adjacent same-file violations.");
fatal += adjacent;

console.log(`\nTotal fatal issues: ${fatal}`);
process.exit(fatal > 0 ? 1 : 0);
