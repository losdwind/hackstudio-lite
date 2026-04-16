import type { SpringConfig } from "remotion";
import { useVideoConfig } from "remotion";

/**
 * Scale animation keyframes to fit the actual sequence duration.
 *
 * Each overlay is designed at a certain frame count (e.g. 300 frames).
 * When placed inside a Sequence whose duration differs (driven by TTS audio),
 * all frame references need to scale proportionally.
 *
 * Usage:
 *   const { f, d } = useTimeScale(300); // designed for 300 frames
 *   interpolate(frame, [f(20), f(200)], [0, 1], ...);
 *   spring({ frame, fps, delay: d(30), ... });
 */
export function useTimeScale(designedDuration: number) {
  const { durationInFrames } = useVideoConfig();
  const scale = durationInFrames / designedDuration;
  return {
    /** Scale a frame number */
    f: (n: number) => Math.round(n * scale),
    /** Scale a delay value */
    d: (n: number) => Math.round(n * scale),
    scale,
  };
}

// Spring configs (partial — spring() accepts partials and fills defaults)
export const SPRING_SMOOTH: Partial<SpringConfig> = { damping: 200 };
export const SPRING_SNAPPY: Partial<SpringConfig> = { damping: 20, stiffness: 200 };
export const SPRING_BOUNCY: Partial<SpringConfig> = { damping: 8 };
export const SPRING_HEAVY: Partial<SpringConfig> = { damping: 15, stiffness: 80, mass: 2 };

// Stagger delays (in frames)
export const STAGGER_FAST = 3;
export const STAGGER_DEFAULT = 5;
export const STAGGER_SLOW = 8;
export const STAGGER_DRAMATIC = 15;

// Section durations (in seconds, multiply by fps for frames)
export const SECTION_DURATIONS = {
  part1: 150, // 2:30
  part2: 210, // 3:30
  part3: 210, // 3:30
  part4: 150, // 2:30
} as const;

// Animation durations (in seconds)
export const ANIM_DURATIONS = {
  evChart: 8,
  timeline: 10,
  talentFlow: 8,
  investment: 6,
  specComparison: 10,
  pricingBalance: 8,
  salesCounter: 8,
  ecosystem: 10,
  globalMap: 12,
  endingText: 8,
} as const;
