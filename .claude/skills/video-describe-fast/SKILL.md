---
name: video-describe-fast
description: |
  Fast video description via OpenRouter API. Extracts frames with ffmpeg, sends them
  in parallel to a vision model, returns markdown with visual + OCR text + identified
  entities per frame, plus a context-aware summary.
  ~72s for a 5-min video. No GPU server needed.
  Triggers: "describe video", "video describe", "analyze video", "/video-describe-fast"
---

# Video Describe (Fast — OpenRouter)

Analyze a video by extracting frames and describing each via OpenRouter's vision API.
Processes a 5-minute video in ~72 seconds with 10 parallel workers.

## Prerequisites

- `OPENROUTER_API_KEY` must be set (or pass via env)
- `ffmpeg` installed locally
- Python 3.9+

## Execution Steps

### Step 1: Parse user input

Extract from the user's message:
- **video_path**: Path to the video file (required). Resolve relative paths from cwd.
- **interval**: Seconds between frame captures (default: `2`).
- **output_path**: Where to save the markdown (optional — default: print to stdout).
- **context**: Optional video context ("Lei Jun's SU7 launch event") — injected into prompts so the model can identify people, brands, and products by name instead of generic descriptions like "a middle-aged man".

### Step 2: Run the script

```bash
python3 .claude/skills/video-describe-fast/describe.py \
  "{VIDEO_PATH}" \
  --interval {INTERVAL} \
  --context "{CONTEXT}" \
  --workers 10 \
  --output "{OUTPUT_PATH}"
```

If `OPENROUTER_API_KEY` is not in the environment, prefix the command:
```bash
OPENROUTER_API_KEY="sk-or-..." python3 .claude/skills/video-describe-fast/describe.py ...
```

### Step 3: Output the result

- If `--output` was given, confirm the file was saved and show its path.
- Otherwise, display the markdown directly to the user.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter API key (`sk-or-...`) |
| `VISION_MODEL` | No | `meta-llama/llama-4-scout-17b-16e-instruct` | Vision model to use |
| `VISION_API_URL` | No | `https://openrouter.ai/api/v1/chat/completions` | API endpoint |
| `VISION_MAX_WORKERS` | No | `10` | Parallel request count |

## Changing the model

The default model is `meta-llama/llama-4-scout-17b-16e-instruct` (clean JSON output, handles OCR well in Chinese + English). Override via env var or `--model` flag:

```bash
# Fall back to Qwen 3.5 9B (cheaper but produces shallower OCR and can leak chain-of-thought)
VISION_MODEL="qwen/qwen3.5-9b" python3 .claude/skills/video-describe-fast/describe.py video.mp4
```

## Performance

| Video Length | Interval | Frames | Time | Workers |
|-------------|----------|--------|------|---------|
| 1:46 | 2s | 53 | ~45s | 10 |
| 5:00 | 4s | 75 | ~72s | 10 |
| 5:00 | 2s | 150 | ~90s | 10 |

## Example Usage

```
/video-describe-fast public/videos/my-video.mp4
/video-describe-fast ./clip.mp4 interval=4
/video-describe-fast ./demo.mp4 output=analysis.md
/video-describe-fast public/videos/leijun-stage.mp4 context="Lei Jun SU7 launch, March 2024"
```
