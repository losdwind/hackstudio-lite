# Index: Production Quality Upgrade (4 Subsystems)

> This is an **index**, not an executable plan. It links the 4 independent plans and specifies the execution order.

**Context:** After the xiaomi-su7 production run, four gaps were identified in our video pipeline:

1. `video-describe-fast` produces generic visual descriptions ("a middle-aged man") without extracting on-screen text or identifying people — making the `.analysis.md` files weak input for any downstream consumer.
2. No "editor" role exists — B-roll is matched by keyword/subject literally, missing emotional register, implication, and editorial contrast.
3. No harness validates the assembled video before render — TTS truncations, insufficient breathing time on charts, and text-heavy B-roll backgrounds slip through.
4. `PartRenderer` assumes every sequence has a video background, causing charts to fight a moving video for the viewer's attention.

## Execution Order

```
   ┌──────────────────────────┐          ┌──────────────────────────┐
   │ Plan A: Sequence Kinds   │          │ Plan B: describe-fast    │
   │ (architectural refactor) │          │   OCR + context upgrade  │
   └──────────┬───────────────┘          └──────────┬───────────────┘
              │                                      │
              ▼                                      ▼
   ┌──────────────────────────┐          ┌──────────────────────────┐
   │ Plan D: validate-video   │          │ Plan C: video-editor     │
   │   QA harness             │          │   skill (emotion roles)  │
   └──────────────────────────┘          └──────────────────────────┘
```

**Two parallel tracks**, each with a dependency edge inside it:

- **Track 1 (architecture)**: A → D
- **Track 2 (content quality)**: B → C

The tracks are fully independent of each other — you can execute A and B concurrently (separate worktrees if desired).

## The 4 Plans

| # | Title | Dependency | Estimated scope |
|---|-------|------------|-----------------|
| A | [Sequence Kind Refactor](./2026-04-18-A-sequence-kind-refactor.md) | — | 11 tasks, 5 new files + refactor of PartRenderer + migrate 5 Parts |
| B | [describe-fast OCR + context](./2026-04-18-B-describe-fast-context-aware.md) | — | 6 tasks, modifies 1 python script + docs |
| C | [video-editor skill](./2026-04-18-C-video-editor-skill.md) | B merged | 5 tasks, 4 new files (skill + 2 TS helpers + rubric) |
| D | [validate-video QA harness](./2026-04-18-D-validate-video-harness.md) | A merged (partial fallback) | 6 tasks, 5 new scripts (orchestrator + 4 validators) |

## Recommended Execution Mode

Per `superpowers:subagent-driven-development`: dispatch one subagent per task within a plan, review between tasks. Each plan's tasks are TDD-ordered and commit-per-task.

If running all 4 plans serially in one session:
1. **Start with A** (foundation for D) and **B** (independent, quick win) in parallel
2. **Then C** (needs B) and **D** (benefits from A)
3. After A, run Remotion Studio + render a preview to verify no visual regression
4. After D, run `bun run scripts/validate-video.ts --video xiaomi-su7` as the first end-to-end harness test

## What Each Plan Delivers

- **Plan A**: Charts render on calm gradient backgrounds. Titles, quotes become first-class sequence kinds. Video is one of five kinds, not the universal background.
- **Plan B**: Every `.analysis.md` has on-screen text + identified entities + context-aware summary. "A middle-aged man" becomes "Lei Jun introducing SU7".
- **Plan C**: A new `/video-editor` skill that designs emotion-aware B-roll layouts. Produces a `.proposed.ts` for human review, never auto-promotes.
- **Plan D**: One `bun run scripts/validate-video.ts --video <slug>` that gates Phase 5 → Phase 6 with 5 checks covering audio integrity, reading time, text density, overlap, and cross-file count consistency.

## Invariants Preserved Across All Plans

- The `broll-manifest.ts` schema (`{ file, startFrom }`) is unchanged. Plans A and C keep it intact.
- The `alignmentManifest` schema is unchanged. No TTS regeneration needed.
- No new runtime dependencies (no new npm/pip packages). Everything uses existing ffmpeg, ffprobe, Bun, Python stdlib, OpenRouter SDK-style HTTP.
- `design.md` compliance is preserved (Plan A's new `StaticBackground` uses `COLORS.surface` + radial gradient; no solid borders introduced).

## Deferred / Explicitly Out of Scope

- Re-rendering the xiaomi-su7 production with the new architecture. That's a separate operational task, not part of any plan.
- Migrating all existing `.analysis.md` files to Plan B's 4-column format. Regenerate lazily when the editor skill (Plan C) or validate-video (Plan D) needs them.
- Unit test framework setup. These plans use validation scripts + visual regression, not jest/vitest. Adding a test runner is a separate decision.
- Remotion Studio UI changes — the dispatcher refactor is invisible to users of Studio.
