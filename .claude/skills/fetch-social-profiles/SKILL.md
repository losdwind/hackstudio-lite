---
name: fetch-social-profiles
description: |
  Fetch social profiles (avatars + metadata) from X, GitHub, and YouTube for course video assets. Reads people block from script.md or accepts single-person mode. Supports auto-resolving names to handles via Tavily.
  Trigger: user asks to "fetch social profiles", "download avatars", "get profile images", mentions needing social profile assets for a lesson, wants to resolve a person's social handles, or references a <!-- people: --> block in script.md.
---

# Fetch Social Profiles for Course Assets

Download avatars and metadata from X (Twitter), GitHub, and YouTube for use in course video segments.

## Prerequisites

| Variable | Required for | Where |
|----------|-------------|-------|
| `X_BEARER_TOKEN` | X profile fetching | `remotion/.env` |
| `TAVILY_API_KEY` | `--resolve` mode (name-to-handle) | `remotion/.env` |

GitHub and YouTube fetching require no API keys.

## Workflows

### A. Auto-fetch from script.md people block

When `script.md` already has a `<!-- people: ... -->` block:

```bash
cd remotion && bun scripts/fetch-social-profiles.ts --lesson-root <path>
```

With auto-resolve for missing handles:
```bash
cd remotion && bun scripts/fetch-social-profiles.ts --lesson-root <path> --resolve
```

### B. Single person with known handles

```bash
cd remotion && bun scripts/fetch-social-profiles.ts --lesson-root <path> \
  --person "Vitalik Buterin" --x vitalikbuterin --github vbuterin --youtube "@VitalikButerin"
```

### C. Single person with auto-resolve

When only a name is known:
```bash
cd remotion && bun scripts/fetch-social-profiles.ts --lesson-root <path> \
  --person "Vitalik Buterin" --role "Ethereum co-founder" --resolve
```

### D. During script.md generation

1. Identify people mentioned in the content
2. Write the `<!-- people: -->` block at the top of script.md:

```markdown
<!-- people:
  - name: Vitalik Buterin
    x: vitalikbuterin
    github: vbuterin
    youtube: "@VitalikButerin"
    role: Ethereum co-founder
  - name: Hayden Adams
    x: haaboreas
    github: haydenadams
    role: Uniswap creator
-->
```

3. Run `bun scripts/fetch-social-profiles.ts --lesson-root <path>`
4. Reference in script.md:
```
"src": "assets/social-profiles/vitalikbuterin/x-avatar.jpg"
"src": "assets/social-profiles/vitalikbuterin/github-avatar.jpg"
"src": "assets/social-profiles/vitalikbuterin/youtube-thumbnail.jpg"
```

## People Block Format

```yaml
<!-- people:
  - name: Full Name         # required
    x: handle               # X username, no @ prefix
    github: username         # GitHub username
    youtube: "@Handle"       # YouTube handle, with or without @
    role: short description  # used as context for --resolve
-->
```

Only `name` is required. Missing handles are skipped or resolved with `--resolve`.

## CLI Reference

| Flag | Purpose |
|------|---------|
| `--lesson-root DIR` | Lesson variant directory (required) |
| `--person NAME` | Single-person mode |
| `--role DESC` | Role/context for resolve (with `--person`) |
| `--x HANDLE` | Explicit X handle (with `--person`) |
| `--github USER` | Explicit GitHub handle (with `--person`) |
| `--youtube HANDLE` | Explicit YouTube handle (with `--person`) |
| `--resolve` | Auto-resolve missing handles via Tavily |
| `--list` | Show cached profiles |
| `--dry-run` | Preview without downloading |
| `--force` | Overwrite cached profiles (ignore 7-day TTL) |

## Tips

- Profiles are cached for 7 days; use `--force` to refresh
- `--resolve` uses Tavily web search; low-confidence matches are skipped
- Working directory must be `remotion/`
