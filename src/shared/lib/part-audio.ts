/**
 * Helper for Part components to select audio mode:
 *   - "continuous": MiniMax alignment manifest (per-part audio, word timestamps)
 *   - "per-line":   Legacy audio manifest (per-line audio, even-distribution captions)
 *
 * Components check `mode` and render accordingly.
 *
 * Data is passed in — this module doesn't import any video-specific manifests.
 */

import type { PartAlignment } from "./alignment-types";

const FPS = 30;
const PAD = 30;

type ContinuousAudio = {
  mode: "continuous";
  /** Path relative to public/ for the full part audio file */
  file: string;
  /** Total audio duration in seconds */
  totalDuration: number;
  /** Full alignment data including per-line word timestamps */
  alignment: PartAlignment;
  /** Compute frame duration for a line (gap to next line's start) */
  lineDur: (lineKey: string, nextLineKey: string | null) => number;
  /** Total audio frames (for the Audio Sequence wrapper) */
  totalAudioFrames: number;
};

type PerLineAudio = {
  mode: "per-line";
  /** Legacy audio manifest for this part */
  legacy: Record<string, { file: string; duration: number }>;
  /** Legacy duration helper: ceil(seconds * FPS) + PAD */
  dur: (seconds: number) => number;
};

export type PartAudioConfig = ContinuousAudio | PerLineAudio;

export function getPartAudio(
  alignmentManifest: Record<string, Record<string, PartAlignment>> | null,
  audioManifest: Record<string, Record<string, unknown>> | null,
  lang: string,
  partKey: string
): PartAudioConfig {
  const alignment = alignmentManifest?.[lang]?.[partKey];

  if (alignment && alignment.totalDuration > 0) {
    return {
      mode: "continuous",
      file: alignment.file,
      totalDuration: alignment.totalDuration,
      alignment,
      totalAudioFrames: Math.ceil(alignment.totalDuration * FPS) + PAD,
      lineDur: (lineKey: string, nextLineKey: string | null) => {
        const line = alignment.lines[lineKey];
        if (!line) return PAD;
        if (nextLineKey && alignment.lines[nextLineKey]) {
          return Math.ceil(
            (alignment.lines[nextLineKey].startTime - line.startTime) * FPS
          );
        }
        return (
          Math.ceil((alignment.totalDuration - line.startTime) * FPS) + PAD
        );
      },
    };
  }

  const legacyPart = (audioManifest as Record<string, Record<string, unknown>>)?.[lang]?.[
    partKey
  ] as Record<string, { file: string; duration: number }> | undefined;

  return {
    mode: "per-line",
    legacy: legacyPart ?? {},
    dur: (seconds: number) => Math.ceil(seconds * FPS) + PAD,
  };
}
