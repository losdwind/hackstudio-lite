import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, GRADIENTS } from "../lib/colors";

type StaticBackgroundProps = {
  /** Preset tone. Default "calm" (surface gradient). */
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
      background: GRADIENTS.surfaceRadial,
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
