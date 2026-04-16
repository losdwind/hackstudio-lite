import { alignmentManifest } from "../data/alignment-manifest";
import { audioManifest } from "../data/audio-manifest";
import type { Lang } from "../schemas/video-schema";

const FPS = 30;
const PAD = 30;
const TITLE_DURATION = 120;
const ENDING_DURATION = 300;

function dur(seconds: number): number {
  return Math.ceil(seconds * FPS) + PAD;
}

/**
 * Compute total frames for each part.
 *
 * Prefers alignment manifest (MiniMax per-part audio) over legacy
 * audio manifest (edge-tts per-line audio). Falls back automatically.
 */
export function computePartFrames(lang: Lang) {
  const alignment = alignmentManifest?.[lang];

  // ── Continuous mode (MiniMax alignment data available) ──
  if (alignment && Object.keys(alignment).length > 0) {
    const partFrames = (partKey: string, hasEnding = false) => {
      const part = alignment[partKey];
      if (!part || part.totalDuration <= 0) return 0;
      return (
        TITLE_DURATION +
        Math.ceil(part.totalDuration * FPS) +
        PAD +
        (hasEnding ? ENDING_DURATION : 0)
      );
    };

    return {
      part1: partFrames("part1"),
      part2: partFrames("part2"),
      part3: partFrames("part3"),
      part4: partFrames("part4", true),
    };
  }

  // ── Legacy mode (per-line audio manifest) ──
  const a = audioManifest[lang];

  const part1 =
    TITLE_DURATION +
    dur(a.part1.line1.duration) +
    dur(a.part1.line2.duration) +
    dur(a.part1.line3.duration) +
    dur(a.part1.line4.duration) +
    dur(a.part1.line5.duration) +
    dur(a.part1.line6.duration);

  const part2 =
    TITLE_DURATION +
    dur(a.part2.line1.duration) +
    dur(a.part2.line2.duration) +
    dur(a.part2.line3.duration) +
    dur(a.part2.line4.duration) +
    dur(a.part2.line5.duration) +
    dur(a.part2.line6.duration);

  const part3 =
    TITLE_DURATION +
    dur(a.part3.line1.duration) +
    dur(a.part3.line2.duration) +
    dur(a.part3.line3.duration) +
    dur(a.part3.line4.duration) +
    dur(a.part3.line5.duration) +
    dur(a.part3.line6.duration);

  const part4 =
    TITLE_DURATION +
    dur(a.part4.line1.duration) +
    dur(a.part4.line2.duration) +
    dur(a.part4.line3.duration) +
    dur(a.part4.line4.duration) +
    dur(a.part4.line5.duration) +
    ENDING_DURATION;

  return { part1, part2, part3, part4 };
}

export function computeTotalFrames(lang: Lang): number {
  const parts = computePartFrames(lang);
  const transitionFrames = 15;
  return (
    parts.part1 + parts.part2 + parts.part3 + parts.part4 -
    3 * transitionFrames
  );
}
