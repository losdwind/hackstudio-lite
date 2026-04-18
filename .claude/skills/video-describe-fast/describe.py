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


def describe_frame(path: str, timestamp: float, context: str = "") -> dict:
    img_b64 = b64encode(open(path, "rb").read()).decode()

    payload = json.dumps({
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": "Describe this video frame in 1-2 concise sentences. Just the description, nothing else."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}},
            ],
        }],
        "max_tokens": 150,
        "temperature": 0.3,
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
            content = (msg.get("content") or msg.get("reasoning") or msg.get("thinking") or "").strip()
            tokens = data.get("usage", {}).get("completion_tokens", 0)
            return {"timestamp": timestamp, "elapsed": elapsed, "tokens": tokens, "description": content}
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                wait = float(e.headers.get("retry-after", 2 * (attempt + 1)))
                time.sleep(wait)
                continue
            elapsed = time.time() - t0
            return {"timestamp": timestamp, "elapsed": elapsed, "tokens": 0, "description": f"(error: {e})"}
        except Exception as e:
            elapsed = time.time() - t0
            return {"timestamp": timestamp, "elapsed": elapsed, "tokens": 0, "description": f"(error: {e})"}


def summarize(descriptions: list[dict]) -> str:
    timeline = "\n".join(
        f"- [{fmt_ts(d['timestamp'])}] {d['description']}"
        for d in descriptions
    )
    payload = json.dumps({
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": f"Based on these video frame descriptions, write a concise 3-5 sentence summary of what this video is about:\n\n{timeline}",
        }],
        "max_tokens": 300,
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
        summary = summarize(results)

        total_time = time.time() - t_start
        total_tokens = sum(r["tokens"] for r in results)

        # Build markdown
        md = []
        md.append(f"# Video Description: {filename}")
        md.append("")
        md.append(f"**Duration:** {fmt_ts(duration)} | "
                   f"**Frames:** {len(results)} | "
                   f"**Interval:** {args.interval}s | "
                   f"**Processing time:** {total_time:.1f}s | "
                   f"**Model:** {MODEL}")
        md.append("")
        md.append("## Summary")
        md.append("")
        md.append(summary)
        md.append("")
        md.append("## Frame-by-Frame Timeline")
        md.append("")
        md.append("| Time | Description |")
        md.append("|------|-------------|")
        for r in results:
            desc = r["description"].replace("|", "\\|").replace("\n", " ")
            md.append(f"| {fmt_ts(r['timestamp'])} | {desc} |")
        md.append("")
        md.append("---")
        md.append(f"*Generated in {total_time:.1f}s ({t_extract:.1f}s extract + {t_api_done:.1f}s API) "
                   f"using {total_tokens} tokens across {len(results)} frames "
                   f"with {args.workers} parallel workers on Groq.*")

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
