#!/usr/bin/env python3
"""
Fast video description using Groq API vision models.
Extracts frames with ffmpeg, sends all frames in parallel to Groq, outputs markdown.

Usage:
    python3 describe.py video.mp4 [--interval 2] [--output result.md]
    API_KEY=gsk_... python3 describe.py video.mp4
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from base64 import b64encode
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

API_KEY = os.getenv("API_KEY", "") or os.getenv("OPENROUTER_API_KEY", "")
API_URL = os.getenv("VISION_API_URL", "https://openrouter.ai/api/v1/chat/completions")
MODEL = os.getenv("VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
MAX_WORKERS = int(os.getenv("VISION_MAX_WORKERS", "10"))


def extract_frames(video_path: str, interval: float, tmpdir: str) -> list[dict]:
    out_pattern = os.path.join(tmpdir, "frame_%04d.jpg")
    subprocess.run(
        ["ffmpeg", "-y", "-i", video_path,
         "-vf", f"fps=1/{interval}", "-q:v", "5", out_pattern],
        capture_output=True, check=True,
    )
    frames = sorted(Path(tmpdir).glob("frame_*.jpg"))
    return [
        {"index": i, "timestamp": i * interval, "path": str(f)}
        for i, f in enumerate(frames, start=1)
    ]


def get_duration(video_path: str) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", video_path],
        capture_output=True, text=True,
    )
    return float(r.stdout.strip())


def _strip_json_fence(s: str) -> str:
    """Strip optional ```json ... ``` or ``` ... ``` markdown fence wrapping."""
    stripped = s.strip()
    if not stripped.startswith("```"):
        return stripped
    # Drop the opening fence line (may be ```json or just ```)
    if "\n" in stripped:
        stripped = stripped.split("\n", 1)[1]
    else:
        stripped = stripped[3:]
    # Drop trailing ``` if present
    if stripped.rstrip().endswith("```"):
        stripped = stripped.rstrip()[:-3].rstrip()
    return stripped


def describe_frame(path: str, timestamp: float, context: str = "") -> dict:
    img_b64 = b64encode(open(path, "rb").read()).decode()

    system_prompt = (
        "You analyze video frames and return STRICT JSON only. "
        "Never include commentary, markdown fences, or explanations — just JSON."
    )
    user_prompt = (
        f"Video context: {context}\n\n" if context else ""
    ) + (
        "Analyze this frame and return a JSON object with exactly these keys:\n"
        '  "visual": 1 sentence describing the scene (who/what/where).\n'
        '  "ocr_text": all legible on-screen text, captions, subtitles, lower-thirds, '
        "signs, UI labels. Use original language. If nothing legible, return \"\".\n"
        '  "entities": array of named people/brands/places that can be identified '
        "(combining visual cues + ocr_text + the video context). Empty array if uncertain.\n\n"
        'Example: {"visual":"A man in a dark suit speaks at a podium.","ocr_text":"雷军 小米SU7","entities":["Lei Jun","Xiaomi SU7"]}'
    )

    payload = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}},
                ],
            },
        ],
        "max_tokens": 400,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }).encode()

    req = urllib.request.Request(API_URL, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "User-Agent": "video-describe/1.0",
    })

    t0 = time.time()
    max_retries = 5
    for attempt in range(max_retries):
        try:
            resp = urllib.request.urlopen(req, timeout=30)
            data = json.loads(resp.read())
            elapsed = time.time() - t0
            msg = data["choices"][0]["message"]
            content = (msg.get("content") or "").strip()
            tokens = data.get("usage", {}).get("completion_tokens", 0)
            # Fallback: not all OpenRouter-proxied models honor response_format={"type":"json_object"}.
            # Strip optional ```json fence, guard against non-dict JSON, and coerce null-ish values.
            json_candidate = _strip_json_fence(content)
            try:
                parsed = json.loads(json_candidate)
                if not isinstance(parsed, dict):
                    raise ValueError("JSON root is not an object")
                visual = str(parsed.get("visual") or "").strip()
                ocr_text = str(parsed.get("ocr_text") or "").strip()
                entities = parsed.get("entities")
                if not isinstance(entities, list):
                    entities = []
            except (json.JSONDecodeError, ValueError):
                visual = content
                ocr_text = ""
                entities = []
            return {
                "timestamp": timestamp,
                "elapsed": elapsed,
                "tokens": tokens,
                "visual": visual,
                "ocr_text": ocr_text,
                "entities": entities,
            }
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                wait = float(e.headers.get("retry-after", 2 * (attempt + 1)))
                time.sleep(wait)
                continue
            elapsed = time.time() - t0
            return {"timestamp": timestamp, "elapsed": elapsed, "tokens": 0, "visual": f"(error: {e})", "ocr_text": "", "entities": []}
        except Exception as e:
            elapsed = time.time() - t0
            return {"timestamp": timestamp, "elapsed": elapsed, "tokens": 0, "visual": f"(error: {e})", "ocr_text": "", "entities": []}


def summarize(descriptions: list[dict], context: str = "") -> str:
    """Aggregate frames into a narrative summary, privileging OCR and entities."""
    lines = []
    for d in descriptions:
        ocr = f' | text: "{d["ocr_text"]}"' if d["ocr_text"] else ""
        ents = f' | entities: {", ".join(d["entities"])}' if d["entities"] else ""
        lines.append(f'- [{fmt_ts(d["timestamp"])}] {d["visual"]}{ocr}{ents}')
    timeline = "\n".join(lines)

    context_line = f"Video context: {context}\n\n" if context else ""
    prompt = (
        f"{context_line}"
        "Based on this frame-by-frame timeline (including OCR text and identified entities), "
        "write a concise 4-6 sentence summary of what this video is about. "
        "Privilege names, dates, and numbers from the OCR text and entities list. "
        "If the same person appears across frames, name them once and refer consistently.\n\n"
        f"{timeline}"
    )

    payload = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 400,
        "temperature": 0.3,
    }).encode()
    req = urllib.request.Request(API_URL, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    })
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        data = json.loads(resp.read())
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"(summary generation failed: {e})"


def fmt_ts(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    return f"{m}:{s:02d}"


def _md_cell(s: str) -> str:
    """Escape a string for safe inclusion in a markdown table cell."""
    return s.replace("|", "\\|").replace("\r", " ").replace("\n", " ")


def main():
    parser = argparse.ArgumentParser(description="Fast video description via Groq vision API")
    parser.add_argument("video", help="Path to video file")
    parser.add_argument("--interval", type=float, default=2.0, help="Seconds between frames (default: 2)")
    parser.add_argument("--output", "-o", help="Save markdown to file (default: stdout)")
    parser.add_argument("--model", default=MODEL, help=f"Groq vision model (default: {MODEL})")
    parser.add_argument("--workers", type=int, default=MAX_WORKERS, help=f"Parallel requests (default: {MAX_WORKERS})")
    parser.add_argument(
        "--context",
        default="",
        help="Context about the video (e.g. 'Lei Jun SU7 launch event') for identity inference",
    )
    args = parser.parse_args()

    if not API_KEY:
        print("Error: No API key set. Set one of:", file=sys.stderr)
        print("  export OPENROUTER_API_KEY='sk-or-...'", file=sys.stderr)
        print("  export GROQ_API_KEY='gsk_...'", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(args.video):
        print(f"Error: Video file not found: {args.video}", file=sys.stderr)
        sys.exit(1)

    # Get video info
    duration = get_duration(args.video)
    filename = os.path.basename(args.video)
    print(f"Processing {filename} ({fmt_ts(duration)}) with {args.interval}s intervals...", file=sys.stderr)

    # Extract frames
    tmpdir = tempfile.mkdtemp(prefix="vdesc_")
    try:
        t_start = time.time()
        frames = extract_frames(args.video, args.interval, tmpdir)
        t_extract = time.time() - t_start
        print(f"  Extracted {len(frames)} frames in {t_extract:.1f}s", file=sys.stderr)

        # Process frames in parallel
        results = []
        t_api = time.time()
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {
                pool.submit(describe_frame, f["path"], f["timestamp"], args.context): f
                for f in frames
            }
            done = 0
            for fut in as_completed(futures):
                results.append(fut.result())
                done += 1
                if done % 10 == 0 or done == len(frames):
                    print(f"  [{done}/{len(frames)}] frames described", file=sys.stderr)

        t_api_done = time.time() - t_api
        results.sort(key=lambda r: r["timestamp"])

        # Generate summary
        print("  Generating summary...", file=sys.stderr)
        summary = summarize(results, args.context)

        total_time = time.time() - t_start
        total_tokens = sum(r["tokens"] for r in results)

        # Build markdown
        md = []
        md.append(f"# Video Description: {filename}")
        md.append("")
        header = (
            f"**Duration:** {fmt_ts(duration)} | "
            f"**Frames:** {len(results)} | "
            f"**Interval:** {args.interval}s | "
            f"**Processing time:** {total_time:.1f}s | "
            f"**Model:** {MODEL}"
        )
        if args.context:
            header += f" | **Context:** {args.context}"
        md.append(header)
        md.append("")

        md.append("## Summary")
        md.append("")
        md.append(summary)
        md.append("")

        # Aggregate unique entities across frames
        all_entities = sorted({e for r in results for e in r["entities"]})
        if all_entities:
            md.append("## Identified Entities")
            md.append("")
            md.append(", ".join(all_entities))
            md.append("")

        md.append("## Frame-by-Frame Timeline")
        md.append("")
        md.append("| Time | Visual | On-screen Text | Entities |")
        md.append("|------|--------|----------------|----------|")
        for r in results:
            visual = _md_cell(r["visual"])
            ocr = _md_cell(r["ocr_text"])
            ents = ", ".join(_md_cell(e) for e in r["entities"])
            md.append(f"| {fmt_ts(r['timestamp'])} | {visual} | {ocr} | {ents} |")
        md.append("")
        md.append("---")
        md.append(
            f"*Generated in {total_time:.1f}s ({t_extract:.1f}s extract + {t_api_done:.1f}s API) "
            f"using {total_tokens} tokens across {len(results)} frames "
            f"with {args.workers} parallel workers.*"
        )

        output = "\n".join(md)

        if args.output:
            with open(args.output, "w") as f:
                f.write(output)
            print(f"\nSaved to {args.output} ({total_time:.1f}s total)", file=sys.stderr)
        else:
            print(output)

    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == "__main__":
    main()
