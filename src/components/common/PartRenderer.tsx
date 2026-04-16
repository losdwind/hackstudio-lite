/**
 * Data-driven Part renderer.
 *
 * Each Part (1–4) becomes a thin config describing its sequence order:
 *   title → narration lines (some with animation overlays) → optional ending.
 *
 * The renderer handles both audio modes (MiniMax continuous / edge-tts per-line)
 * in one place, eliminating duplicated logic across Part files.
 */

import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { SectionTitle } from "./SectionTitle";
import { VideoBackground } from "./VideoBackground";
import { NarrationAudio } from "./NarrationAudio";
import { SubtitleOverlay } from "./SubtitleOverlay";
import type { Lang } from "../../schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { getPartAudio } from "../../lib/part-audio";

// ── Sequence config types ────────────────────────

export type SequenceEntry =
  | { type: "title" }
  | {
      type: "narration";
      /** Index into content.narration[] (0-based) */
      lineIdx: number;
      /** Key in brollManifest[partKey] */
      brollKey: string;
      /** Optional animation component rendered over the broll */
      Overlay?: React.ComponentType<{ lang: Lang }>;
      /** Override overlay darkness (default 0.7, use 0.8+ when Overlay present) */
      overlayOpacity?: number;
    }
  | {
      type: "ending";
      brollKey: string;
      Overlay: React.ComponentType<{ lang: Lang }>;
      overlayOpacity?: number;
    };

// ── Constants ────────────────────────────────────

const TITLE_DUR = 120;
const ENDING_DUR = 300;

// ── Component ────────────────────────────────────

type PartRendererProps = {
  lang: Lang;
  partKey: string;
  sequences: SequenceEntry[];
};

export const PartRenderer: React.FC<PartRendererProps> = ({
  lang,
  partKey,
  sequences,
}) => {
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);

  const contentAll = lang === "cn" ? contentCN : contentEN;
  const c = contentAll[partKey as keyof typeof contentAll] as {
    title: string;
    subtitle: string;
    narration: string[];
  };

  const broll = brollManifest[partKey as keyof typeof brollManifest] as Record<
    string,
    { file: string; startFrom: number }
  >;

  const audio = getPartAudio(lang, partKey);

  // ── Pre-compute narration line keys for duration lookups ──
  // We need each narration's lineKey and the NEXT narration's lineKey
  // to compute gap-based durations in continuous mode.
  const narrationMeta = sequences
    .map((seq, i) => (seq.type === "narration" ? { idx: i, lineKey: `line${seq.lineIdx + 1}` } : null))
    .filter((x): x is { idx: number; lineKey: string } => x !== null);

  const getNextLineKey = (seqIndex: number): string | null => {
    const pos = narrationMeta.findIndex((m) => m.idx === seqIndex);
    return pos >= 0 && pos < narrationMeta.length - 1
      ? narrationMeta[pos + 1].lineKey
      : null;
  };

  // ── Build sequences ────────────────────────────
  let t = 0;
  const elements: React.ReactNode[] = [];

  // Continuous mode: single Audio at part level
  if (audio.mode === "continuous") {
    elements.push(
      <Sequence key="part-audio" from={TITLE_DUR} durationInFrames={audio.totalAudioFrames}>
        <Audio src={staticFile(audio.file)} />
      </Sequence>
    );
  }

  for (let i = 0; i < sequences.length; i++) {
    const seq = sequences[i];

    // ── Title ──
    if (seq.type === "title") {
      const b = broll.title;
      elements.push(
        <Sequence key={`seq-${i}`} from={t} durationInFrames={TITLE_DUR}>
          <VideoBackground src={b.file} startFrom={b.startFrom} />
          <SectionTitle
            title={c.title}
            subtitle={c.subtitle}
            displayFont={displayFont}
            bodyFont={bodyFont}
          />
        </Sequence>
      );
      t += TITLE_DUR;
      continue;
    }

    // ── Ending (no audio) ──
    if (seq.type === "ending") {
      const b = broll[seq.brollKey];
      elements.push(
        <Sequence key={`seq-${i}`} from={t} durationInFrames={ENDING_DUR}>
          <VideoBackground
            src={b.file}
            startFrom={b.startFrom}
            overlayOpacity={seq.overlayOpacity}
          />
          <seq.Overlay lang={lang} />
        </Sequence>
      );
      t += ENDING_DUR;
      continue;
    }

    // ── Narration (with optional animation overlay) ──
    const lineKey = `line${seq.lineIdx + 1}`;
    const nextLineKey = getNextLineKey(i);
    const b = broll[seq.brollKey];

    if (audio.mode === "continuous") {
      const line = audio.alignment.lines[lineKey];
      const duration = audio.lineDur(lineKey, nextLineKey);

      elements.push(
        <Sequence key={`seq-${i}`} from={t} durationInFrames={duration}>
          <VideoBackground
            src={b.file}
            startFrom={b.startFrom}
            overlayOpacity={seq.overlayOpacity}
          />
          {seq.Overlay && <seq.Overlay lang={lang} />}
          {line && (
            <SubtitleOverlay
              words={line.words}
              lineStartTime={line.startTime}
              fontFamily={bodyFont}
            />
          )}
        </Sequence>
      );
      t += duration;
    } else {
      const a = audio.legacy[lineKey];
      const duration = audio.dur(a.duration);

      elements.push(
        <Sequence key={`seq-${i}`} from={t} durationInFrames={duration}>
          <VideoBackground
            src={b.file}
            startFrom={b.startFrom}
            overlayOpacity={seq.overlayOpacity}
          />
          {seq.Overlay && <seq.Overlay lang={lang} />}
          <NarrationAudio src={a.file} />
          <SubtitleOverlay
            text={c.narration[seq.lineIdx]}
            audioDuration={a.duration}
            fontFamily={bodyFont}
          />
        </Sequence>
      );
      t += duration;
    }
  }

  return <AbsoluteFill>{elements}</AbsoluteFill>;
};
