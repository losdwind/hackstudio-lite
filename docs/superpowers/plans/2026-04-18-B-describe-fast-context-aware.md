# Plan B: video-describe-fast Context-Aware OCR Upgrade

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `video-describe-fast` skill so its `.analysis.md` output includes (1) on-screen text extracted via OCR per frame, (2) person/identity inference when context is provided, and (3) a structured frame-by-frame timeline with `[visual, ocr_text, inferred_entities]` triple instead of the current single sentence.

**Architecture:** Stay on the OpenRouter multimodal API but switch the default model from `qwen/qwen3.5-9b` (which only describes visuals) to `meta-llama/llama-4-scout-17b-16e-instruct` (supports OCR cleanly, no thinking leak). Rewrite the per-frame prompt to request a JSON triple. Add a new `--context` CLI arg that injects video context into the system prompt for identity inference. Keep the workflow: ffmpeg frame extraction + parallel HTTP requests + markdown output.

**Tech Stack:** Python 3.9+, ffmpeg, OpenRouter API, urllib (no new deps)

---

## File Structure

Files modified:
- `.claude/skills/video-describe-fast/describe.py` — rewrite prompts, add `--context` flag, switch default model, parse JSON responses
- `.claude/skills/video-describe-fast/SKILL.md` — document new `--context` arg + updated default model + new output format
- `CLAUDE.md` — update the documented model name to match new default

No new files. One tool, richer output.

---

## Task 1: Switch default model and add --context flag

**Files:**
- Modify: `.claude/skills/video-describe-fast/describe.py`

- [ ] **Step 1: Change default model and add --context to argparse**

Edit [`.claude/skills/video-describe-fast/describe.py:25`](/.claude/skills/video-describe-fast/describe.py):

Replace:
```python
MODEL = os.getenv("VISION_MODEL", "qwen/qwen3.5-9b")
```
with:
```python
MODEL = os.getenv("VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
```

Then in the `main()` argparse block (near line 135), add after `--workers`:
```python
parser.add_argument(
    "--context",
    default="",
    help="Context about the video (e.g. 'Lei Jun SU7 launch event') for identity inference",
)
```

- [ ] **Step 2: Pass context into `describe_frame`**

Modify `describe_frame(path, timestamp)` signature to accept context:
```python
def describe_frame(path: str, timestamp: float, context: str = "") -> dict:
```

In `main()`, update the ThreadPoolExecutor submit call:
```python
futures = {
    pool.submit(describe_frame, f["path"], f["timestamp"], args.context): f
    for f in frames
}
```

- [ ] **Step 3: Typecheck**

Run: `python3 -c "import ast; ast.parse(open('.claude/skills/video-describe-fast/describe.py').read())"`
Expected: No output (parses cleanly).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/video-describe-fast/describe.py
git commit -m "feat(describe-fast): switch default model and add --context CLI flag"
```

---

## Task 2: Rewrite the per-frame prompt to return a JSON triple

**Files:**
- Modify: `.claude/skills/video-describe-fast/describe.py`

- [ ] **Step 1: Replace the prompt inside describe_frame**

Find this block in `describe_frame()`:
```python
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
```

Replace with:
```python
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
```

- [ ] **Step 2: Parse the JSON response**

Find the success branch (after `data = json.loads(resp.read())`):
```python
content = (msg.get("content") or msg.get("reasoning") or msg.get("thinking") or "").strip()
tokens = data.get("usage", {}).get("completion_tokens", 0)
return {"timestamp": timestamp, "elapsed": elapsed, "tokens": tokens, "description": content}
```

Replace with:
```python
content = (msg.get("content") or "").strip()
tokens = data.get("usage", {}).get("completion_tokens", 0)
try:
    parsed = json.loads(content)
    visual = str(parsed.get("visual", "")).strip()
    ocr_text = str(parsed.get("ocr_text", "")).strip()
    entities = parsed.get("entities", [])
    if not isinstance(entities, list):
        entities = []
except json.JSONDecodeError:
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
```

- [ ] **Step 3: Typecheck**

Run: `python3 -c "import ast; ast.parse(open('.claude/skills/video-describe-fast/describe.py').read())"`

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/video-describe-fast/describe.py
git commit -m "feat(describe-fast): return structured visual+ocr+entities JSON per frame"
```

---

## Task 3: Update summary to use new structured data

**Files:**
- Modify: `.claude/skills/video-describe-fast/describe.py`

- [ ] **Step 1: Replace summarize() function**

Find the current `summarize()` and replace with:
```python
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
```

- [ ] **Step 2: Update the caller in main()**

Change:
```python
summary = summarize(results)
```
to:
```python
summary = summarize(results, args.context)
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/video-describe-fast/describe.py
git commit -m "feat(describe-fast): summarize with OCR+entities for identity-aware output"
```

---

## Task 4: Update markdown output format

**Files:**
- Modify: `.claude/skills/video-describe-fast/describe.py`

- [ ] **Step 1: Replace the markdown build section in main()**

Find the block starting with `md = []` and rebuild the table/timeline:
```python
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
    visual = r["visual"].replace("|", "\\|").replace("\n", " ")
    ocr = r["ocr_text"].replace("|", "\\|").replace("\n", " ")
    ents = ", ".join(r["entities"])
    md.append(f"| {fmt_ts(r['timestamp'])} | {visual} | {ocr} | {ents} |")
md.append("")
md.append("---")
md.append(
    f"*Generated in {total_time:.1f}s ({t_extract:.1f}s extract + {t_api_done:.1f}s API) "
    f"using {total_tokens} tokens across {len(results)} frames.*"
)
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/video-describe-fast/describe.py
git commit -m "feat(describe-fast): 4-column markdown timeline with OCR and entities"
```

---

## Task 5: Smoke test against an existing xiaomi-su7 clip

**Files:** None (test only)

- [ ] **Step 1: Run on a leijun-stage clip WITH context**

Run:
```bash
OPENROUTER_API_KEY="$OPENROUTER_API_KEY" python3 .claude/skills/video-describe-fast/describe.py \
  public/xiaomi-su7/videos/official-leijun-stage.mp4 \
  --interval 4 \
  --context "Lei Jun's Xiaomi SU7 launch event, March 2024" \
  --output /tmp/leijun-test.md
```

Expected: `/tmp/leijun-test.md` contains the 4-column table. The **Identified Entities** section should list `Lei Jun` (and possibly `Xiaomi`, `SU7`). On-screen text column should pick up Chinese captions/lower-thirds.

- [ ] **Step 2: Run WITHOUT context (control)**

Run:
```bash
OPENROUTER_API_KEY="$OPENROUTER_API_KEY" python3 .claude/skills/video-describe-fast/describe.py \
  public/xiaomi-su7/videos/official-leijun-stage.mp4 \
  --interval 4 \
  --output /tmp/leijun-nocontext.md
```

Expected: OCR text populated. Entities column may still contain `Lei Jun` if the caption says so; otherwise empty (that's correct — without context we shouldn't guess).

- [ ] **Step 3: Diff the outputs**

Run: `diff /tmp/leijun-test.md /tmp/leijun-nocontext.md`
Expected: Entities column and Summary mention "Lei Jun" in the context run; the nocontext run may say "a man in a suit".

- [ ] **Step 4: If diff proves the context works — commit a demo snippet**

Update CLAUDE.md "Available Research Skills" table entry for `video-describe-fast` to note the new `--context` flag. Run:

```bash
# (manual edit to CLAUDE.md, see Task 6)
```

---

## Task 6: Update SKILL.md and CLAUDE.md documentation + scrub stale references

**Files:**
- Modify: `.claude/skills/video-describe-fast/describe.py`
- Modify: `.claude/skills/video-describe-fast/SKILL.md`
- Modify: `CLAUDE.md`

- [ ] **Step 0: Scrub stale "Groq" references in describe.py**

The file's docstrings, argparse description, `--model` help text, example invocation, and footer caption still say "Groq" — but the default is now an OpenRouter-routed Llama model. Replace every occurrence:

| File location | Current (stale) | Replace with |
|---|---|---|
| `describe.py:3` docstring | `Fast video description using Groq API vision models.` | `Fast video description using OpenRouter vision models.` |
| `describe.py:8` example | `API_KEY=gsk_... python3 describe.py video.mp4` | `OPENROUTER_API_KEY=sk-or-... python3 describe.py video.mp4` |
| `describe.py:130` parser | `description="Fast video description via Groq vision API"` | `description="Fast video description via OpenRouter vision API"` |
| `describe.py:134` --model help | `help=f"Groq vision model (default: {MODEL})"` | `help=f"Vision model (default: {MODEL})"` |
| `describe.py:216` footer | `"with {args.workers} parallel workers on Groq."` | `"with {args.workers} parallel workers on OpenRouter."` |

- [ ] **Step 1: Update SKILL.md**

Edit `.claude/skills/video-describe-fast/SKILL.md`:

1. In the description (line 3–7), change "returns markdown with frame-by-frame timeline and summary" to "returns markdown with visual + OCR text + identified entities per frame, plus a context-aware summary."

2. In Step 1 "Parse user input", add after `output_path`:
```markdown
- **context**: Optional video context ("Lei Jun's SU7 launch event") — injected into prompts so the model can identify people, brands, and products by name instead of generic descriptions like "a middle-aged man".
```

3. In Step 2 "Run the script", add the context flag:
```bash
python3 .claude/skills/video-describe-fast/describe.py \
  "{VIDEO_PATH}" \
  --interval {INTERVAL} \
  --context "{CONTEXT}" \
  --workers 10 \
  --output "{OUTPUT_PATH}"
```

4. In "Environment Variables" table, change the VISION_MODEL default from `qwen/qwen3.5-9b` to `meta-llama/llama-4-scout-17b-16e-instruct`.

5. In "Changing the model" section, swap which model is the default vs override. Add a note: "Qwen 3.5 9B is also supported but tends to produce shallower OCR and leaks chain-of-thought."

6. In "Example Usage", add:
```
/video-describe-fast public/videos/leijun-stage.mp4 context="Lei Jun SU7 launch, March 2024"
```

- [ ] **Step 2: Update CLAUDE.md**

In `CLAUDE.md`, find the line:
```
- Video analysis: video-describe-fast skill (Llama 4 Scout via OpenRouter — NOT Qwen which leaks chain-of-thought)
```
Replace with:
```
- Video analysis: video-describe-fast skill — pass `--context "<what this video is about>"` to get OCR + identity inference (not just visual description). Default model: Llama 4 Scout via OpenRouter.
```

Also find the "Available Research Skills" table entry for video-describe-fast and update its description to:
```
| `video-describe-fast` | Frame-by-frame visual + OCR + entity extraction | Analyzing B-roll and source videos (use `--context` for identity-aware output) |
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/video-describe-fast/SKILL.md CLAUDE.md
git commit -m "docs: document --context flag and identity-aware output for describe-fast"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - OCR extraction ✓ Task 2 prompt change
   - Context-aware identity inference ✓ Tasks 1 + 2
   - Frame-by-frame structured timeline ✓ Task 4
   - Model switch (Qwen → Llama 4 Scout) ✓ Task 1
   - Documentation ✓ Task 6
   - Smoke test with CN captions ✓ Task 5

2. **Placeholder scan:** Every code block is complete. No `# TODO`. Example invocations are real commands.

3. **Type consistency:** `describe_frame` now returns `{visual, ocr_text, entities}` triple. All downstream code (`summarize`, markdown build) uses the same keys.

---

## Risk Notes for Executor

- **JSON response format**: Not all OpenRouter models honor `response_format: {"type": "json_object"}`. Llama 4 Scout does. If a user overrides to a model that doesn't, the `json.loads` will fail and we fall back to treating content as plain visual text (see Task 2 step 2).
- **Token cost**: Moving from 150 max_tokens to 400 roughly 2.5× the output token cost per frame. For a 5-min video at 4s interval (75 frames), that's ~30K output tokens total — still cheap on Llama 4 Scout. Mention this in the commit body if deploying cost-sensitive.
- **CN OCR**: Chinese lower-thirds are the main target. Llama 4 Scout handles Chinese characters; do NOT substitute it for a model that doesn't (smaller Qwen variants fail on CJK sometimes).
- **Existing `.analysis.md` files**: Files generated BEFORE this upgrade have 2-column tables. Don't auto-migrate; just regenerate when the editor skill (Plan C) or any consumer needs the new fields. The B-roll manifest does not reference these files directly.
