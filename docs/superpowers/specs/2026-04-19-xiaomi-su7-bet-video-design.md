# Xiaomi SU7 Bet — Video Concept

**Slug**: `xiaomi-su7-bet`
**Working EN title**: *He Said He'd Never Build a Car. Then He Bet $10 Billion On It.*
**Working CN title**: *雷军造车：一场"不得不赢"的豪赌 | 中国产业观察*
**Runtime target**: 7:00 – 7:30
**Parts**: 4 (not 5 — keeps scope tight for a first render)

## Editorial Angle

The tension this video decodes is a **narrative gap**, not a spec gap.

- **Western framing**: "Another phone company chasing cars. Just like Apple. Will fail."
- **Chinese reality**: 3,400+ engineers left Xiaomi's phone divisions to join the EV team. The entire Chinese supply chain — CATL batteries, BYD-adjacent assembly, Geely-trained chassis engineers — was actively pulling Lei Jun forward. This isn't a pivot. It's gravitational pull.

The **human spine** is Lei Jun's reluctance → forced conviction arc:
- 2013: Sat in a Tesla factory, publicly said he would "never build cars"
- 2021: Stood on a stage, called it his "final entrepreneurial project", staked his entire reputation on it
- 2024: Shipped SU7 in 3 years. Apple spent 10 years and killed theirs.

The **closer** isn't "China won". It's a mirror question: *Can America still produce a CEO willing to bet everything the way Lei Jun did?*

## 4-Part Structure

| Part | Title (CN/EN) | Tension | Sequences |
|------|--------------|---------|-----------|
| 1 | 犹豫 / Hesitation | The about-face. Why did he break his own promise? | title + 5 video + 1 quote = 7 |
| 2 | 引力 / The Gravitational Pull | Why Chinese talent moves to cars, not AI | title + 5 video + 1 chart = 7 |
| 3 | 豪赌 / The Bet | Porsche-tier specs at 1/3 the price | title + 4 video + 2 chart = 7 |
| 4 | 反照 / Reckoning | Two CEO archetypes. Which model still exists in the US? | title + 4 video + 1 chart + 1 ending = 7 |

Each part opens with a title sequence tied to its first narration line (never silent). Narration is spoken-style: short sentences, periods and commas only, no em dashes, no parentheses, TTS-friendly.

## Charts / Overlays

1. **EcosystemDiagram** (Part 2 line 4) — Phone ↔ Car ↔ Home ↔ HyperOS node graph. Establishes why an EV is an "entry point", not a product.
2. **PriceCompareChart** (Part 3 line 2) — SU7 ¥215,900 vs Taycan ¥898,000 bar visualization.
3. **SpecGrid** (Part 3 line 4) — Three hero stats (2.78s / 265 km/h / 800 km) in staggered scale layout.
4. **OrderCounter** (Part 4 line 1) — Animated counter rolling to 88,000 in 24 hours.
5. **QuoteCard** (Part 1 line 5) — Lei Jun's "stake my entire reputation" line pulled large, Plus Jakarta + Noto SC.

## B-Roll Sources (Official Channels Only)

- Xiaomi (@Xiaomi YouTube) — SU7 March 28 2024 launch event, factory tour
- CNBC International / Bloomberg — China EV market coverage, Lei Jun profiles
- Apple Newsroom / WWDC archive — Tim Cook footage
- CGTN / Reuters — Chinese EV streetscapes, charging infrastructure

All clips analyzed with `video-describe-fast --context "Xiaomi SU7 launch / Lei Jun / China EV industry"` before allocation. Zero time overlap across entire video.

## Voice & Tone

- Cold-detached documentary narrator (Asianometry-adjacent), with room for emotional peaks on Lei Jun's quote line and the closing mirror question.
- MiniMax `speech-2.8-hd` with `voice_modify: intensity 15, pitch 5, timbre 5` (reserved, not flatlined).
- Pauses: 0.4s after mid-line sentence punctuation; 0.7s between lines (MiniMax `<#0.4#>` / `<#0.7#>` markers injected by `scripts/generate-tts.ts`).

## Success Criteria

- Validator passes cleanly (`bun run scripts/validate-video.ts --video xiaomi-su7-bet`) — counts, TTS integrity, breathing time, zero B-roll overlap, text density.
- CN + EN renders produce watchable MP4s at 1080p h264.
- Design audit: no solid borders, no pure black shadows, no hardcoded hex outside `colors.ts`.
