import type { SpringConfig } from "remotion";

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
