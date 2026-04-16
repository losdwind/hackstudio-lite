# hackstudio-pro

Remotion video production studio — bilingual (CN/EN) YouTube documentaries with TTS voiceover, animated data visualizations, B-roll video backgrounds, and synced captions. Designed to produce 100+ videos at scale.

## Channel Identity

This channel decodes global industries from a China perspective. Not just what is happening — but why China makes different decisions. From EVs and AI to geopolitics and tech competition, we explore how China and the US approach the same problems — and why the answers are often completely different.

## Stack
- Remotion 4.0.448, React 19, TailwindCSS v4, TypeScript
- TTS: MiniMax T2A v2 (speech-2.8-hd) with word-level subtitle timestamps
- Transcription: OpenAI Whisper (split long audio into ~15-min chunks, language=zh)
- Video analysis: video-describe-fast skill (OpenRouter API)
- Design system: `design.md` — "Precision Editorial" rules (no borders, glassmorphism, gradient accents)

## Research Rules (THE most important phase)

Research quality determines video quality. A documentary that "decodes industries from a China perspective" is only as good as the depth and breadth of its sources. These three rules are non-negotiable.

### Rule 1: Bilingual Triangulation — every claim needs 3+ sources across both languages

Never trust a single source. For every key claim, data point, or narrative angle, find **at least 3 independent sources** — and they MUST span **both Chinese and English ecosystems**. Chinese-only sources miss how the world perceives China; English-only sources miss what China actually thinks.

**How to execute:**
- **Chinese sources**: Use `agent-reach` — search Bilibili (video transcripts), WeChat Articles (deep industry analysis), Weibo (public sentiment), XiaoHongShu (consumer perspective), Xueqiu (financial/investor angle), Xiaoyuzhou (podcast transcripts via Whisper)
- **English sources**: Use `tavily-research` for deep multi-source reports with citations, `tavily-search` for quick fact-checks, `agent-reach` for Twitter/X threads, Reddit discussions, YouTube transcripts
- **Cross-reference**: If a Chinese source claims "X happened", find the English reporting on it (and vice versa). The gap between the two narratives IS the story this channel tells.
- Save all sources with URLs to `research/<slug>/` — never throw away a source

### Rule 2: Primary Sources First — go upstream before you go wide

Secondary reporting (news articles, blog posts) is someone else's interpretation. For this channel, always chase the **primary source** before citing secondary coverage:

- **Speeches & interviews**: Transcribe the original audio/video with Whisper, don't rely on a journalist's summary. The Lei Jun interview transcript is a primary source — a TechCrunch article about it is secondary.
- **Financial data**: Pull from Xueqiu, company filings, government statistics — not from a blogger's chart.
- **Official channels**: Use `agent-reach` to read the actual Weibo post, WeChat article, or Bilibili video — not someone's tweet about it.
- **Technical claims**: When the script says "SU7 has 673hp", find the official spec sheet, not a review that might have rounded the number.

**The hierarchy**: Official document > Direct interview/speech transcript > Government/industry data > Quality journalism (Reuters, CNBC, 财新) > General reporting > Social media commentary.

### Rule 3: Build a Research Dossier Before Writing a Single Word

Do NOT start scriptwriting until the research folder is rich enough. Each video should have a `research/<slug>/` folder containing:

- **`transcript.md`** — Full transcript of primary source material (interviews, podcasts, speeches)
- **`facts.md`** — Every data point that will appear in the video, with its source URL and verification status. Format: `| Claim | Value | Source | Verified? |`
- **`perspectives.md`** — The Chinese narrative vs. the English narrative on the topic. What does each side emphasize? What does each side miss? This gap is the editorial angle.
- **`visuals.md`** — What B-roll, charts, and diagrams are needed, and what data they require

**The test**: Before moving to Phase 2 (Script), ask: "Could someone else write this script from my research folder alone?" If no — the research is incomplete.

### Available Research Skills (use them aggressively)

| Skill | What it does | When to use |
|-------|-------------|-------------|
| `agent-reach` | Search/read 17 platforms (X, Bilibili, Weibo, WeChat, XHS, Xueqiu, YouTube...) | Every video — bilingual source gathering |
| `tavily-research` | Deep AI-powered research with citations | Comprehensive topic reports |
| `tavily-search` | Quick web search | Fact-checking individual claims |
| `tavily-extract` | Extract content from specific URLs | Reading full articles |
| `tavily-crawl` | Crawl entire sites | Gathering all articles from a source |
| `video-describe-fast` | Frame-by-frame video analysis | Analyzing B-roll and source videos |
| `media-downloader` | Search and download images/video clips | Finding visual assets |
| `notebooklm` | Query uploaded documents via Gemini | Querying compiled research |
| `web-access` | Full browser automation | Sites that block API access |
| `fetch-social-profiles` | Download avatars + metadata from X, GitHub, YouTube | People featured in the video |
| OpenAI Whisper | Audio transcription (split >25MB into 15-min chunks) | Transcribing interviews, podcasts |

---

## End-to-End Production Pipeline

Each video follows this pipeline. A session may cover one or several phases.

```
Phase 1: Research (see Research Rules above)
  Source material (podcasts, interviews, articles)
  → Transcribe audio (OpenAI Whisper, split >25MB files into 15-min chunks)
  → Bilingual triangulation across Chinese + English platforms
  → Build research dossier: transcript.md, facts.md, perspectives.md, visuals.md
  → Save everything to research/<slug>/

Phase 2: Script
  Transcript + research → Write bilingual video script
  → Structure into 4 Parts (sections), 5-6 narration lines each
  → Create content-cn.ts / content-en.ts with all text
  → Create chart-data.ts with verified data for visualizations

Phase 3: B-Roll Sourcing
  → Browse official YouTube/Bilibili channels (NEVER generic search)
  → Download with yt-dlp, analyze with video-describe-fast
  → Create broll-manifest.ts — zero repetition, no text frames
  → Place videos in public/<slug>/videos/

Phase 4: TTS Generation
  → Run: bun run scripts/generate-tts.ts
  → Generates per-part audio + word-level alignment timestamps
  → Creates alignment-manifest.ts + audio files in public/<slug>/audio/
  → Audio-driven timeline: all sequence durations computed from audio lengths

Phase 5: Build Remotion Components
  → Animation overlays (charts, diagrams, maps) in components/part{1-4}/
  → Part orchestrators pass data to shared PartRenderer
  → MasterComposition assembles parts with TransitionSeries
  → Register in index.tsx, add to Root.tsx

Phase 6: Preview & Render
  → bun run dev (Remotion Studio, press Play for audio)
  → bunx remotion render <CompositionId>-CN --codec=h264
  → bunx remotion render <CompositionId>-EN --codec=h264
```

## Project Structure (Multi-Video)

Each video is self-contained under its own folder. Shared rendering infrastructure lives in `src/shared/`.

```
src/
├── Root.tsx              # Thin registry — imports each video's index.tsx
├── index.ts              # Remotion registerRoot
├── index.css             # TailwindCSS
├── shared/               # Reusable across ALL videos
│   ├── components/       # PartRenderer, SubtitleOverlay, VideoBackground, etc.
│   ├── lib/              # colors, fonts, timing, compute-durations, part-audio, alignment-types
│   └── schemas/          # VideoSchema (lang: "cn" | "en")
└── videos/
    └── <slug>/           # One folder per video (e.g. xiaomi-su7)
        ├── index.tsx     # Exports <Folder> of Compositions for this video
        ├── components/   # MasterComposition + part1-4/ with Part + animation overlays
        └── data/         # content-cn/en, broll-manifest, audio/alignment manifests, chart-data

public/
└── <slug>/               # Assets namespaced per video
    ├── audio/{cn,en}/    # TTS .mp3 files
    └── videos/           # B-roll .mp4 files

research/                 # Transcripts, research notes, video analysis (per-video)
scripts/                  # generate-tts.ts, validate-broll.ts
```

### Adding a New Video

1. Create dirs: `mkdir -p src/videos/<slug>/{components/part{1,2,3,4},data}` and `mkdir -p public/<slug>/{audio/{cn,en},videos}`
2. Create data files in `src/videos/<slug>/data/`:
   - `content-cn.ts` / `content-en.ts` — narration text, titles, chart labels
   - `broll-manifest.ts` — B-roll assignments (paths: `<slug>/videos/...`)
   - `audio-manifest.ts` — per-line TTS durations (paths: `<slug>/audio/...`)
   - `alignment-manifest.ts` — MiniMax word-level timing (paths: `<slug>/audio/...`)
   - `chart-data.ts` — data for animated visualizations
3. Create Part components — each imports shared `PartRenderer` + its own data, passes as props
4. Create `MasterComposition.tsx` — assembles parts with TransitionSeries
5. Create `index.tsx` — exports function returning `<Folder>` with all Compositions
6. Add one line to `Root.tsx`: `{myVideoCompositions()}`

### Key Conventions
- **Shared modules are parameterized** — `PartRenderer`, `computePartFrames`, `getPartAudio` accept data as arguments. Never add video-specific imports to `src/shared/`.
- **Asset paths include the slug** — `staticFile("<slug>/videos/...")`, not `staticFile("videos/...")`.
- **Type interfaces live in shared** — `WordTiming`, `LineTiming`, `PartAlignment` in `src/shared/lib/alignment-types.ts`.
- **Each video's index.tsx is the composition registry** — defines all `<Composition>` entries wrapped in a `<Folder>`.
- **Audio-driven timeline** — sequence durations derived from TTS audio lengths, never hardcoded.
- **Every sequence gets narration** — including over animation segments. No silent segments.

## Production Rules (Quick Reference)

Full details in `.claude/skills/ai-video-from-script/SKILL.md`.

- **B-roll**: Official channels only, analyze with video-describe-fast, zero clip repetition, no text frames as backgrounds
- **Captions**: Inside each Sequence (not global), word-by-word highlighting synced to audio
- **TTS**: One audio file per part (not per line) for natural prosody, word-level timestamps for captions
- **Transcription**: For audio >25MB, split into ~15-min mp3 chunks (mono 16kHz) with ffmpeg, transcribe each via OpenAI Whisper (language=zh), combine with timestamps
- **Design**: No solid borders, glassmorphism on cards, gradient accents, ambient glows, Plus Jakarta Sans headlines + Inter body + Noto Sans SC for CJK
