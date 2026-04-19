# B-Roll Source URLs — Verified

Source-of-truth list for `public/xiaomi-su7-bet/videos/` clips. Every URL here has been verified via `yt-dlp --dump-json` and matched against the expected metadata. `yt-dlp` never discovers URLs — it only downloads from this list.

| Filename | URL | Uploader | Duration | Upload date | Verified on | Why this source |
|----------|-----|----------|----------|-------------|-------------|-----------------|
| `lei-jun-su7-launch.mp4` | https://www.bilibili.com/video/BV1em421n7Tv | 中二少年Hassium (user rebroadcast) | ~132 min | 2024-03-28 | 2026-04-19 | Full 1080P rebroadcast of Xiaomi's official 2024-03-28 SU7 launch keynote; stream feed is identical to the original Xiaomi broadcast |
| `su7-nurburgring.mp4` (kept, renamed) | *(originally downloaded as lei-jun-su7-launch.mp4)* | — | 6:57 | — | 2026-04-19 | Xiaomi SU7 Ultra prototype Nürburgring lap record run — useful for Part 3 driving / specs sequences even though it's not the keynote |
| `apple-cook-archive.mp4` | https://www.youtube.com/watch?v=f1J38FlDKxo | Apple (official) | 38 min | 2024-05-07 | 2026-04-19 | Apple's official "Let Loose" event; Cook opens the keynote on stage — clean Cook-on-stage footage |
| `bloomberg-lei-jun.mp4` | *(previously downloaded; keep)* | Bloomberg Tech | 2:57 | — | 2026-04-19 | Bloomberg segment on Xiaomi's EV transition, Wang Peizhi tragedy — already verified correct |
| `xiaomi-factory.mp4` | *(previously downloaded; keep)* | Xiaomi (official) | 2:48 | — | 2026-04-19 | Official Xiaomi EV factory tour — die-casting, X-Eye AI inspection, 76s/unit rate — already verified correct |
| `cnbc-china-ev.mp4` | *(previously downloaded; keep)* | CNBC Digital Originals | 11:43 | — | 2026-04-19 | CNBC report on Chinese investments in Europe; touches on Xiaomi SU7 — tangential but usable for Part 4 Western-media reaction |

## URLs rejected during verification

| URL | Reason |
|-----|--------|
| https://www.youtube.com/watch?v=HNupariQkME | Title matched but uploader is `MIUI Themer` (747 views) — not an official Xiaomi channel |
| https://www.bilibili.com/video/BV1TZ421b7f4/ | Same content as chosen BV1em421n7Tv but uploaded in lower-bitrate form |

## Verification command template

```bash
yt-dlp --dump-json --no-warnings <URL> | jq '{title, uploader, uploader_id, channel, duration, upload_date, view_count}'
```

Expected assertions before a URL is added to this file:
- **title** contains the target event keywords
- **uploader** matches an official channel OR is documented as a faithful rebroadcast
- **duration** is within 30% of expected event length
- **upload_date** is within 14 days of the real event
- **view_count** is proportional to event prominence (low view count on an official channel is suspicious)

If any assertion fails, reject and find another URL.
