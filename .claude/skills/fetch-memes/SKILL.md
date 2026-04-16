---
name: fetch-memes
description: |
  Fetch memes and GIFs for course video assets. Searches 4 sources: doutula (斗图啦), doutub (表情包API), memes.tw (梗圖倉庫), and Giphy.
  Trigger: user asks to "find memes", "download memes", "search memes", "get meme images", "fetch 表情包", "找梗图", mentions memes for a lesson, or needs meme assets for course content.
---

# Fetch Memes for Course Assets

Search and download memes/GIFs from multiple sources for use in course video segments.

## Sources

| Source | Language | Type | Auth |
|--------|----------|------|------|
| doutula (斗图啦) | Simplified Chinese | HTML scraping | None |
| doutub (表情包API) | Simplified Chinese | JSON API | None |
| memes.tw (梗圖倉庫) | Traditional Chinese | JSON API + client filter | None |
| giphy | English | JSON API | `GIPHY_API_KEY` |

## Workflow

### 1. Determine lesson root

The lesson root is the variant directory containing `script.md` + `lesson.meta.json`.
Example: `courses/course-1-stablecoin-protocol/unit-2-protocol-mvp/1-project-structure/en/`

If the user has not specified one, infer from conversation context or ask.

### 2. Dry-run search first

Always preview results before downloading:

```bash
cd remotion && bun scripts/fetch-memes.ts --lesson-root <path> --search "<keyword>" --dry-run
```

To restrict to a single source:
```bash
cd remotion && bun scripts/fetch-memes.ts --lesson-root <path> --search "<keyword>" --source doutub --dry-run
```

To browse trending (memes.tw or giphy only):
```bash
cd remotion && bun scripts/fetch-memes.ts --lesson-root <path> --browse --source giphy --dry-run
```

### 3. Download selected memes

After the user reviews the dry-run output:

```bash
cd remotion && bun scripts/fetch-memes.ts --lesson-root <path> --search "<keyword>" --top <N>
```

### 4. Report asset paths

After download, provide the `"src"` path for use in `script.md`:
```
"src": "assets/memes/<filename>"
```

## CLI Reference

| Flag | Purpose |
|------|---------|
| `--lesson-root DIR` | Lesson variant directory (required) |
| `--search QUERY` | Search by keyword |
| `--browse` | Browse trending (memes.tw or giphy) |
| `--source NAME` | Restrict to: `doutula`, `doutub`, `memes.tw`, `giphy` |
| `--top N` | Download top N matches (default: 1) |
| `--pages N` | Max pages per source (default: 3) |
| `--dry-run` | Preview without downloading |
| `--force` | Overwrite existing files |
| `--list-sources` | Show available sources |

## Tips

- Chinese memes: use `doutula` or `doutub` (simplified Chinese keywords like 猫, 区块链)
- Taiwanese memes: use `memes.tw` (traditional Chinese keywords like 貓, 區塊鏈)
- English GIFs: use `giphy` (requires `GIPHY_API_KEY` env var)
- Working directory must be `remotion/`
