import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { SPRING_SMOOTH } from "../../lib/timing";

type SectionTitleProps = {
  title: string;
  subtitle: string;
  fontFamily?: string;
};

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });
  const subtitleProgress = spring({
    frame,
    fps,
    delay: 10,
    config: SPRING_SMOOTH,
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);

  // Line accent
  const lineWidth = interpolate(titleProgress, [0, 1], [0, 120]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: lineWidth,
            height: 4,
            backgroundColor: COLORS.xiaomiOrange,
            borderRadius: 2,
          }}
        />
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
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
            color: COLORS.textSecondary,
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
