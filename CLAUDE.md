# hackstudio-pro

Remotion video production project — bilingual (CN/EN) YouTube documentaries with TTS voiceover, animated data visualizations, B-roll video backgrounds, and synced captions.

## Stack
- Remotion 4.0.448, React 19, TailwindCSS v4, TypeScript
- TTS: edge-tts (CN: zh-CN-YunyangNeural, EN: en-US-ChristopherNeural)
- Video analysis: video-describe-fast skill (OpenRouter API)

## Key Architecture
- Audio-driven timeline — sequence durations derived from TTS audio lengths, not hardcoded
- Each `<Sequence>` stacks: VideoBackground → Animation → NarrationAudio → SubtitleOverlay
- Bilingual switching via Zod schema `lang: "cn" | "en"` prop
- Design system in `design.md` — follow the "Precision Editorial" rules (no borders, glassmorphism, gradient accents)

## Video Production Rules
See `.claude/skills/ai-video-from-script/SKILL.md` for the full workflow and hard-won rules:
- B-roll: official channels only, analyze with video-describe-fast before assigning, zero clip repetition, no text frames
- Captions: inside each Sequence (not global), word-by-word highlighting synced to audio
- Voice: every sequence gets narration, including over animation segments
