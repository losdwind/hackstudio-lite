---
name: ai-video-from-script
description: End-to-end workflow for generating a YouTube-quality video from a text script using Remotion, TTS, B-roll, and animated data visualizations. Invoke when user provides a script and wants a video produced.
---

# AI Video from Script — Production Workflow

Generate a complete YouTube video from a text script using Remotion (React), edge-tts voiceover, B-roll video backgrounds, animated data visualizations, and word-synced captions.

## Learnings & Hard-Won Preferences

These rules were discovered through iteration. Violating them produces bad output.

### B-Roll Video Sourcing

1. **NEVER use generic YouTube search** (`ytsearch:keyword`) — it returns clickbait, fan re-uploads, and low-quality commentary. Always go to **official channels directly**:
   - Browse the subject's official YouTube channel (`@ChannelName/videos`)
   - Search Bilibili for Chinese content (`bilisearch:keyword`)
   - Target major news outlets: CNBC, BBC, Bloomberg, Reuters
   - Prefer channels with 100K+ subscribers

2. **Analyze every clip before using it** — Use `video-describe-fast` skill to get frame-by-frame content maps. Never assign clips to sequences based on titles alone.

3. **ZERO repetition rule** — Each second of source footage appears AT MOST ONCE in the final video. Track allocations: `clip[startFrame-endFrame]` per sequence. No viewer should see the same footage twice.

4. **No text frames as B-roll** — Title cards, infographic screens, text overlays, and logo screens make terrible backgrounds because they clash with the video's own charts, captions, and animations. Only use frames showing **real visual content** (people, cars, buildings, streets, factories).

5. **Slow playback for cinematic feel** — B-roll plays at `playbackRate: 0.6` (slowed to 60%) with a dark overlay (`overlayOpacity: 0.7-0.85`) + vignette for text readability.

### TTS Voice Generation

1. **Use edge-tts** (free, no API key, neural quality):
   - Chinese: `zh-CN-YunyangNeural` (male, professional news) or `zh-CN-XiaoxiaoNeural` (female)
   - English: `en-US-ChristopherNeural` (male, authoritative) or `en-US-AndrewNeural` (male, warm)
   - Rate: `-5%` for documentary narration pacing

2. **Generate one audio file per narration line** — not per paragraph, not per section. Each line = one file = one Sequence in Remotion.

3. **Measure actual durations with ffprobe** after generation — store in an `audio-manifest.ts` with exact seconds. Never hardcode frame counts.

4. **Rate limiting** — edge-tts can fail with `NoAudioReceived` on rapid sequential calls. Add 1s delay between calls or retry failed files separately.

### Caption / Subtitle System

1. **Captions go INSIDE each Sequence**, not as a global overlay — this ensures local frame sync with the audio playing in that same Sequence.

2. **Word-by-word highlighting** — split text into tokens (words for English, ~4-char groups for Chinese), evenly distribute across `audioDuration`, highlight the current token in `primaryContainer` color.

3. **Bottom-positioned** with glassmorphic pill background (`backdrop-blur: 12px`, 75% dark surface).

4. **Every sequence must have voice + captions** — including animation sequences. The narrator describes what the viewer sees while the chart/diagram animates. Silent segments break engagement.

### Remotion Architecture

1. **Audio-driven timeline** — Sequence durations are computed from `Math.ceil(audioDuration * fps) + padding`. Never hardcode frame counts. Use a `compute-durations.ts` helper that sums all sequences per part.

2. **Composition hierarchy** (3 levels for development efficiency):
   - Individual animation compositions (fastest preview)
   - Section compositions (Part1-Part4)
   - Master composition with TransitionSeries

3. **Bilingual via Zod schema** — Single `lang: "cn" | "en"` prop switches all text, audio, and captions. Content lives in separate `content-cn.ts` / `content-en.ts` data files.

4. **Each Sequence stacks 4 layers**:
   ```
   <Sequence>
     <VideoBackground />    ← Muted B-roll, slowed, looping
     <AnimationComponent />  ← Chart/diagram/visual (if applicable)
     <NarrationAudio />      ← TTS voice file
     <SubtitleOverlay />     ← Word-highlighted captions
   </Sequence>
   ```

5. **Design system compliance** — Apply design.md rules: no solid borders (ghost borders only), glassmorphism on cards, gradient accents, ambient glows instead of drop shadows, Plus Jakarta Sans for headlines + Inter for body.

### Research & Fact Verification

1. **Always verify script numbers** before encoding them in charts — the original script may have wrong data. Use web search to find authoritative sources.

2. **Save research to `research/` folder** with markdown files per section — these become reference material for future edits.

---

## Step-by-Step Execution Order

### Phase 0: Parse Script
- Break the script into Parts (sections) and numbered narration lines
- Identify which lines need data visualizations (charts, diagrams, maps)
- Create `content-cn.ts` and `content-en.ts` with all text

### Phase 1: Research & Verify Data
- Search for and verify all numbers, dates, and claims in the script
- Save verified data to `research/` folder
- Create `chart-data.ts` with corrected numbers

### Phase 2: Project Setup
```bash
bunx remotion add @remotion/transitions @remotion/google-fonts @remotion/media @remotion/captions @remotion/light-leaks
```

### Phase 3: Foundation Layer
- `lib/colors.ts` — Design tokens from design.md
- `lib/fonts.ts` — Display font (Plus Jakarta Sans) + body font (Inter) + CJK (Noto Sans SC)
- `lib/timing.ts` — Spring configs, stagger delays
- `schemas/video-schema.ts` — Zod schema with `lang` prop

### Phase 4: Build Animation Components
- One component per visualization (bar chart, timeline, flow diagram, etc.)
- All animations use `useCurrentFrame()` + `spring()` / `interpolate()` — NO CSS transitions
- Register each as a standalone Composition for isolated preview

### Phase 5: Generate TTS Audio
```bash
python3 scripts/generate-tts.py  # Generates all audio files
```
- Measure durations with ffprobe
- Create `audio-manifest.ts` with paths + durations
- Create `compute-durations.ts` for audio-driven frame computation

### Phase 6: Source B-Roll Video
1. Identify needed visual themes per sequence
2. Browse official channels directly (NOT generic search)
3. Download with `yt-dlp -f "bestvideo[height<=1080]+bestaudio"` 
4. Analyze with `video-describe-fast` skill
5. Create `broll-manifest.ts` mapping sequences to non-overlapping clip segments
6. Verify: no text frames, no repetition, content matches narration

### Phase 7: Assemble Compositions
- Build Part1-Part4 orchestrators — each Sequence has VideoBackground + NarrationAudio + SubtitleOverlay + optional animation
- Build MasterComposition with TransitionSeries + fade transitions
- Register all in Root.tsx

### Phase 8: Preview & Render
```bash
bun run dev                                          # Preview in Remotion Studio (press Play for audio)
bunx remotion render XiaomiSU7-CN --codec=h264       # Render Chinese version
bunx remotion render XiaomiSU7-EN --codec=h264       # Render English version
```

---

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Captions out of sync | Put SubtitleOverlay INSIDE each Sequence, not globally |
| Silent animation segments | Add narration to EVERY sequence, including over charts |
| B-roll repetition | Track allocations, each clip segment used once |
| Text frames as background | Analyze clips frame-by-frame, skip title cards / infographics |
| Wrong data in charts | Verify with web search before encoding |
| Hardcoded frame durations | Derive from audio manifest durations |
| WebGL map crash in preview | Use SVG-based maps instead of Mapbox |
| edge-tts rate limit | Add delays between calls, retry failures separately |
| Generic YouTube search | Go to official channels directly |
