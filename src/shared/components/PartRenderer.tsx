/**
 * Data-driven Part renderer.
 *
 * Each Part passes a sequence config describing its narration order.
 * Title/subtitle appears as a fade-in/fade-out overlay on the FIRST narration
 * line — never as a separate silent sequence. The narration never stops flowing.
 *
 * The renderer handles both audio modes (MiniMax continuous / edge-tts per-line).
 */

import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { SectionTitle } from "./SectionTitle";
import { VideoBackground } from "./VideoBackground";
import { NarrationAudio } from "./NarrationAudio";
import { SubtitleOverlay } from "./SubtitleOverlay";
import type { Lang } from "../schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../lib/fonts";
import type { PartAudioConfig } from "../lib/part-audio";

// ── Sequence config types ────────────────────────

export type SequenceEntry =
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
      /** Show part title overlay on this narration (typically first line) */
      showTitle?: boolean;
    }
  | {
      type: "ending";
      brollKey: string;
      Overlay: React.ComponentType<{ lang: Lang }>;
      overlayOpacity?: number;
    };

// ── Constants ────────────────────────────────────

const ENDING_DUR = 300;

// ── Component ────────────────────────────────────

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
  partKey,
  sequences,
  content: c,
  broll,
  audio,
}) => {
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);

  // ── Pre-compute narration line keys for duration lookups ──
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

  // Continuous mode: single Audio at part level, starts immediately (no title gap)
  if (audio.mode === "continuous") {
    elements.push(
      <Sequence key="part-audio" from={0} durationInFrames={audio.totalAudioFrames}>
        <Audio src={staticFile(audio.file)} />
      </Sequence>
    );
  }

  for (let i = 0; i < sequences.length; i++) {
    const seq = sequences[i];

    // ── Ending (last sequence, over narration audio that's still playing) ──
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

    // ── Narration (with optional title overlay + animation overlay) ──
    const lineKey = `line${seq.lineIdx + 1}`;
    const nextLineKey = getNextLineKey(i);
    const b = broll[seq.brollKey];

    // Compute video dim level:
    //   - Explicit overlayOpacity from sequence config takes priority
    //   - Overlay or title present → dim to 0.7 for readability
    //   - Plain narration → undefined (VideoBackground default 0.25, vivid video)
    const hasVisualOverlay = !!(seq.Overlay || seq.showTitle);
    const effectiveOpacity = seq.overlayOpacity ?? (hasVisualOverlay ? 0.7 : undefined);

    if (audio.mode === "continuous") {
      const line = audio.alignment.lines[lineKey];
      const duration = audio.lineDur(lineKey, nextLineKey);

      elements.push(
        <Sequence key={`seq-${i}`} from={t} durationInFrames={duration}>
          <VideoBackground
            src={b.file}
            startFrom={b.startFrom}
            overlayOpacity={effectiveOpacity}
          />
          {seq.Overlay && <seq.Overlay lang={lang} />}
          {seq.showTitle && (
            <SectionTitle
              title={c.title}
              subtitle={c.subtitle}
              displayFont={displayFont}
              bodyFont={bodyFont}
            />
          )}
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
            overlayOpacity={effectiveOpacity}
          />
          {seq.Overlay && <seq.Overlay lang={lang} />}
          {seq.showTitle && (
            <SectionTitle
              title={c.title}
              subtitle={c.subtitle}
              displayFont={displayFont}
              bodyFont={bodyFont}
            />
          )}
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
