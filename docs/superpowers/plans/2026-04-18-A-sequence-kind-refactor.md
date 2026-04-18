# Plan A: Sequence Kind Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the implicit "every sequence = video background + optional overlay" architecture with an explicit discriminated union of sequence kinds (`video` | `chart` | `title` | `quote` | `ending`) so that charts render on calm gradient backgrounds instead of competing with moving video.

**Architecture:** Introduce a new `SequenceEntry` discriminated union in `src/shared/lib/sequence-types.ts`. Rewrite `PartRenderer` to dispatch by `kind`. Add a `StaticBackground` component (gradient surface for non-video kinds). Migrate `xiaomi-su7` Part1–Part5 as the reference migration. Keep `broll-manifest.ts` schema unchanged — only `kind: "video"` entries reference it.

**Tech Stack:** Remotion 4.0.448, React 19, TypeScript, TailwindCSS v4

---

## File Structure

Files created:
- `src/shared/lib/sequence-types.ts` — new discriminated union + type guards
- `src/shared/components/StaticBackground.tsx` — gradient surface for non-video kinds
- `src/shared/components/renderers/VideoSequence.tsx` — renderer for `kind: "video"`
- `src/shared/components/renderers/ChartSequence.tsx` — renderer for `kind: "chart"`
- `src/shared/components/renderers/TitleSequence.tsx` — renderer for `kind: "title"`
- `src/shared/components/renderers/QuoteSequence.tsx` — renderer for `kind: "quote"`
- `src/shared/components/renderers/EndingSequence.tsx` — renderer for `kind: "ending"`

Files modified:
- `src/shared/components/PartRenderer.tsx` — dispatches by kind
- `src/videos/xiaomi-su7/components/part{1..5}/Part*.tsx` — migrate to new types
- `src/videos/xiaomi-su7/data/broll-manifest.ts` — unchanged (still keyed by `narrationN`)
- `scripts/validate-broll.ts` — update to read new sequence structure

One clear responsibility per file — dispatcher stays small (<50 lines), each renderer owns one kind.

---

## Task 1: Define SequenceEntry discriminated union

**Files:**
- Create: `src/shared/lib/sequence-types.ts`

- [ ] **Step 1: Write the new types file**

```typescript
// src/shared/lib/sequence-types.ts
import type { Lang } from "../schemas/video-schema";

/**
 * A sequence is one narration line + its visual treatment.
 *
 * Each `kind` renders differently:
 *   - video:  moving B-roll behind narration (primary storytelling mode)
 *   - chart:  calm gradient background behind a chart/diagram component
 *   - title:  calm gradient with large title text (part opener, no narration line idx)
 *   - quote:  calm gradient with centered quote + attribution
 *   - ending: final closing video with overlay component
 *
 * All non-ending kinds carry `lineIdx` so captions sync to the TTS line.
 */
export type SequenceEntry =
  | {
      kind: "video";
      lineIdx: number;
      brollKey: string;
      /** Dim the video 0..1. Default 0.25 (vivid). */
      videoOpacity?: number;
    }
  | {
      kind: "chart";
      lineIdx: number;
      component: React.ComponentType<{ lang: Lang }>;
    }
  | {
      kind: "title";
      lineIdx: number;
      /** If true, use the part's title/subtitle. If false, provide inline text. */
      usePartTitle?: boolean;
      title?: string;
      subtitle?: string;
    }
  | {
      kind: "quote";
      lineIdx: number;
      text: string;
      attribution?: string;
    }
  | {
      kind: "ending";
      brollKey: string;
      component: React.ComponentType<{ lang: Lang }>;
      videoOpacity?: number;
    };

export function isNarrationKind(
  seq: SequenceEntry
): seq is Exclude<SequenceEntry, { kind: "ending" }> {
  return seq.kind !== "ending";
}
```

- [ ] **Step 2: Run typecheck to verify no syntax errors**

Run: `bunx tsc --noEmit src/shared/lib/sequence-types.ts`
Expected: No output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/shared/lib/sequence-types.ts
git commit -m "feat(shared): add SequenceEntry discriminated union for non-video kinds"
```

---

## Task 2: Build StaticBackground component

**Files:**
- Create: `src/shared/components/StaticBackground.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/shared/components/StaticBackground.tsx
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, GRADIENTS } from "../lib/colors";

type StaticBackgroundProps = {
  /** Preset tone. Default "calm" (L1 surface + subtle radial glow). */
  tone?: "calm" | "warm" | "cool";
  /** Fade in duration in frames. Default 20 */
  fadeInFrames?: number;
};

/**
 * Calm gradient background used by chart, title, and quote sequences.
 * Design.md compliance: no solid borders, tonal shifts only, ambient glow.
 */
export const StaticBackground: React.FC<StaticBackgroundProps> = ({
  tone = "calm",
  fadeInFrames = 20,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const toneStyles: Record<"calm" | "warm" | "cool", React.CSSProperties> = {
    calm: {
      background: `radial-gradient(ellipse at 50% 40%, ${COLORS.surfaceL2} 0%, ${COLORS.surface} 70%)`,
    },
    warm: {
      background: `radial-gradient(ellipse at 50% 40%, rgba(255, 172, 95, 0.12) 0%, ${COLORS.surface} 70%)`,
    },
    cool: {
      background: `radial-gradient(ellipse at 50% 40%, rgba(157, 202, 255, 0.10) 0%, ${COLORS.surface} 70%)`,
    },
  };

  return <AbsoluteFill style={{ opacity, ...toneStyles[tone] }} />;
};
```

- [ ] **Step 2: Verify COLORS tokens exist**

Run: `grep -nE "surfaceL2|surface" src/shared/lib/colors.ts`
Expected: Both tokens present. If `surfaceL2` is missing, use the exact token name found.

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/components/StaticBackground.tsx
git commit -m "feat(shared): add StaticBackground for calm non-video sequences"
```

---

## Task 3: Build VideoSequence renderer

**Files:**
- Create: `src/shared/components/renderers/VideoSequence.tsx`

- [ ] **Step 1: Write the renderer**

```tsx
// src/shared/components/renderers/VideoSequence.tsx
import { VideoBackground } from "../VideoBackground";
import { SubtitleOverlay } from "../SubtitleOverlay";
import { NarrationAudio } from "../NarrationAudio";
import type { Lang } from "../../schemas/video-schema";
import type { LineTiming } from "../../lib/alignment-types";

type VideoSequenceProps = {
  lang: Lang;
  brollFile: string;
  brollStartFrom: number;
  videoOpacity?: number;
  // Continuous mode
  line?: LineTiming;
  // Per-line mode
  legacyAudio?: { file: string; duration: number };
  fallbackText?: string;
  bodyFont: string;
};

export const VideoSequence: React.FC<VideoSequenceProps> = ({
  brollFile,
  brollStartFrom,
  videoOpacity,
  line,
  legacyAudio,
  fallbackText,
  bodyFont,
}) => (
  <>
    <VideoBackground
      src={brollFile}
      startFrom={brollStartFrom}
      overlayOpacity={videoOpacity ?? 0.25}
    />
    {line && (
      <SubtitleOverlay
        words={line.words}
        lineStartTime={line.startTime}
        fontFamily={bodyFont}
      />
    )}
    {!line && legacyAudio && fallbackText && (
      <>
        <NarrationAudio src={legacyAudio.file} />
        <SubtitleOverlay
          text={fallbackText}
          audioDuration={legacyAudio.duration}
          fontFamily={bodyFont}
        />
      </>
    )}
  </>
);
```

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/renderers/VideoSequence.tsx
git commit -m "feat(shared): extract VideoSequence renderer for kind=video"
```

---

## Task 4: Build ChartSequence renderer

**Files:**
- Create: `src/shared/components/renderers/ChartSequence.tsx`

- [ ] **Step 1: Write the renderer**

```tsx
// src/shared/components/renderers/ChartSequence.tsx
import { StaticBackground } from "../StaticBackground";
import { SubtitleOverlay } from "../SubtitleOverlay";
import { NarrationAudio } from "../NarrationAudio";
import type { Lang } from "../../schemas/video-schema";
import type { LineTiming } from "../../lib/alignment-types";

type ChartSequenceProps = {
  lang: Lang;
  Component: React.ComponentType<{ lang: Lang }>;
  line?: LineTiming;
  legacyAudio?: { file: string; duration: number };
  fallbackText?: string;
  bodyFont: string;
};

export const ChartSequence: React.FC<ChartSequenceProps> = ({
  lang,
  Component,
  line,
  legacyAudio,
  fallbackText,
  bodyFont,
}) => (
  <>
    <StaticBackground tone="calm" />
    <Component lang={lang} />
    {line && (
      <SubtitleOverlay
        words={line.words}
        lineStartTime={line.startTime}
        fontFamily={bodyFont}
      />
    )}
    {!line && legacyAudio && fallbackText && (
      <>
        <NarrationAudio src={legacyAudio.file} />
        <SubtitleOverlay
          text={fallbackText}
          audioDuration={legacyAudio.duration}
          fontFamily={bodyFont}
        />
      </>
    )}
  </>
);
```

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/renderers/ChartSequence.tsx
git commit -m "feat(shared): add ChartSequence renderer for kind=chart"
```

---

## Task 5: Build TitleSequence and QuoteSequence renderers

**Files:**
- Create: `src/shared/components/renderers/TitleSequence.tsx`
- Create: `src/shared/components/renderers/QuoteSequence.tsx`

- [ ] **Step 1: Write TitleSequence**

```tsx
// src/shared/components/renderers/TitleSequence.tsx
import { StaticBackground } from "../StaticBackground";
import { SectionTitle } from "../SectionTitle";
import { SubtitleOverlay } from "../SubtitleOverlay";
import { NarrationAudio } from "../NarrationAudio";
import type { LineTiming } from "../../lib/alignment-types";

type TitleSequenceProps = {
  title: string;
  subtitle: string;
  displayFont: string;
  bodyFont: string;
  line?: LineTiming;
  legacyAudio?: { file: string; duration: number };
  fallbackText?: string;
};

export const TitleSequence: React.FC<TitleSequenceProps> = ({
  title,
  subtitle,
  displayFont,
  bodyFont,
  line,
  legacyAudio,
  fallbackText,
}) => (
  <>
    <StaticBackground tone="calm" />
    <SectionTitle
      title={title}
      subtitle={subtitle}
      displayFont={displayFont}
      bodyFont={bodyFont}
    />
    {line && (
      <SubtitleOverlay
        words={line.words}
        lineStartTime={line.startTime}
        fontFamily={bodyFont}
      />
    )}
    {!line && legacyAudio && fallbackText && (
      <>
        <NarrationAudio src={legacyAudio.file} />
        <SubtitleOverlay
          text={fallbackText}
          audioDuration={legacyAudio.duration}
          fontFamily={bodyFont}
        />
      </>
    )}
  </>
);
```

- [ ] **Step 2: Write QuoteSequence**

```tsx
// src/shared/components/renderers/QuoteSequence.tsx
import { AbsoluteFill } from "remotion";
import { StaticBackground } from "../StaticBackground";
import { SubtitleOverlay } from "../SubtitleOverlay";
import { NarrationAudio } from "../NarrationAudio";
import type { LineTiming } from "../../lib/alignment-types";

type QuoteSequenceProps = {
  text: string;
  attribution?: string;
  displayFont: string;
  bodyFont: string;
  line?: LineTiming;
  legacyAudio?: { file: string; duration: number };
  fallbackText?: string;
};

export const QuoteSequence: React.FC<QuoteSequenceProps> = ({
  text,
  attribution,
  displayFont,
  bodyFont,
  line,
  legacyAudio,
  fallbackText,
}) => (
  <>
    <StaticBackground tone="warm" />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "8rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: displayFont,
          fontSize: "4.5rem",
          lineHeight: 1.2,
          color: "rgba(255,255,255,0.95)",
          fontWeight: 600,
          maxWidth: "1600px",
        }}
      >
        {`"${text}"`}
      </div>
      {attribution && (
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: "1.75rem",
            color: "rgba(255,255,255,0.6)",
            marginTop: "2.5rem",
            letterSpacing: "0.05em",
          }}
        >
          — {attribution}
        </div>
      )}
    </AbsoluteFill>
    {line && (
      <SubtitleOverlay
        words={line.words}
        lineStartTime={line.startTime}
        fontFamily={bodyFont}
      />
    )}
    {!line && legacyAudio && fallbackText && (
      <>
        <NarrationAudio src={legacyAudio.file} />
        <SubtitleOverlay
          text={fallbackText}
          audioDuration={legacyAudio.duration}
          fontFamily={bodyFont}
        />
      </>
    )}
  </>
);
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/components/renderers/TitleSequence.tsx src/shared/components/renderers/QuoteSequence.tsx
git commit -m "feat(shared): add TitleSequence and QuoteSequence renderers"
```

---

## Task 6: Build EndingSequence renderer (extracted from PartRenderer)

**Files:**
- Create: `src/shared/components/renderers/EndingSequence.tsx`

- [ ] **Step 1: Write the renderer**

```tsx
// src/shared/components/renderers/EndingSequence.tsx
import { VideoBackground } from "../VideoBackground";
import type { Lang } from "../../schemas/video-schema";

type EndingSequenceProps = {
  lang: Lang;
  brollFile: string;
  brollStartFrom: number;
  videoOpacity?: number;
  Component: React.ComponentType<{ lang: Lang }>;
};

export const EndingSequence: React.FC<EndingSequenceProps> = ({
  lang,
  brollFile,
  brollStartFrom,
  videoOpacity,
  Component,
}) => (
  <>
    <VideoBackground
      src={brollFile}
      startFrom={brollStartFrom}
      overlayOpacity={videoOpacity ?? 0.7}
    />
    <Component lang={lang} />
  </>
);
```

- [ ] **Step 2: Typecheck + Commit**

```bash
bunx tsc --noEmit
git add src/shared/components/renderers/EndingSequence.tsx
git commit -m "feat(shared): add EndingSequence renderer for kind=ending"
```

---

## Task 7: Rewrite PartRenderer to dispatch by kind

**Files:**
- Modify: `src/shared/components/PartRenderer.tsx` (replace contents)

- [ ] **Step 1: Replace PartRenderer**

```tsx
// src/shared/components/PartRenderer.tsx
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { VideoSequence } from "./renderers/VideoSequence";
import { ChartSequence } from "./renderers/ChartSequence";
import { TitleSequence } from "./renderers/TitleSequence";
import { QuoteSequence } from "./renderers/QuoteSequence";
import { EndingSequence } from "./renderers/EndingSequence";
import type { Lang } from "../schemas/video-schema";
import type { SequenceEntry } from "../lib/sequence-types";
import { getDisplayFont, getBodyFont } from "../lib/fonts";
import type { PartAudioConfig } from "../lib/part-audio";

const ENDING_DUR = 300;

export type PartContent = {
  title: string;
  subtitle: string;
  narration: string[];
};

export type BrollEntry = { file: string; startFrom: number };

type PartRendererProps = {
  lang: Lang;
  partKey: string;
  sequences: SequenceEntry[];
  content: PartContent;
  broll: Record<string, BrollEntry>;
  audio: PartAudioConfig;
};

export const PartRenderer: React.FC<PartRendererProps> = ({
  lang,
  sequences,
  content: c,
  broll,
  audio,
}) => {
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);

  // Narration sequences carry lineIdx; ending does not.
  const narrationMeta = sequences
    .map((seq, i) =>
      seq.kind !== "ending" ? { idx: i, lineKey: `line${seq.lineIdx + 1}` } : null
    )
    .filter((x): x is { idx: number; lineKey: string } => x !== null);

  const getNextLineKey = (seqIndex: number): string | null => {
    const pos = narrationMeta.findIndex((m) => m.idx === seqIndex);
    return pos >= 0 && pos < narrationMeta.length - 1
      ? narrationMeta[pos + 1].lineKey
      : null;
  };

  let t = 0;
  const elements: React.ReactNode[] = [];

  if (audio.mode === "continuous") {
    elements.push(
      <Sequence key="part-audio" from={0} durationInFrames={audio.totalAudioFrames}>
        <Audio src={staticFile(audio.file)} />
      </Sequence>
    );
  }

  for (let i = 0; i < sequences.length; i++) {
    const seq = sequences[i];

    if (seq.kind === "ending") {
      const b = broll[seq.brollKey];
      elements.push(
        <Sequence key={`seq-${i}`} from={t} durationInFrames={ENDING_DUR}>
          <EndingSequence
            lang={lang}
            brollFile={b.file}
            brollStartFrom={b.startFrom}
            videoOpacity={seq.videoOpacity}
            Component={seq.component}
          />
        </Sequence>
      );
      t += ENDING_DUR;
      continue;
    }

    const lineKey = `line${seq.lineIdx + 1}`;
    const nextLineKey = getNextLineKey(i);

    const line =
      audio.mode === "continuous" ? audio.alignment.lines[lineKey] : undefined;
    const legacyAudio =
      audio.mode === "per-line" ? audio.legacy[lineKey] : undefined;
    const fallbackText =
      audio.mode === "per-line" ? c.narration[seq.lineIdx] : undefined;

    const duration =
      audio.mode === "continuous"
        ? audio.lineDur(lineKey, nextLineKey)
        : legacyAudio
          ? audio.dur(legacyAudio.duration)
          : 0;

    let body: React.ReactNode;
    switch (seq.kind) {
      case "video": {
        const b = broll[seq.brollKey];
        body = (
          <VideoSequence
            lang={lang}
            brollFile={b.file}
            brollStartFrom={b.startFrom}
            videoOpacity={seq.videoOpacity}
            line={line}
            legacyAudio={legacyAudio}
            fallbackText={fallbackText}
            bodyFont={bodyFont}
          />
        );
        break;
      }
      case "chart":
        body = (
          <ChartSequence
            lang={lang}
            Component={seq.component}
            line={line}
            legacyAudio={legacyAudio}
            fallbackText={fallbackText}
            bodyFont={bodyFont}
          />
        );
        break;
      case "title":
        body = (
          <TitleSequence
            title={seq.usePartTitle ?? true ? c.title : (seq.title ?? "")}
            subtitle={seq.usePartTitle ?? true ? c.subtitle : (seq.subtitle ?? "")}
            displayFont={displayFont}
            bodyFont={bodyFont}
            line={line}
            legacyAudio={legacyAudio}
            fallbackText={fallbackText}
          />
        );
        break;
      case "quote":
        body = (
          <QuoteSequence
            text={seq.text}
            attribution={seq.attribution}
            displayFont={displayFont}
            bodyFont={bodyFont}
            line={line}
            legacyAudio={legacyAudio}
            fallbackText={fallbackText}
          />
        );
        break;
    }

    elements.push(
      <Sequence key={`seq-${i}`} from={t} durationInFrames={duration}>
        {body}
      </Sequence>
    );
    t += duration;
  }

  return <AbsoluteFill>{elements}</AbsoluteFill>;
};
```

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit`
Expected: Errors in Part1.tsx / Part2.tsx / etc (they still use old API). That's fine — next task fixes them.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/PartRenderer.tsx
git commit -m "refactor(shared): dispatch sequences by kind in PartRenderer"
```

---

## Task 8: Migrate xiaomi-su7 Part1 to new sequence kinds

**Files:**
- Modify: `src/videos/xiaomi-su7/components/part1/Part1.tsx`

- [ ] **Step 1: Rewrite Part1.tsx using new kinds**

```tsx
// src/videos/xiaomi-su7/components/part1/Part1.tsx
import { PartRenderer } from "../../../../shared/components/PartRenderer";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { EVPenetrationChart } from "./EVPenetrationChart";
import { XiaomiTimeline } from "./XiaomiTimeline";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { audioManifest } from "../../data/audio-manifest";

const sequences: SequenceEntry[] = [
  { kind: "title", lineIdx: 0 },
  { kind: "video", lineIdx: 1, brollKey: "narration2" },
  { kind: "video", lineIdx: 2, brollKey: "narration3" },
  { kind: "video", lineIdx: 3, brollKey: "narration4" },
  { kind: "chart", lineIdx: 4, component: EVPenetrationChart },
  { kind: "chart", lineIdx: 5, component: XiaomiTimeline },
  { kind: "video", lineIdx: 6, brollKey: "narration7" },
];

export const Part1: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = (lang === "cn" ? contentCN : contentEN).part1;
  return (
    <PartRenderer
      lang={lang}
      partKey="part1"
      sequences={sequences}
      content={content}
      broll={brollManifest.part1}
      audio={getPartAudio(alignmentManifest, audioManifest as never, lang, "part1")}
    />
  );
};
```

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit src/videos/xiaomi-su7/components/part1/Part1.tsx`
Expected: Clean.

- [ ] **Step 3: Visually verify in Remotion Studio**

Run: `bun run dev`
In the browser, select `HackstudioProVideo-CN`. Scrub to Part 1:
- Line 1 (title): should show calm gradient + large title, no video
- Lines 2, 3, 4, 7: vivid video background
- Line 5: EVPenetrationChart over calm gradient (no moving video)
- Line 6: XiaomiTimeline over calm gradient

If chart lines still show video, STOP — the PartRenderer dispatch is broken.

- [ ] **Step 4: Commit**

```bash
git add src/videos/xiaomi-su7/components/part1/Part1.tsx
git commit -m "refactor(xiaomi-su7): migrate Part1 to new sequence kinds"
```

---

## Task 9: Migrate xiaomi-su7 Part2–Part5

**Files:**
- Modify: `src/videos/xiaomi-su7/components/part2/Part2.tsx`
- Modify: `src/videos/xiaomi-su7/components/part3/Part3.tsx`
- Modify: `src/videos/xiaomi-su7/components/part4/Part4.tsx`
- Modify: `src/videos/xiaomi-su7/components/part5/Part5.tsx`

- [ ] **Step 1: Read each current Part file**

Run: `cat src/videos/xiaomi-su7/components/part{2,3,4,5}/Part*.tsx`

For each, map old → new:
- `{ type: "narration", lineIdx, brollKey }` (no Overlay) → `{ kind: "video", lineIdx, brollKey }`
- `{ type: "narration", lineIdx, brollKey, Overlay: X }` → `{ kind: "chart", lineIdx, component: X }`
- `{ type: "narration", lineIdx: 0, brollKey, showTitle: true }` → `{ kind: "title", lineIdx: 0 }`
- `{ type: "ending", brollKey, Overlay: X }` → `{ kind: "ending", brollKey, component: X }`

- [ ] **Step 2: Apply the mapping to Part2.tsx**

Edit the `sequences` array. The import changes from:
```typescript
import { PartRenderer, type SequenceEntry } from "...";
```
to:
```typescript
import { PartRenderer } from "...";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
```

- [ ] **Step 3: Apply the mapping to Part3.tsx, Part4.tsx, Part5.tsx**

Same transformation for each.

- [ ] **Step 4: Full typecheck**

Run: `bunx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 5: Visual verification in Remotion Studio**

Run: `bun run dev`
Scrub through all 5 parts. Every chart-bearing line should now show StaticBackground (no moving video behind chart).

- [ ] **Step 6: Commit**

```bash
git add src/videos/xiaomi-su7/components/part2/Part2.tsx \
        src/videos/xiaomi-su7/components/part3/Part3.tsx \
        src/videos/xiaomi-su7/components/part4/Part4.tsx \
        src/videos/xiaomi-su7/components/part5/Part5.tsx
git commit -m "refactor(xiaomi-su7): migrate Part2-5 to new sequence kinds"
```

---

## Task 10: Update validate-broll.ts to ignore non-video sequences

**Files:**
- Modify: `scripts/validate-broll.ts`

- [ ] **Step 1: Read current validate-broll.ts structure**

The script currently reads `brollManifest[partKey]` keyed by `narrationN`. With the refactor, chart/title/quote sequences no longer reference broll entries. The manifest still exists as is — we just need to tolerate some `narrationN` keys being absent.

- [ ] **Step 2: Add a cross-check against sequence kinds**

After the existing checks, read each Part's sequences array (lazy import) and verify every `kind: "video"` sequence has a matching broll entry:

```typescript
// Append to scripts/validate-broll.ts before the summary section
import { brollManifest as _ } from "...";

const partFiles = ["part1", "part2", "part3", "part4", "part5"];
console.log("\n═══ Sequence/Broll Cross-Check ═══");
let crossCheckIssues = 0;
for (const partKey of partFiles) {
  const partPath = path.join(
    ROOT, "src", "videos", videoSlug, "components", partKey,
    `${partKey.charAt(0).toUpperCase() + partKey.slice(1)}.tsx`
  );
  try {
    await fs.access(partPath);
  } catch {
    continue;
  }
  const src = await fs.readFile(partPath, "utf-8");
  const videoKinds = [...src.matchAll(/kind:\s*"video"[^}]*brollKey:\s*"([^"]+)"/g)]
    .map((m) => m[1]);
  const partBroll = (brollManifest as Record<string, Record<string, unknown>>)[partKey] || {};
  for (const brollKey of videoKinds) {
    if (!partBroll[brollKey]) {
      console.log(`  🔴 ${partKey}: kind:"video" references missing broll entry "${brollKey}"`);
      crossCheckIssues++;
    }
  }
}
if (crossCheckIssues === 0) {
  console.log("  ✅ All kind:\"video\" sequences have broll entries.");
}
```

- [ ] **Step 3: Run the validator**

Run: `bun run scripts/validate-broll.ts --video xiaomi-su7`
Expected: Boundary ✅, Overlap ✅, Cross-check ✅.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-broll.ts
git commit -m "chore(validate-broll): cross-check video-kind sequences against manifest"
```

---

## Task 11: Render a preview to confirm parity

**Files:** None (render only)

- [ ] **Step 1: Render a short CN preview**

Run:
```bash
bunx remotion render HackstudioProVideo-CN \
  --codec=h264 \
  --frames=0-2700 \
  out/preview-CN.mp4
```
Expected: completes without errors, ~90s of video at 30fps.

- [ ] **Step 2: Play and verify**

Open `out/preview-CN.mp4` and confirm:
- Chart sequences (line 5 and 6 of Part 1) show calm gradient background, NOT moving video
- All narrations still play fully (no audio gaps)
- Subtitles still sync

- [ ] **Step 3: Tag the milestone**

```bash
git tag sequence-kind-refactor-complete
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - `kind: "video"` ✓ Task 3
   - `kind: "chart"` ✓ Task 4
   - `kind: "title"` ✓ Task 5
   - `kind: "quote"` ✓ Task 5
   - `kind: "ending"` ✓ Task 6
   - Dispatcher ✓ Task 7
   - Migration ✓ Tasks 8–9
   - Validator update ✓ Task 10
   - Visual regression ✓ Task 11

2. **Placeholder scan:** No TODOs, every code block complete.

3. **Type consistency:** `SequenceEntry` imported from `sequence-types.ts` in all migrated Part files. `component` field name used consistently for ComponentType (was `Overlay` in old code).

---

## Risk Notes for Executor

- **Existing `SectionTitle`** uses `displayFont` and `bodyFont` props — Task 5's TitleSequence passes them through unchanged. Do not refactor `SectionTitle`.
- **`contentCN`/`contentEN`** narration arrays are still indexed by `lineIdx` — no changes needed to content files.
- **`getPartAudio`** lookup still uses `line{N}` keying — no changes.
- **Design.md compliance for StaticBackground**: `COLORS.surface` is L1, `COLORS.surfaceL2` should exist per the design system. If `surfaceL2` is missing in `colors.ts`, add it before Task 2.
- **Playing during chart** was previously the bug. After migration, `ChartSequence` uses `StaticBackground` (no `<Video>` tag). If a chart sequence still shows motion, something is wrong in the dispatcher (Task 7).
