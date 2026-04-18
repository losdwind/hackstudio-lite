# HackStudio Pro

**AI-powered video production studio that turns research into broadcast-ready YouTube documentaries — in two languages, from a single codebase.**

Built on [Remotion](https://remotion.dev), React, and a constellation of AI services, HackStudio Pro is an end-to-end pipeline that takes you from raw source material to fully rendered, captioned, narrated video — without touching a traditional video editor.

https://github.com/user-attachments/assets/placeholder

## Why This Exists

Making one high-quality documentary video takes most creators weeks. Making it in two languages doubles the work. Scaling to 100+ videos? Impossible by hand.

HackStudio Pro collapses that timeline by treating video production as **a software problem**:

- **Scripts are TypeScript data** — not timelines in Premiere
- **Timing is computed from audio** — not dragged on a scrubber
- **Animations are React components** — version-controlled, composable, reusable
- **Bilingual output is a prop change** — `lang="cn"` or `lang="en"`, same pipeline

One `bun run dev` and you're previewing. One `remotion render` and you have an `.mp4`.

## The Pipeline

Nine phases. Three of them — Concept, Editor Pass, Validation — exist because we learned the hard way that render time is too expensive to waste on avoidable mistakes.

```
  Concept   Research   Script   B-Roll   Editor Pass   TTS    Build   Validate   Render
 ┌───────┐ ┌───────┐ ┌──────┐ ┌───────┐ ┌──────────┐ ┌─────┐ ┌─────┐ ┌────────┐ ┌───────┐
 │ Story │ │ 17+   │ │ TS   │ │ yt-dlp│ │ Auto-    │ │ T2A │ │React│ │ 5-check│ │h264   │
 │ angle │→│ plat- │→│ data │→│ +     │→│ director │→│ v2  │→│ kind│→│ harness│→│CN+EN  │
 │ gap   │ │ forms │ │ +    │ │ vision│ │ +        │ │ word│ │dis- │ │ pre-   │ │mp4    │
 │ found │ │ CN/EN │ │ chart│ │ AI    │ │ role tag │ │level│ │patch│ │ render │ │       │
 └───────┘ └───────┘ └──────┘ └───────┘ └──────────┘ └─────┘ └─────┘ └────────┘ └───────┘
   1.5         1         2        3         3.5        4       5        5.5        6
  Human       AI        AI       AI         AI         AI     Code     Code       Code
```

### Phase 1.5 — Concept (before research)

Every video starts with an editorial angle. Not "Xiaomi SU7 launch" — but **what's the gap between how Chinese and Western audiences see it**. `video-concept.md` pins down story spine, tone, and Part structure *before* any researcher runs. The hard-won lesson: research without a thesis produces a pile of facts, not a film.

### Phase 1 — Research

AI agents scour 17+ platforms — YouTube, Reddit, Bilibili, WeChat, Xueqiu, Twitter/X, XiaoHongShu, Weibo, and more — gathering sources across both Chinese and English ecosystems. Every claim gets **bilingual triangulation**: 3+ independent sources spanning both languages. Primary sources (interviews, filings, official posts) always come first. The dossier lands in `research/<slug>/` as `transcript.md`, `facts.md`, `perspectives.md`, `visuals.md`.

### Phase 2 — Script

Research becomes structured TypeScript — `content-cn.ts` and `content-en.ts` with narration lines, section titles, and chart labels. Data for visualizations lives in `chart-data.ts` with source citations. Narration must sound **spoken, not written**: short sentences, no em dashes or semicolons, contractions welcome.

### Phase 3 — B-Roll Sourcing

Videos downloaded from official channels only (never generic stock), then analyzed frame-by-frame with **Gemini 3.1 Flash Lite** via OpenRouter — a recent default swap that made analysis faster, cheaper, and dramatically better at Chinese OCR. Each clip gets an `.analysis.md` saved *beside* the `.mp4` with visual description + OCR + entity inference (pass `--context` for identity-aware output). A manifest enforces zero time-range overlap across the entire video.

### Phase 3.5 — Editor Pass (auto-director)

```bash
/video-editor --video xiaomi-su7
# or override: /video-editor --video xiaomi-su7 --director curtis
```

The `video-editor` skill **scores the script** and auto-selects a documentary director persona — Adam Curtis (systems/irony), Errol Morris (human portraiture), or Alex Gibney (institutional accountability). It emits `broll-manifest.proposed.ts` with **role tags** (anchor / texture / counterpoint / transition) and director-voiced rationale per clip. Human review, rename to `broll-manifest.ts`, proceed. This step makes B-roll feel edited, not assembled.

### Phase 4 — TTS Generation

```bash
bun run scripts/generate-tts.ts --video xiaomi-su7
```

MiniMax T2A v2 (`speech-2.8-hd`) generates voiceover with `voice_modify: { intensity: 40, pitch: 15, timbre: 10 }` for passionate delivery. Output includes **word-level timestamps** — not sentence-level — so every subtitle highlights in perfect sync with the spoken audio.

### Phase 5 — Build (Sequence Kinds)

Each narration line maps to a `SequenceEntry` with one of five **kinds**:

| Kind | Background | Use Case |
|------|-----------|----------|
| `video` | Moving B-roll via `VideoBackground` | Standard narration segments |
| `chart` | Calm `StaticBackground` | Data visualizations, diagrams, maps |
| `title` | Calm `StaticBackground` | Part titles tied to a narration line (never silent) |
| `quote` | Calm `StaticBackground` | Pull quotes, key claims |
| `ending` | Moving B-roll via `VideoBackground` | Final beat with CTA |

`PartRenderer` is a dispatcher that routes each entry to a focused renderer — `VideoSequence`, `ChartSequence`, `TitleSequence`, `QuoteSequence`, `EndingSequence` — living in `src/shared/components/renderers/`. The timeline is **audio-driven**: durations computed from TTS output, never hardcoded. Animations use `useTimeScale()` so keyframes scale proportionally to actual sequence length.

### Phase 5.5 — Validation Harness (pre-render QA)

```bash
bun run scripts/validate-video.ts --video xiaomi-su7
```

Five checks that must pass before the expensive render step. Each exits with 🔴 fatal (hard block) or ⚠️ informational (reviewable):

| Check | What it catches |
|-------|-----------------|
| `counts-consistency` | sequences, content, and alignment manifests disagree on line count |
| `tts-integrity` | audio truncation, tail silence exceeding 0.08 amplitude (200ms window) |
| `breathing-time` | chart < 4s, title < 2.5s, quote < 3.5s — text reads as rushed |
| `broll-overlap` | two sequences share an overlapping time range from the same source file |
| `text-density` | B-roll clip start-frame lands past 67% of text — caption never gets to breathe |

### Phase 6 — Render

```bash
bunx remotion render XiaomiSU7-CN --codec=h264   # Chinese version
bunx remotion render XiaomiSU7-EN --codec=h264   # English version
# For Mapbox maps: add --gl=angle --concurrency=1
```

## Architecture

Every video is self-contained. Shared rendering infrastructure is reused across all videos.

```
src/
├── shared/                 # Reusable across ALL videos
│   ├── components/         # PartRenderer, SubtitleOverlay, VideoBackground...
│   ├── lib/                # colors, fonts, timing, audio-driven duration math
│   └── schemas/            # VideoSchema (lang: "cn" | "en")
└── videos/
    └── xiaomi-su7/         # One folder per video
        ├── index.tsx       # Composition registry
        ├── components/     # Part orchestrators + animated overlays
        └── data/           # Scripts, B-roll manifest, audio alignment, chart data

public/<slug>/              # Assets namespaced per video
    ├── audio/{cn,en}/      # TTS .mp3 files
    └── videos/             # B-roll .mp4 files
```

Adding a new video = new folder + data files + one import in `Root.tsx`. The shared components handle the rest.

## Key Technical Decisions

| Decision | Why |
|----------|-----|
| **Sequence `kind` discriminated union** | A Part is no longer "video with chart overlays" — it's a sequence of typed entries. `chart` / `title` / `quote` use a calm `StaticBackground` instead of fighting moving B-roll for attention |
| **No silent title cards** | Part titles are their own `kind: "title"` sequence tied to a narration line — audio never drops out |
| **Auto-director for B-roll** | The `video-editor` skill scores the script and picks Curtis / Morris / Gibney. B-roll becomes edited, not assembled |
| **Pre-render validation harness** | Render time is expensive. 5 static checks (counts / TTS / breathing / overlap / density) catch issues that would otherwise waste a 20-min render |
| **One audio file per part** (not per line) | Natural prosody — MiniMax produces better speech when it sees the full paragraph context |
| **Word-level timestamps** from MiniMax | Subtitle highlighting syncs to actual speech, not estimated timing |
| **Audio-driven timeline** | Sequence durations are *computed* from TTS output — change the script and timing updates automatically |
| **`useTimeScale()` for animations** | Keyframes scale proportionally to actual sequence duration — never hardcoded frame numbers |
| **TypeScript data, not JSON** | Type safety, imports, and IDE autocomplete for all content and manifests |
| **Gemini 3.1 Flash Lite for vision** | Fast, cheap, excellent Chinese OCR — swapped in after testing 5 alternatives |

## Design System — "Precision Editorial"

A cinematic visual language inspired by modern data journalism:

- **No borders** — depth through tonal layering and ambient glows
- **Glassmorphism** — frosted-glass cards with `backdrop-blur` over B-roll
- **Gradient accents** — `#FFB595` to `#FF6700` for CTAs and data highlights
- **Typography hierarchy** — Plus Jakarta Sans (headlines) + Inter (body) + Noto Sans SC (CJK)

## Stack

| Layer | Technology |
|-------|-----------|
| Video engine | Remotion 4.0 |
| UI | React 19, TailwindCSS v4 |
| Language | TypeScript (strict) |
| TTS | MiniMax T2A v2 (speech-2.8-hd) |
| Transcription | OpenAI Whisper |
| Video analysis | Gemini 3.1 Flash Lite via OpenRouter |
| Editor persona | `video-editor` skill (Curtis / Morris / Gibney) |
| Pre-render QA | 5-check validation harness |
| Research | AI agents across 17+ platforms |
| Runtime | Bun |

## Quick Start

```bash
# 1. Install Git LFS (one-time, system-wide) — required before cloning
#    macOS:  brew install git-lfs
#    Ubuntu: sudo apt install git-lfs
git lfs install

# 2. Clone + fetch media binaries
git clone git@github.com:losdwind/hackstudio-lite.git
cd hackstudio-lite
git lfs pull              # materializes .mp3 / .mp4 LFS pointers into real files

# 3. Install JS dependencies
bun install

# 4. Preview in Remotion Studio
bun run dev

# 5. Generate TTS for a video
bun run scripts/generate-tts.ts --video xiaomi-su7

# 6. Run the Editor Pass (auto-director B-roll tagging)
#    /video-editor --video xiaomi-su7
#    Then review .proposed.ts and rename to broll-manifest.ts

# 7. Validate everything before render (5-check harness)
bun run scripts/validate-video.ts --video xiaomi-su7

# 8. Render final video
bunx remotion render XiaomiSU7-CN --codec=h264
bunx remotion render XiaomiSU7-EN --codec=h264
```

### Git LFS is mandatory

All B-roll videos (`public/<slug>/videos/*.mp4`) and TTS audio (`public/<slug>/audio/**/*.mp3`) are stored via [Git LFS](https://git-lfs.com). If you clone without LFS installed — or with `GIT_LFS_SKIP_SMUDGE=1` set — the working tree will contain 130-byte pointer text files instead of the actual media, and Remotion will fail at playback with:

```
DEMUXER_ERROR_COULD_NOT_OPEN: FFmpegDemuxer: open context failed
```

**Diagnosis:** `ls -la public/<slug>/videos/*.mp4` — if files are ~130 bytes, they are pointers.
**Fix:** `git lfs install && git lfs pull`.

## License

UNLICENSED — Private project.
