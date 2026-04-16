import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { COLORS, GRADIENTS } from "../lib/colors";
import { SPRING_SMOOTH } from "../lib/timing";

type SectionTitleProps = {
  title: string;
  subtitle: string;
  displayFont?: string;
  bodyFont?: string;
};

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  displayFont,
  bodyFont,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Hold for ~3s, then fade out over ~1s
  const HOLD_END = Math.round(3 * fps);
  const FADE_OUT_END = Math.round(4 * fps);

  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });
  const subtitleProgress = spring({
    frame,
    fps,
    delay: 10,
    config: SPRING_SMOOTH,
  });

  // Auto-fade-out: title disappears after ~3s so it doesn't block the narration
  const fadeOut = interpolate(
    frame,
    [HOLD_END, FADE_OUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]) * fadeOut;
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]) * fadeOut;
  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);

  // Gradient accent line (primary CTA gradient, not a solid border)
  const lineWidth = interpolate(titleProgress, [0, 1], [0, 120]);
  const lineOpacity = fadeOut;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Gradient accent — no solid borders per "No-Line Rule" */}
        <div
          style={{
            width: lineWidth,
            height: 4,
            background: GRADIENTS.primaryCTA,
            borderRadius: 2,
            opacity: lineOpacity,
          }}
        />
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            fontFamily: displayFont,
            letterSpacing: "-0.02em",
            color: COLORS.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
            margin: 0,
            lineHeight: 1.2,
            maxWidth: 1400,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 36,
            fontWeight: 400,
            fontFamily: bodyFont,
            color: COLORS.secondary,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
