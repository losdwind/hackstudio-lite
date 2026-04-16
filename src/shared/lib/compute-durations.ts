import type { PartAlignment } from "./alignment-types";
import type { Lang } from "../schemas/video-schema";

const FPS = 30;
const PAD = 30;
const ENDING_DURATION = 300;
const PART_KEYS = ["part1", "part2", "part3", "part4", "part5"] as const;

function dur(seconds: number): number {
  return Math.ceil(seconds * FPS) + PAD;
}

/**
 * Compute total frames for each part.
 *
 * Data is passed in so this module stays video-agnostic.
 * Supports any number of parts found in the alignment manifest.
 * The last part with alignment data gets the ending duration.
 */
export function computePartFrames(
  alignmentManifest: Record<string, Record<string, PartAlignment>> | null,
  audioManifest: Record<string, Record<string, Record<string, { duration: number }>>> | null,
  lang: Lang
): Record<string, number> {
  const alignment = alignmentManifest?.[lang];

  if (alignment && Object.keys(alignment).length > 0) {
    const presentKeys = PART_KEYS.filter(
      (k) => alignment[k] && alignment[k].totalDuration > 0
    );
    const lastKey = presentKeys[presentKeys.length - 1];

    const result: Record<string, number> = {};
    for (const key of PART_KEYS) {
      const part = alignment[key];
      if (!part || part.totalDuration <= 0) {
        result[key] = 0;
        continue;
      }
      const isLast = key === lastKey;
      result[key] =
        Math.ceil(part.totalDuration * FPS) +
        PAD +
        (isLast ? ENDING_DURATION : 0);
    }
    return result;
  }

  // Legacy mode fallback: per-line audio manifest
  const a = audioManifest?.[lang];
  if (!a) {
    return Object.fromEntries(PART_KEYS.map((k) => [k, 0]));
  }

  const result: Record<string, number> = {};
  for (const key of PART_KEYS) {
    const partData = a[key];
    if (!partData) {
      result[key] = 0;
      continue;
    }
    const lineKeys = Object.keys(partData).sort();
    const isLast = key === PART_KEYS[PART_KEYS.length - 1];
    result[key] =
      lineKeys.reduce((sum, lk) => sum + dur(partData[lk].duration), 0) +
      (isLast ? ENDING_DURATION : 0);
  }
  return result;
}

export function computeTotalFrames(
  alignmentManifest: Record<string, Record<string, PartAlignment>> | null,
  audioManifest: Record<string, Record<string, Record<string, { duration: number }>>> | null,
  lang: Lang
): number {
  const parts = computePartFrames(alignmentManifest, audioManifest, lang);
  const transitionFrames = 15;
  const partValues = PART_KEYS.map((k) => parts[k] || 0).filter((v) => v > 0);
  const transitions = Math.max(0, partValues.length - 1) * transitionFrames;
  return partValues.reduce((sum, v) => sum + v, 0) - transitions;
}
