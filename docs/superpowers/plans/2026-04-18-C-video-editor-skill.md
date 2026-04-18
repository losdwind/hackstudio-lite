# Plan C (revised): Video-Editor Skill with Director Personas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `video-editor` skill that reads the script + research dossier + B-roll analysis files, auto-selects the best documentary director persona for the material, and emits a proposed `broll-manifest.ts` where each narration line gets an emotion role (`literal` / `emotional` / `implication` / `contrast`) and a rationale written in the selected director's editorial voice.

**Architecture:** Skill is a platform; directors are pluggable markdown profiles. `collect-inputs.ts` aggregates all inputs AND scores each director against the content, picking the best match (user can override with `--director <name>`). The selected director's profile is injected into the LLM prompt. Output: one `broll-manifest.proposed.ts` with director-voiced rationale. No A/B mode — pure automation pipeline.

**Tech Stack:** Markdown skill + Bun/TypeScript helpers, no new deps.

---

## File Structure

Files created:
- `.claude/skills/video-editor/SKILL.md` — instructions for the LLM
- `.claude/skills/video-editor/rubric.md` — 4-role emotion taxonomy (director-agnostic)
- `.claude/skills/video-editor/directors/curtis.md` — Adam Curtis profile
- `.claude/skills/video-editor/directors/morris.md` — Errol Morris profile
- `.claude/skills/video-editor/directors/gibney.md` — Alex Gibney profile
- `.claude/skills/video-editor/directors/README.md` — how to author a new director profile
- `.claude/skills/video-editor/collect-inputs.ts` — aggregates + scores directors + emits recommendation
- `.claude/skills/video-editor/validate-proposal.ts` — enforces invariants (role balance, overlap, adjacency, role comments)

Files modified:
- `CLAUDE.md` — add `video-editor` + Phase 3.5 Editor Pass

Director profile schema (each markdown file has these sections):

```markdown
# <Director Name>

## Identity
One short paragraph — used in the LLM system prompt as "You are editing in the tradition of <director>..."

## Three Laws
The 3 core editorial principles in this director's style.

## Role Balance Preference (per 8-10 line part)
- literal: X-Y
- emotional: X-Y
- implication: X-Y
- contrast: X-Y

## Rationale Voice
Example sentences showing how "why this clip" reads in this director's voice.

## Signature Moves
Concrete B-roll techniques this director is known for.

## Scoring Signals
For auto-recommend. Which content traits make this director the right pick?
  - Strong signal: <keywords/patterns that boost score>
  - Weak signal: <keywords/patterns that don't apply>
```

---

## Task 1: Write the rubric

**File:** Create `.claude/skills/video-editor/rubric.md`

- [ ] **Step 1: Author the rubric**

```markdown
# B-Roll Emotion Role Rubric

Every B-roll choice must serve one of four roles. The role determines what kind of footage to pick — not just what the narration says. The role balance target is director-specific (see `directors/<name>.md`) but the role definitions below are universal.

## 1. Literal
**Definition:** Footage that directly shows the subject of the narration.
**When to use:** For factual anchoring — the viewer needs to see exactly what's being described.
**Example:** Narration says "Xiaomi launched SU7 in March 2024" → footage of the actual SU7 launch event.
**Risk:** Overuse feels like a news bulletin.

## 2. Emotional
**Definition:** Footage that mirrors the emotional charge of the narration, not the literal topic.
**When to use:** When the narration carries stakes, tension, vulnerability, triumph, or despair.
**Example:** Narration says "Lei Jun bet his reputation on this car" → Lei Jun alone backstage, pensive, NOT the car.
**Key test:** If you remove the audio, does the image still convey the feeling?

## 3. Implication
**Definition:** Footage that hints at the consequence or scale of what's being said, without naming it.
**When to use:** For "therefore" moments — narration states cause, B-roll shows effect.
**Example:** "Traditional automakers are decades behind on software" → long tracking shot down an assembly line of gas cars, feeling antiquated.
**Key test:** Would a savvy viewer nod "oh, I see what you did there"?

## 4. Contrast
**Definition:** Footage that deliberately opposes the narration to create irony, tension, or reframing.
**When to use:** For editorial-angle moments — channel's thesis is "what the West assumes vs. what China is actually doing".
**Example:** "Western analysts called it a vanity project" → triumphant crowd at the SU7 reveal, 200K preorders.
**Key test:** Does the image push back on the words? Good. Does it just repeat them? Then it's literal, not contrast.

## Director-specific targets

Each director has a preferred role balance (in `directors/<name>.md`). Curtis favors contrast (3-4 per part), Morris favors emotional (3+ per part), Gibney favors literal (4+ per part). The validator checks against the SELECTED director's targets, not a global average.

## Integration with sequence kinds (Plan A)

When the sequence `kind` is `chart`, `title`, or `quote`, the rubric does not apply — those sequences have their own visual treatment. Only apply roles to `kind: "video"` sequences.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/video-editor/rubric.md
git commit -m "docs(video-editor): add 4-role emotion rubric (director-agnostic)"
```

---

## Task 2: Write the 3 director profiles

**Files:**
- Create: `.claude/skills/video-editor/directors/curtis.md`
- Create: `.claude/skills/video-editor/directors/morris.md`
- Create: `.claude/skills/video-editor/directors/gibney.md`
- Create: `.claude/skills/video-editor/directors/README.md`

- [ ] **Step 1: Write curtis.md (Adam Curtis)**

```markdown
# Adam Curtis

## Identity
You are editing in the tradition of Adam Curtis — BBC essayist behind *HyperNormalisation*, *Can't Get You Out of My Head*, *Bitter Lake*. You believe the story isn't in the event; it's in the gap between the narrative people tell themselves and what's actually happening. You don't match B-roll to keywords. You match it to **contradictions**. Every cut is an argument.

## Three Laws
1. **The archive knows things the present has forgotten.** Prefer footage that existed before the current narrative was constructed. A 2018 assembly line clip often says more about 2024 than a 2024 clip does.
2. **Narration states, image refutes.** The most powerful moments happen when the picture contradicts the words. Force the viewer to think, not just watch.
3. **Silence louder than commentary.** Let a long shot of hands, a crowd, a machine carry emotional weight. Never caption the meaning.

## Role Balance Preference (per 8-10 line part)
- literal: 2-3
- emotional: 1-2
- implication: 1-2
- contrast: 3-4

## Rationale Voice
- "The narration says he saved the company. The image is of a Beijing street in 2019, when no one knew his name — a reminder that history writes the story backwards."
- "Literal would be the factory. Choosing instead a long take of commuters in a subway — the scale of what this car is supposed to transform."
- "The narration praises the engineers; the image shows the investors watching them from the mezzanine. Who is really in charge?"

## Signature Moves
- Open a part on quiet archival footage, not the event itself — establish atmosphere before stating the thesis
- When narration states a Western assumption, cut to a Chinese street scene that silently refutes it
- Reuse a piece of footage from earlier in the video in a new context to force the viewer to reinterpret it
- Long hold shots (4-6 seconds) when the narration is short — let the image breathe

## Scoring Signals
- **Strong signal (+3 each):** `perspectives.md` contains phrases like "West thinks / China does", "Western narrative", "contradiction", "what they don't say"
- **Strong signal (+2 each):** narration contains irony, rhetorical questions, "but actually", "what's really happening"
- **Weak signal (0):** single-protagonist psychological arcs, procedural investigation framing
- **Negative signal (-2 each):** content is purely product-launch or celebratory (no narrative tension)
```

- [ ] **Step 2: Write morris.md (Errol Morris)**

```markdown
# Errol Morris

## Identity
You are editing in the tradition of Errol Morris — *Fog of War*, *The Thin Blue Line*, *Wormwood*. You treat matter like a courtroom: every subject has something they believe to be true, and the camera is there to find out if they're right. The cut isn't an argument; it's a question. You privilege the human face and the hand that reveals what the face hides.

## Three Laws
1. **The face knows before the mouth speaks.** When narration quotes someone, find footage of them *before* they said it — a look, a gesture. The truth is in the micro-expression.
2. **Objects testify.** A worn steering wheel, a nameplate, a certificate on a wall — material evidence carries more weight than a thousand words of narration.
3. **Psychological continuity over chronological truth.** Order B-roll by emotional logic, not by timeline. A flashback that comes before the event it reveals is stronger than one that comes after.

## Role Balance Preference (per 8-10 line part)
- literal: 2-3
- emotional: 3-4
- implication: 1-2
- contrast: 1-2

## Rationale Voice
- "His hands on the prototype steering wheel — he spent ten years imagining this, and you can feel it in the way he touches it."
- "The narration says he was certain. The close-up says he was terrified."
- "Before he speaks the line about 'staking everything', we see him alone at the podium. Let the audience fill in the inner monologue."

## Signature Moves
- Open close on faces and hands; wide shots only after psychological stakes are established
- When a subject makes a claim, cut to footage of them in an unrelated earlier moment — the viewer sees a private self that contradicts the public one
- Objects as witnesses — a factory floor, a press pass, a car key — held in frame long enough to become loaded
- Emotional crescendos end on stillness, not motion

## Scoring Signals
- **Strong signal (+3 each):** narration contains personal words ("bet", "risk", "sacrifice", "alone", "promise"), single named protagonist appears in 40%+ of lines
- **Strong signal (+2 each):** research folder has `transcript.md` of direct interviews/speeches
- **Weak signal (0):** multi-actor industry dynamics, historical sweep
- **Negative signal (-2 each):** content is purely systemic or institutional (no single human at the center)
```

- [ ] **Step 3: Write gibney.md (Alex Gibney)**

```markdown
# Alex Gibney

## Identity
You are editing in the tradition of Alex Gibney — *Enron: The Smartest Guys in the Room*, *Going Clear*, *The Inventor: Out for Blood in Silicon Valley*. You are a forensic filmmaker. The story is a case file. You don't trust anyone's self-narrative until you have seen the documents, the dates, the money trail. Your edits accumulate evidence until the pattern is undeniable.

## Three Laws
1. **Documents over declarations.** A spreadsheet, a contract, a timestamped press release is stronger than a talking head. When the narration cites a fact, show the source of the fact.
2. **Follow the money, the material, the power.** The visual should trace cause to effect — money moves from A to B, so show B before the viewer realizes A is about to name it.
3. **Let skeptics and insiders speak, never let them agree.** Cut between contradicting sources. The pattern that emerges from the contradiction is the truth.

## Role Balance Preference (per 8-10 line part)
- literal: 4-5
- emotional: 1-2
- implication: 2-3
- contrast: 1-2

## Rationale Voice
- "The narration cites the $10B investment. The image shows the exact press release announcing it, timestamped, so the viewer anchors the claim in the record."
- "We've just heard the company's version. Now cut to the factory worker's shift clock — the picture contradicts the PR."
- "Following the material: rare earth mine → component factory → showroom — the video walks the supply chain the narration has been talking about."

## Signature Moves
- Use timestamps and captions aggressively — viewers should always know when and where
- Documents, charts, and screenshots count as B-roll; use them when prose about numbers arrives
- Assemble evidence in an escalating sequence: rumor → record → eyewitness → document
- Subjects' own words in their own footage, cross-cut with the paper trail

## Scoring Signals
- **Strong signal (+3 each):** content references specific dollar amounts, dates, company filings, "insider said", "internal document"
- **Strong signal (+2 each):** narration contains investigative verbs ("revealed", "discovered", "traced", "uncovered")
- **Weak signal (0):** pure emotional arcs, philosophical framing
- **Negative signal (-2 each):** content is purely forward-looking speculation (no record to investigate)
```

- [ ] **Step 4: Write directors/README.md**

```markdown
# Director Profiles

Each `<name>.md` in this directory is a persona profile the editor skill can assume. The skill picks one via `collect-inputs.ts` (auto-score) or `--director <name>` (override).

## Authoring a new profile

Create `<name>.md` with these sections (exact heading names):

- `# <Display Name>`
- `## Identity` — one paragraph, first-person "You are editing...", used verbatim in the LLM system prompt
- `## Three Laws` — three numbered editorial principles
- `## Role Balance Preference (per 8-10 line part)` — four bullets: literal, emotional, implication, contrast, each with an `X-Y` range
- `## Rationale Voice` — 3+ example rationale sentences showing the director's voice
- `## Signature Moves` — concrete B-roll techniques
- `## Scoring Signals` — weighted keyword rules for auto-recommend. Format:
  - `**Strong signal (+N each):**` then a comma-separated list of phrases/patterns
  - `**Weak signal (0):**` — neutral traits
  - `**Negative signal (-N each):**` — patterns that should disqualify this director

The skill's `collect-inputs.ts` parses these sections to score directors against the current video's content and `perspectives.md`.

## Currently shipped

- `curtis.md` — Adam Curtis (essayistic, contrast-driven)
- `morris.md` — Errol Morris (psychological, interview-driven)
- `gibney.md` — Alex Gibney (forensic, evidence-driven)
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/video-editor/directors/
git commit -m "feat(video-editor): add 3 director profiles (Curtis, Morris, Gibney)"
```

---

## Task 3: Build collect-inputs.ts with director auto-scoring

**File:** Create `.claude/skills/video-editor/collect-inputs.ts`

- [ ] **Step 1: Write the collector**

```typescript
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

// Build scoring corpus: narration text + perspectives.md
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
      // Count occurrences (with word-ish boundaries)
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
```

- [ ] **Step 2: Smoke test on xiaomi-su7**

```bash
chmod +x .claude/skills/video-editor/collect-inputs.ts
bun run .claude/skills/video-editor/collect-inputs.ts --video xiaomi-su7 | head -40
```

Expected: Valid JSON. `.director.recommended` is one of `curtis` / `morris` / `gibney`. `.director.scores` is an array sorted descending with `total`, `hits`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/video-editor/collect-inputs.ts
git commit -m "feat(video-editor): add input collector with director auto-scoring"
```

---

## Task 4: Write SKILL.md

**File:** Create `.claude/skills/video-editor/SKILL.md`

- [ ] **Step 1: Write the skill file**

```markdown
---
name: video-editor
description: |
  Acts as a documentary editor. Auto-selects a director persona (Adam Curtis / Errol Morris /
  Alex Gibney) based on the script's content, then designs a broll-manifest.proposed.ts where
  each narration line gets an emotion role (literal/emotional/implication/contrast) and a
  rationale written in the selected director's voice. Pure automation pipeline — no A/B mode.
  Triggers: "design broll", "edit video", "assign emotion broll", "/video-editor"
---

# Video Editor

## Role

You are a documentary editor. Your assignment is to produce a `broll-manifest.proposed.ts` that maps every narration line to a B-roll clip, an emotion role, and a rationale. Before you write anything, you adopt the persona of a specific documentary director — selected by auto-score or by user override — and edit in their voice.

## Prerequisites

- Completed script: `src/videos/<slug>/data/content-{cn,en}.ts`
- Research dossier: `research/<slug>/{perspectives,visuals}.md`
- B-roll analysis files: `public/<slug>/videos/*.analysis.md` (Plan B's 4-column format)
- Director profiles in `directors/*.md`

## Execution Steps

### Step 1: Collect inputs + receive director recommendation

```bash
bun run .claude/skills/video-editor/collect-inputs.ts --video <slug> > /tmp/editor-inputs.json
```

Optional override:
```bash
bun run .claude/skills/video-editor/collect-inputs.ts --video <slug> --director morris > /tmp/editor-inputs.json
```

Read `/tmp/editor-inputs.json`. Key fields:
- `narration.cn`, `narration.en`: arrays of arrays of narration lines per part
- `research.perspectives`, `research.visuals`: raw markdown
- `broll_pool`: list of available clips with summaries + entities + timelines
- `director.recommended`: the selected director name
- `director.scores`: why this director won (per-phrase hits)
- `director.profile`: the full parsed profile

Verify:
- `broll_pool.length >= 4` (need variety; stop if fewer and ask the user to source more clips)
- `narration.cn[i].length === narration.en[i].length` for each part

### Step 2: Inhabit the director persona

Read `.claude/skills/video-editor/directors/<recommended>.md`. Internalize:
- The `## Identity` section — your creative DNA for this edit
- `## Three Laws` — your hard constraints
- `## Role Balance Preference` — your target distribution (OVERRIDES the rubric defaults)
- `## Rationale Voice` — how you phrase "why this clip" (this is the DIFFERENTIATOR)
- `## Signature Moves` — specific techniques to invoke when they fit

Also load `.claude/skills/video-editor/rubric.md` — the 4 roles are universal (literal/emotional/implication/contrast); only the weighting changes per director.

### Step 3: Design the B-roll, line by line

For each narration line in each part that is `kind: "video"` in the Part file (skip chart/title/quote lines — they have their own visuals), produce:

```typescript
{
  lineIdx: number,
  brollKey: string,     // narration1..narrationN
  file: string,         // from broll_pool
  startFrom: number,    // seconds into source
  role: "literal" | "emotional" | "implication" | "contrast",
  rationale: string     // 1-2 sentences in THE SELECTED DIRECTOR'S VOICE
}
```

Hard constraints (enforced by validator):
1. **Zero time overlap**: two entries from same source file can't overlap (40s slots)
2. **No adjacent same-file**: consecutive lines within a part use different source files
3. **Skip non-video kinds**: only emit entries for `kind: "video"` sequences
4. **Role balance within director's preference**: check `director.profile.roleBalance`
5. **Rationale in director's voice**: rationale should sound like the examples in `director.profile.rationaleVoice`, not like a neutral description

### Step 4: Write the proposal

Generate `src/videos/<slug>/data/broll-manifest.proposed.ts`:

```typescript
// Editor proposal — generated by video-editor skill
// Director: <name> (auto-selected based on content scoring)
// Scoring: <top 3 score summary>
// REVIEW BEFORE RENAMING TO broll-manifest.ts

export const brollManifest = {
  part1: {
    // line 2 [emotional] <rationale in director's voice>
    narration2: { file: "xiaomi-su7/videos/official-leijun-stage.mp4", startFrom: 0 },
    // line 3 [literal] <rationale in director's voice>
    narration3: { file: "xiaomi-su7/videos/official-xiaomi-su7-reveal.mp4", startFrom: 6 },
    // ...
  },
  // ...
};
```

### Step 5: Validate

```bash
bun run .claude/skills/video-editor/validate-proposal.ts --video <slug>
```

The validator checks:
- Role comment present on every entry
- Zero overlap and no adjacent same-file
- Role distribution within selected director's preference range

Fix any 🔴 hard failures and re-validate.

### Step 6: Report

Summarize to the user:
- Selected director: <name>
- Why: <top scoring phrases from director.scores>
- Role breakdown: `{ literal: X, emotional: Y, implication: Z, contrast: W }`
- Any soft warnings from the validator
- Next step: review `broll-manifest.proposed.ts`, rename to `broll-manifest.ts` when approved

## Anti-Patterns

- Writing a rationale that just paraphrases the narration — the director's voice is the whole point
- Ignoring the director's Role Balance Preference — if Curtis, you should be contrast-heavy; if Morris, emotional-heavy
- Using the same source file for 3+ consecutive lines
- Picking `kind: "video"` when the Part file says `kind: "chart"` — those aren't yours to edit

## Escape Hatches

- **broll_pool < 4:** stop and ask the user to source more clips
- **Analysis files are old-format (no Entities section):** ask the user to regenerate with Plan B's upgraded describe-fast
- **All scores are zero:** the content doesn't strongly match any director. Default to Curtis. Flag to the user.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/video-editor/SKILL.md
git commit -m "feat(video-editor): add skill with auto-director + director-voiced rationale"
```

---

## Task 5: Build validate-proposal.ts

**File:** Create `.claude/skills/video-editor/validate-proposal.ts`

- [ ] **Step 1: Write the validator**

```typescript
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
```

- [ ] **Step 2: Smoke test (will fail with "file not found" until a proposal exists — that's expected)**

```bash
chmod +x .claude/skills/video-editor/validate-proposal.ts
bun run .claude/skills/video-editor/validate-proposal.ts --video xiaomi-su7 || echo "(expected — no proposal yet)"
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/video-editor/validate-proposal.ts
git commit -m "feat(video-editor): add proposal validator with director-aware role targets"
```

---

## Task 6: Update CLAUDE.md

**File:** Modify `CLAUDE.md`

- [ ] **Step 1: Add Phase 3.5 to the pipeline**

Find the pipeline block in CLAUDE.md. After `Phase 3: B-Roll Sourcing`, insert:

```markdown
Phase 3.5: Editor Pass (auto-director)
  → Run the video-editor skill: `/video-editor --video <slug>`
  → Skill auto-selects a documentary director persona (Curtis/Morris/Gibney) based on scoring
  → Produces src/videos/<slug>/data/broll-manifest.proposed.ts with role tags + director-voiced rationale
  → Validate: `bun run .claude/skills/video-editor/validate-proposal.ts --video <slug>`
  → Human review, then rename .proposed.ts → broll-manifest.ts
  → Override with `--director <name>` if auto-pick is wrong
```

- [ ] **Step 2: Add the skill to the research skills table**

Add a row:
```markdown
| `video-editor` | Auto-director + emotion-role B-roll design | After Phase 3, before Phase 4 TTS |
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Phase 3.5 Editor Pass with auto-director selection"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - rubric.md director-agnostic ✓ Task 1
   - 3 director profiles with scoring signals ✓ Task 2
   - collect-inputs.ts auto-scores + picks director ✓ Task 3
   - SKILL.md describes auto-pipeline ✓ Task 4
   - validate-proposal.ts uses director's role targets ✓ Task 5
   - Pipeline + skills table updated ✓ Task 6

2. **Placeholder scan:** No TODOs. All code blocks complete.

3. **Type consistency:** Director profile sections parsed identically in `collect-inputs.ts` and `validate-proposal.ts`. `Entry` type in validator matches the comment format the SKILL produces.

---

## Risk Notes

- **Depends on Plan B merge (DONE):** `collect-inputs.ts` parses the 4-column `.analysis.md` Plan B now produces.
- **Override respected but silent:** If user passes `--director <name>` that doesn't exist in `directors/`, the scoring winner is used with no warning. Acceptable for v1.
- **Scoring is keyword-based (not semantic):** For subtle content the auto-recommend may not match your intuition. Override with `--director` as needed. Future enhancement could use embeddings.
- **Human-in-the-loop at rename only:** Everything before `broll-manifest.proposed.ts` → `broll-manifest.ts` is automated. The rename is the single human gate.
