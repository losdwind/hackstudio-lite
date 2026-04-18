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

```
   Research         Script          B-Roll          TTS            Build           Render
  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
  │ YouTube  │    │ Bilingual│    │ Official │    │ MiniMax │    │ React   │    │ Remotion │
  │ Bilibili │    │ CN + EN  │    │ channels │    │ T2A v2  │    │ comps + │    │ h264    │
  │ Reddit   │───>│ scripts  │───>│ analyzed │───>│ word-   │───>│ data-   │───>│ .mp4    │
  │ WeChat   │    │ as .ts   │    │ frame by │    │ level   │    │ driven  │    │ CN + EN │
  │ Xueqiu   │    │ data     │    │ frame    │    │ timing  │    │ timeline│    │         │
  │ Twitter  │    │          │    │          │    │         │    │         │    │         │
  │ Whisper  │    │          │    │          │    │         │    │         │    │         │
  │ +10 more │    │          │    │          │    │         │    │         │    │         │
  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
       AI              AI             AI             AI           Code            Code
```

### Phase 1 — Research

AI agents scour 17+ platforms — YouTube, Reddit, Bilibili, WeChat, Xueqiu, Twitter/X, XiaoHongShu, Weibo, and more — gathering sources across both Chinese and English ecosystems. Every claim gets bilingual triangulation: 3+ independent sources spanning both languages. Primary sources (interviews, filings, official posts) always come first.

### Phase 2 — Script

Research becomes structured TypeScript — `content-cn.ts` and `content-en.ts` with narration lines, section titles, and chart labels. Data for visualizations lives in `chart-data.ts` with source citations.

### Phase 3 — B-Roll Sourcing

Videos are downloaded from official channels only (never generic stock footage), then analyzed frame-by-frame with AI vision models. A manifest ensures zero clip repetition across the entire video.

### Phase 4 — TTS Generation

```bash
bun run scripts/generate-tts.ts --video xiaomi-su7
```

MiniMax T2A v2 generates natural-sounding voiceover with **word-level timestamps** — not sentence-level, *word-level*. Every subtitle highlights in perfect sync with the spoken audio.

### Phase 5 — Build

React components render animated data visualizations (charts, diagrams, maps, timelines) that play over B-roll backgrounds with glassmorphism captions. The entire timeline is **audio-driven** — sequence durations are computed from TTS output, never hardcoded.

### Phase 6 — Render

```bash
bunx remotion render XiaomiSU7-CN --codec=h264   # Chinese version
bunx remotion render XiaomiSU7-EN --codec=h264   # English version
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
| **One audio file per part** (not per line) | Natural prosody — MiniMax produces better speech when it sees the full paragraph context |
| **Word-level timestamps** from MiniMax | Subtitle highlighting syncs to actual speech, not estimated timing |
| **Audio-driven timeline** | Sequence durations are *computed* from TTS output — change the script and timing updates automatically |
| **TypeScript data, not JSON** | Type safety, imports, and IDE autocomplete for all content and manifests |
| **React components for animations** | Version-controlled, composable, testable — no After Effects project files |
| **B-roll validation script** | `bun run validate-broll` catches clip repetition, missing files, and time-range overlaps before render |

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
| Video analysis | OpenRouter vision models |
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

# 6. Validate B-roll assignments
bun run scripts/validate-broll.ts

# 7. Render final video
bunx remotion render XiaomiSU7-CN --codec=h264
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
