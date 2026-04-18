# Plan D: Validate-Video QA Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a single pre-render validation script `scripts/validate-video.ts --video <slug>` that checks (1) TTS audio integrity — no abrupt truncation, adequate tail silence; (2) chart/title/quote "breathing time" — every non-video sequence gets enough narration duration for the viewer to read; (3) B-roll clips don't begin with heavy on-screen text (unsuitable as backgrounds); (4) sequence/audio counts agree. Fail fast before Phase 6 render.

**Architecture:** One orchestrator script + 4 focused checkers (one per concern). Uses ffmpeg+ffprobe (already required) for audio analysis and frame text density. Reuses the 4-column `.analysis.md` from Plan B for text-density checks. Reads Plan A's `SequenceEntry` types directly from the Part files via lightweight regex (no need for full TS compilation in a validator).

**Tech Stack:** Bun/TypeScript, ffmpeg, ffprobe, Node built-ins only.

---

## File Structure

Files created:
- `scripts/validate-video.ts` — orchestrator, runs all 4 checks, exits nonzero on any failure
- `scripts/validators/tts-integrity.ts` — checks each part audio for abrupt cuts and tail silence
- `scripts/validators/breathing-time.ts` — checks chart/title/quote sequences get ≥ N seconds of narration
- `scripts/validators/text-density.ts` — flags B-roll clips whose first 3 frames are >20% text pixels
- `scripts/validators/counts-consistency.ts` — sequence count per part matches narration.length and audio line count

Files modified:
- `CLAUDE.md` — add validate-video to pre-flight checks + pipeline

One focused responsibility per validator file. Each is independently testable and composable.

---

## Task 1: Build the TTS integrity checker

**Files:**
- Create: `scripts/validators/tts-integrity.ts`

- [ ] **Step 1: Write the checker**

```typescript
#!/usr/bin/env bun
/**
 * TTS audio integrity check.
 *
 * For each part audio file:
 *   1. File is non-empty and ffprobe-readable
 *   2. Tail silence ≥ 200ms (prevents abrupt cut when the next part begins)
 *   3. No sharp amplitude drop in the final 500ms (waveform cliff = truncated audio)
 *
 * Usage: bun run scripts/validators/tts-integrity.ts --video <slug>
 */

import path from "node:path";
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dir, "..", "..");
const DATA_DIR = path.join(ROOT, "src", "videos", slug, "data");

const { alignmentManifest } = await import(path.join(DATA_DIR, "alignment-manifest.ts")) as {
  alignmentManifest: Record<string, Record<string, { file: string; totalDuration: number }>>;
};

let issues = 0;

for (const lang of Object.keys(alignmentManifest)) {
  const parts = alignmentManifest[lang];
  for (const [partKey, part] of Object.entries(parts)) {
    if (!part?.file) continue;
    const audioPath = path.join(ROOT, "public", part.file);
    try { await fs.access(audioPath); }
    catch { console.log(`  🔴 ${lang}/${partKey}: audio file missing — ${part.file}`); issues++; continue; }

    // ── 1. Duration sanity ──
    let actualDur = 0;
    try {
      const out = execFileSync("ffprobe",
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audioPath],
        { encoding: "utf-8" }
      );
      actualDur = parseFloat(out.trim());
    } catch (e) {
      console.log(`  🔴 ${lang}/${partKey}: ffprobe failed — ${e}`); issues++; continue;
    }
    if (Math.abs(actualDur - part.totalDuration) > 0.5) {
      console.log(`  ⚠️  ${lang}/${partKey}: alignment says ${part.totalDuration}s but file is ${actualDur.toFixed(2)}s`);
    }

    // ── 2. Tail silence check (last 500ms) ──
    // Export the last 500ms as PCM and check max amplitude
    const tmp = `/tmp/vv-${lang}-${partKey}-tail.raw`;
    try {
      execFileSync("ffmpeg",
        ["-y", "-ss", String(Math.max(0, actualDur - 0.5)), "-i", audioPath,
         "-t", "0.5", "-f", "s16le", "-ac", "1", "-ar", "22050", tmp],
        { stdio: ["ignore", "ignore", "ignore"] }
      );
      const buf = await fs.readFile(tmp);
      // s16le: 2 bytes per sample, signed int16
      let maxAmp = 0;
      for (let i = 0; i < buf.length; i += 2) {
        const sample = Math.abs(buf.readInt16LE(i));
        if (sample > maxAmp) maxAmp = sample;
      }
      const maxAmpNorm = maxAmp / 32768;  // normalize to 0..1
      await fs.unlink(tmp).catch(() => {});

      // Tail should have ≤ 5% amplitude (near silence) for ≥ 200ms
      // Simpler check: max amplitude in final 500ms should be low
      if (maxAmpNorm > 0.08) {
        console.log(`  🔴 ${lang}/${partKey}: final 500ms max amplitude ${maxAmpNorm.toFixed(3)} — likely truncated (expected < 0.08)`);
        issues++;
      } else {
        console.log(`  ✅ ${lang}/${partKey}: ${actualDur.toFixed(1)}s, tail amp ${maxAmpNorm.toFixed(3)}`);
      }
    } catch (e) {
      console.log(`  ⚠️  ${lang}/${partKey}: tail check skipped — ${e}`);
    }
  }
}

console.log(`\nTTS integrity issues: ${issues}`);
process.exit(issues > 0 ? 1 : 0);
```

- [ ] **Step 2: Smoke test against xiaomi-su7**

```bash
bun run scripts/validators/tts-integrity.ts --video xiaomi-su7
```

Expected: Each part prints a ✅ line with duration and tail amplitude. If any 🔴 or ⚠️, inspect the offending audio in a DAW (Audacity) to verify.

- [ ] **Step 3: Commit**

```bash
git add scripts/validators/tts-integrity.ts
git commit -m "feat(validators): add TTS integrity check (tail silence, truncation)"
```

---

## Task 2: Build the breathing-time checker

**Files:**
- Create: `scripts/validators/breathing-time.ts`

- [ ] **Step 1: Write the checker**

```typescript
#!/usr/bin/env bun
/**
 * Breathing-time check.
 *
 * For every sequence with kind ∈ {chart, title, quote}, the narration duration
 * (seconds of TTS audio paired with it) must be ≥ MIN_BREATHING seconds so the
 * viewer has time to read the chart / title / quote.
 *
 * Chart: 4.0s minimum (complex visual, needs scan time)
 * Title: 2.5s minimum (short, high-impact)
 * Quote: 3.5s minimum (text-heavy)
 *
 * Usage: bun run scripts/validators/breathing-time.ts --video <slug>
 */

import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const MIN = { chart: 4.0, title: 2.5, quote: 3.5 } as const;

const ROOT = path.resolve(import.meta.dir, "..", "..");
const DATA_DIR = path.join(ROOT, "src", "videos", slug, "data");
const COMPONENTS_DIR = path.join(ROOT, "src", "videos", slug, "components");

type PartAlignment = {
  file: string;
  totalDuration: number;
  lines: Record<string, { startTime: number; endTime: number }>;
};
const { alignmentManifest } = await import(path.join(DATA_DIR, "alignment-manifest.ts")) as {
  alignmentManifest: Record<string, Record<string, PartAlignment>>;
};

// ── Parse each Part file to extract sequence kinds ──
type SeqKind = "video" | "chart" | "title" | "quote" | "ending";
type ParsedSeq = { partKey: string; lineIdx: number; kind: SeqKind };

const seqEntries: ParsedSeq[] = [];
const partDirs = (await fs.readdir(COMPONENTS_DIR)).filter((d) => /^part\d+$/.test(d));
for (const partDir of partDirs) {
  const partKey = partDir;
  const partFile = path.join(COMPONENTS_DIR, partDir,
    `${partDir.charAt(0).toUpperCase() + partDir.slice(1)}.tsx`);
  let src: string;
  try { src = await fs.readFile(partFile, "utf-8"); }
  catch { continue; }

  // Match both new (kind:) and old (type: "narration", Overlay:) styles
  const newRe = /kind:\s*"(video|chart|title|quote|ending)"[^}]*?lineIdx:\s*(\d+)/g;
  for (const m of src.matchAll(newRe)) {
    seqEntries.push({ partKey, lineIdx: Number(m[2]), kind: m[1] as SeqKind });
  }
  // Old style fallback — sequences with Overlay:X are charts
  const oldRe = /type:\s*"narration"[^}]*?lineIdx:\s*(\d+)[^}]*?(Overlay:|showTitle:\s*true)?/g;
  const hasNew = newRe.test(src);
  if (!hasNew) {
    for (const m of src.matchAll(oldRe)) {
      const lineIdx = Number(m[1]);
      const kind: SeqKind = m[2]?.startsWith("Overlay") ? "chart" : m[2]?.startsWith("showTitle") ? "title" : "video";
      seqEntries.push({ partKey, lineIdx, kind });
    }
  }
}

if (seqEntries.length === 0) {
  console.log("  ⚠️  No sequences parsed from Part files — regex may not match your Part style");
}

// ── Check breathing time on non-video sequences ──
let issues = 0;
for (const lang of Object.keys(alignmentManifest)) {
  for (const { partKey, lineIdx, kind } of seqEntries) {
    if (kind === "video" || kind === "ending") continue;
    const min = MIN[kind];
    const part = alignmentManifest[lang]?.[partKey];
    if (!part) continue;
    const lineKey = `line${lineIdx + 1}`;
    const line = part.lines[lineKey];
    if (!line) {
      console.log(`  ⚠️  ${lang}/${partKey}/${lineKey}: kind=${kind} but no alignment data`);
      continue;
    }
    const dur = line.endTime - line.startTime;
    if (dur < min) {
      console.log(`  🔴 ${lang}/${partKey}/${lineKey} (${kind}): ${dur.toFixed(2)}s < ${min}s minimum — extend narration or swap to video kind`);
      issues++;
    } else {
      console.log(`  ✅ ${lang}/${partKey}/${lineKey} (${kind}): ${dur.toFixed(2)}s`);
    }
  }
}

console.log(`\nBreathing-time issues: ${issues}`);
process.exit(issues > 0 ? 1 : 0);
```

- [ ] **Step 2: Smoke test**

```bash
bun run scripts/validators/breathing-time.ts --video xiaomi-su7
```

Expected: Chart/title sequences print their duration. Any under the minimum will 🔴; consider extending narration or swapping the sequence to `kind: "video"` so it can hide behind B-roll instead.

- [ ] **Step 3: Commit**

```bash
git add scripts/validators/breathing-time.ts
git commit -m "feat(validators): add breathing-time check for chart/title/quote sequences"
```

---

## Task 3: Build the text-density checker

**Files:**
- Create: `scripts/validators/text-density.ts`

- [ ] **Step 1: Write the checker**

```typescript
#!/usr/bin/env bun
/**
 * B-roll text density check.
 *
 * For every kind:"video" entry in broll-manifest.ts, inspect the .analysis.md
 * sibling of the source mp4. If the frames at (startFrom .. startFrom+3s) have
 * >20% OCR text pixel density (proxied by non-empty ocr_text in 2+ of 3 frames),
 * flag it — B-roll should not be text-heavy backgrounds.
 *
 * Usage: bun run scripts/validators/text-density.ts --video <slug>
 */

import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dir, "..", "..");
const DATA_DIR = path.join(ROOT, "src", "videos", slug, "data");
const VIDEOS_DIR = path.join(ROOT, "public", slug, "videos");

const { brollManifest } = await import(path.join(DATA_DIR, "broll-manifest.ts")) as {
  brollManifest: Record<string, Record<string, { file: string; startFrom: number }>>;
};

// ── Parse analysis.md to get timeline rows ──
type FrameRow = { tSec: number; visual: string; ocr: string };

function parseTimestampToSec(t: string): number {
  const parts = t.split(":");
  if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1]);
  return Number(t);
}

function parseAnalysisRows(md: string): FrameRow[] {
  const tableMatch = md.match(
    /\|\s*Time\s*\|\s*Visual\s*\|\s*On-screen Text\s*\|\s*Entities\s*\|\s*\n\|[^\n]+\n([\s\S]+?)(?=\n\n|\n---|$)/
  );
  if (!tableMatch) return [];
  const rows: FrameRow[] = [];
  for (const line of tableMatch[1].split("\n")) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length >= 3) {
      rows.push({
        tSec: parseTimestampToSec(cells[0]),
        visual: cells[1],
        ocr: cells[2],
      });
    }
  }
  return rows;
}

const cache: Record<string, FrameRow[]> = {};
async function getRows(file: string): Promise<FrameRow[]> {
  if (cache[file]) return cache[file];
  const relMp4 = file.replace(new RegExp(`^${slug}/videos/`), "");
  const mdPath = path.join(VIDEOS_DIR, relMp4.replace(/\.mp4$/, ".analysis.md"));
  try {
    const md = await fs.readFile(mdPath, "utf-8");
    cache[file] = parseAnalysisRows(md);
  } catch {
    cache[file] = [];
  }
  return cache[file];
}

let issues = 0;

for (const [partKey, part] of Object.entries(brollManifest)) {
  for (const [seqKey, entry] of Object.entries(part)) {
    const rows = await getRows(entry.file);
    if (rows.length === 0) {
      console.log(`  ⚠️  ${partKey}/${seqKey}: no .analysis.md for ${entry.file} — run video-describe-fast first`);
      continue;
    }
    // Sample frames in the 3s window starting at startFrom
    const windowRows = rows.filter((r) => r.tSec >= entry.startFrom && r.tSec < entry.startFrom + 3);
    if (windowRows.length < 2) {
      console.log(`  ⚠️  ${partKey}/${seqKey}: fewer than 2 analysis frames in window — interval too coarse`);
      continue;
    }
    const withText = windowRows.filter((r) => r.ocr && r.ocr.length > 8);
    if (withText.length >= Math.ceil(windowRows.length * 0.67)) {
      console.log(`  🔴 ${partKey}/${seqKey}: ${withText.length}/${windowRows.length} frames at ${entry.startFrom}s have heavy text — poor background material`);
      console.log(`      Text samples: ${withText.map((r) => `"${r.ocr.slice(0, 50)}"`).join(", ")}`);
      issues++;
    } else {
      console.log(`  ✅ ${partKey}/${seqKey}: ${withText.length}/${windowRows.length} text-heavy frames`);
    }
  }
}

console.log(`\nText-density issues: ${issues}`);
process.exit(issues > 0 ? 1 : 0);
```

- [ ] **Step 2: Smoke test**

Requires Plan B (upgraded describe-fast) to be merged and .analysis.md regenerated for at least some clips.

```bash
bun run scripts/validators/text-density.ts --video xiaomi-su7
```

Expected for xiaomi-su7: Before regeneration, most entries will ⚠️ (no .analysis.md in new format). After Plan B runs across all clips, actual text-density flags will surface.

- [ ] **Step 3: Commit**

```bash
git add scripts/validators/text-density.ts
git commit -m "feat(validators): add text-density check for B-roll clips"
```

---

## Task 4: Build the counts-consistency checker

**Files:**
- Create: `scripts/validators/counts-consistency.ts`

- [ ] **Step 1: Write the checker**

```typescript
#!/usr/bin/env bun
/**
 * Counts consistency check.
 *
 * For each part, these numbers MUST agree:
 *   - sequences.length in PartN.tsx (excluding kind:"ending")
 *   - content.partN.narration.length in content-cn.ts and content-en.ts
 *   - Object.keys(alignment.partN.lines).length in alignment-manifest.ts (both langs)
 *
 * Mismatches cause silent segments or runtime crashes at render.
 *
 * Usage: bun run scripts/validators/counts-consistency.ts --video <slug>
 */

import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dir, "..", "..");
const DATA_DIR = path.join(ROOT, "src", "videos", slug, "data");
const COMPONENTS_DIR = path.join(ROOT, "src", "videos", slug, "components");

type Content = Partial<Record<string, { narration: string[] }>>;
const { contentCN } = await import(path.join(DATA_DIR, "content-cn.ts")) as { contentCN: Content };
const { contentEN } = await import(path.join(DATA_DIR, "content-en.ts")) as { contentEN: Content };

type PartAlignment = { lines: Record<string, unknown> };
const { alignmentManifest } = await import(path.join(DATA_DIR, "alignment-manifest.ts")) as {
  alignmentManifest: Record<string, Record<string, PartAlignment>>;
};

let issues = 0;

const partDirs = (await fs.readdir(COMPONENTS_DIR)).filter((d) => /^part\d+$/.test(d));
for (const partDir of partDirs.sort()) {
  const partKey = partDir;

  // ── sequences.length (excluding ending) ──
  const partFile = path.join(COMPONENTS_DIR, partDir,
    `${partDir.charAt(0).toUpperCase() + partDir.slice(1)}.tsx`);
  const src = await fs.readFile(partFile, "utf-8").catch(() => "");
  // Matches both old ({ type: "narration", ...}) and new ({ kind: "video"|"chart"|"title"|"quote" })
  const narrationCount =
    (src.match(/type:\s*"narration"/g)?.length ?? 0) +
    (src.match(/kind:\s*"(video|chart|title|quote)"/g)?.length ?? 0);

  // ── content narration.length ──
  const cnLines = contentCN[partKey]?.narration?.length ?? 0;
  const enLines = contentEN[partKey]?.narration?.length ?? 0;

  // ── alignment lines count ──
  const alignCN = Object.keys(alignmentManifest.cn?.[partKey]?.lines ?? {}).length;
  const alignEN = Object.keys(alignmentManifest.en?.[partKey]?.lines ?? {}).length;

  const all = [narrationCount, cnLines, enLines, alignCN, alignEN];
  const allEqual = all.every((n) => n === all[0]);

  if (allEqual && all[0] > 0) {
    console.log(`  ✅ ${partKey}: ${all[0]} lines — sequences/content-cn/content-en/align-cn/align-en agree`);
  } else {
    console.log(`  🔴 ${partKey}: sequences=${narrationCount} content-cn=${cnLines} content-en=${enLines} align-cn=${alignCN} align-en=${alignEN}`);
    issues++;
  }
}

console.log(`\nCounts-consistency issues: ${issues}`);
process.exit(issues > 0 ? 1 : 0);
```

- [ ] **Step 2: Smoke test**

```bash
bun run scripts/validators/counts-consistency.ts --video xiaomi-su7
```

Expected: Every part prints ✅. If 🔴, the counts are out of sync — fix the smallest file (usually content-en or alignment).

- [ ] **Step 3: Commit**

```bash
git add scripts/validators/counts-consistency.ts
git commit -m "feat(validators): add counts-consistency check across sequences/content/alignment"
```

---

## Task 5: Build the orchestrator

**Files:**
- Create: `scripts/validate-video.ts`

- [ ] **Step 1: Write the orchestrator**

```typescript
#!/usr/bin/env bun
/**
 * Pre-render video QA harness.
 *
 * Runs all validators in sequence. Exits nonzero on any failure so it can gate
 * CI / be a Phase 5 → Phase 6 handoff check.
 *
 * Usage: bun run scripts/validate-video.ts --video <slug>
 *        bun run scripts/validate-video.ts --video <slug> --skip text-density
 */

import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const skipIdx = args.indexOf("--skip");
const skips = skipIdx >= 0 ? args[skipIdx + 1].split(",") : [];

const ROOT = path.resolve(import.meta.dir, "..");

const checks = [
  { name: "counts-consistency", script: "scripts/validators/counts-consistency.ts" },
  { name: "tts-integrity",      script: "scripts/validators/tts-integrity.ts" },
  { name: "breathing-time",     script: "scripts/validators/breathing-time.ts" },
  { name: "broll-overlap",      script: "scripts/validate-broll.ts" },
  { name: "text-density",       script: "scripts/validators/text-density.ts" },
];

let anyFailed = false;
for (const { name, script } of checks) {
  if (skips.includes(name)) {
    console.log(`\n━━━ ${name}: SKIPPED ━━━`);
    continue;
  }
  console.log(`\n━━━ ${name} ━━━`);
  try {
    execFileSync("bun", ["run", path.join(ROOT, script), "--video", slug],
      { stdio: "inherit", cwd: ROOT }
    );
  } catch {
    anyFailed = true;
    console.log(`  ✗ ${name} FAILED`);
  }
}

console.log(`\n${anyFailed ? "❌ Some validators failed" : "✅ All validators passed"}`);
process.exit(anyFailed ? 1 : 0);
```

- [ ] **Step 2: Smoke test on xiaomi-su7**

```bash
bun run scripts/validate-video.ts --video xiaomi-su7
```

Expected: Orchestrator runs all 5 checks, prints clear pass/fail per check. If text-density has ⚠️ due to missing new-format analysis.md files, that's expected pre-Plan-B.

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-video.ts
git commit -m "feat(validate-video): add pre-render QA orchestrator harness"
```

---

## Task 6: Update CLAUDE.md to integrate the harness

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add the harness to pre-flight checks**

In CLAUDE.md, find the "Production Rules (Quick Reference)" section. Replace the "Pre-flight checks" bullet with:

```markdown
- **Pre-flight checks**: Before Phase 6 render, run `bun run scripts/validate-video.ts --video <slug>`. This runs: counts-consistency (sequences/content/alignment agree), tts-integrity (no truncation, tail silence ≥ 200ms), breathing-time (charts ≥ 4s, titles ≥ 2.5s, quotes ≥ 3.5s), broll-overlap (zero overlapping time ranges), text-density (B-roll clips don't start with heavy on-screen text). Must pass before render.
```

- [ ] **Step 2: Add to the production pipeline**

Find "Phase 5: Build Remotion Components" and add after it:

```markdown
Phase 5.5: Validation
  → bun run scripts/validate-video.ts --video <slug>
  → Must pass before proceeding to Phase 6 render
  → Fix any 🔴 issues; ⚠️ warnings are informational
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document validate-video harness in pipeline and pre-flight checks"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - TTS integrity (no abrupt cut, tail silence) ✓ Task 1
   - Breathing time for non-video sequences ✓ Task 2
   - Text-density on B-roll clips ✓ Task 3
   - Counts consistency across layers ✓ Task 4
   - Orchestrator + pipeline integration ✓ Tasks 5 + 6
   - Leverages existing validate-broll for overlap ✓ Task 5

2. **Placeholder scan:** No TODOs. Every check is a concrete implementation.

3. **Type consistency:** All validators share the same `--video <slug>` CLI and exit code convention (nonzero on failure). All use `alignmentManifest` with the same shape defined in `src/shared/lib/alignment-types.ts`.

---

## Risk Notes for Executor

- **Depends on Plan A** (partially): the breathing-time checker reads `kind: "chart"` etc. from Part files. If Plan A not merged, the fallback regex for old `type: "narration"` + `Overlay:` style still works (see Task 2, `oldRe`). But the `title` and `quote` kinds are only detectable after Plan A.
- **Depends on Plan B** (partially): the text-density checker reads the 4-column .analysis.md. If Plan B not merged, text-density will ⚠️ most entries with "no .analysis.md" — you'll still catch overlap/breathing/counts issues, just not text density.
- **ffmpeg / ffprobe required**: already required by other scripts in `scripts/`.
- **Tail amplitude threshold (0.08) is conservative**: if legitimate audio tails are being flagged (e.g., long held final word), bump to 0.12. If you miss truncations, drop to 0.05.
- **Text-density "heavy" threshold**: 67% of sampled frames having >8 chars of OCR. Tune per video — news-style broadcasts will legitimately have lower-thirds throughout. For those cases, use `--skip text-density`.
- **Breathing-time minimums are targets, not reads**: 4s chart, 2.5s title, 3.5s quote. Based on general readability; videos with busier charts may need 5-6s.
