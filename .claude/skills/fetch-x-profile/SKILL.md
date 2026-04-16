---
name: fetch-x-profile
description: |
  Fetch X (Twitter) profile avatars and metadata for course video assets. Supports exact username lookup, keyword search, and batch fetching.
  Trigger: user asks to "fetch X profile", "download Twitter avatar", "get X avatar", "fetch Twitter profile", mentions needing an X/Twitter profile image for a lesson, or references a Twitter/X handle for course content.
---

# Fetch X (Twitter) Profile for Course Assets

Download X profile avatars (400x400) and metadata for use in course video segments (SplitImage, gallery layouts, SocialEmbed).

## Prerequisites

Requires `X_BEARER_TOKEN` environment variable (set in `remotion/.env`).

If not set, instruct the user:
1. Get a Bearer token at https://developer.x.com/en/portal/dashboard
2. Add to `remotion/.env`: `X_BEARER_TOKEN=your_token`

## Workflow

### 1. Determine lesson root

The lesson root is the variant directory containing `script.md` + `lesson.meta.json`.
If not specified, infer from conversation context or ask.

### 2. Fetch profile

**By exact username** (Free tier):
```bash
cd remotion && bun scripts/fetch-x-profiles.ts --lesson-root <path> --username <handle>
```

**Multiple profiles at once:**
```bash
cd remotion && bun scripts/fetch-x-profiles.ts --lesson-root <path> --batch user1,user2,user3
```

**By keyword search** (Basic tier, $100/mo):
```bash
cd remotion && bun scripts/fetch-x-profiles.ts --lesson-root <path> --search "<query>"
```

**For cross-lesson shared assets:**
```bash
cd remotion && bun scripts/fetch-x-profiles.ts --global --username <handle>
```

### 3. Report asset paths

Lesson-local (default):
```
"src": "assets/x-profiles/<username>/avatar.jpg"
```

Global (`--global`):
```
"src": "brand/x-profiles/<username>/avatar.jpg"
```

## CLI Reference

| Flag | Purpose |
|------|---------|
| `--lesson-root DIR` | Lesson variant directory (required unless `--global`) |
| `--global` | Store in `public/brand/x-profiles/` |
| `--username NAME` | Exact username lookup (Free tier) |
| `--search QUERY` | Search by name/username/bio (Basic tier) |
| `--batch U1,U2,..` | Fetch multiple usernames |
| `--list` | Show cached profiles |
| `--dry-run` | Preview without downloading |
| `--force` | Overwrite existing / ignore 7-day cache |

## Tips

- Avatars are downloaded at 400x400 (high-res)
- Profiles cached for 7 days; use `--force` to refresh
- `--username` works on Free tier; `--search` requires Basic tier ($100/mo)
- Working directory must be `remotion/`
