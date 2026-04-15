import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
  Easing,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { SPRING_SMOOTH, STAGGER_DRAMATIC } from "../../lib/timing";
import { xiaomiTimeline } from "../../data/chart-data";
import type { Lang } from "../../schemas/video-schema";
import { getFontFamily } from "../../lib/fonts";

type Props = { lang: Lang };

const DOT_SIZE = 20;
const LINE_Y = 540;

export const XiaomiTimeline: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const fontFamily = getFontFamily(lang);
  const title = lang === "cn" ? "小米发展历程" : "Xiaomi Milestones";

  const itemCount = xiaomiTimeline.length;
  const padding = 160;
  const usableWidth = width - padding * 2;
  const itemSpacing = usableWidth / (itemCount - 1);

  // Line draws over time
  const lineProgress = interpolate(frame, [20, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Title entrance
  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });

  return (
    <AbsoluteFill
      style={{
        fontFamily,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 100,
          width: "100%",
          textAlign: "center",
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
        }}
      >
        {title}
      </div>

      {/* Timeline line */}
      <div
        style={{
          position: "absolute",
          top: LINE_Y,
          left: padding,
          width: usableWidth * lineProgress,
          height: 3,
          backgroundColor: COLORS.xiaomiOrange,
          borderRadius: 2,
        }}
      />

      {/* Milestones */}
      {xiaomiTimeline.map((item, i) => {
        const x = padding + i * itemSpacing;
        const milestonePosition = i / (itemCount - 1);

        // Dot appears when line reaches it
        const dotVisible = lineProgress >= milestonePosition;
        const dotDelay = 20 + i * STAGGER_DRAMATIC;
        const dotProgress = spring({
          frame,
          fps,
          delay: dotDelay,
          config: SPRING_SMOOTH,
        });

        const isAbove = i % 2 === 0;
        const labelY = isAbove ? LINE_Y - 80 : LINE_Y + 50;
        const yearY = isAbove ? LINE_Y - 120 : LINE_Y + 90;

        return (
          <div key={item.year}>
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: x - DOT_SIZE / 2,
                top: LINE_Y - DOT_SIZE / 2,
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: "50%",
                backgroundColor: dotVisible
                  ? COLORS.xiaomiOrange
                  : "transparent",
                transform: `scale(${dotProgress})`,
                border: `2px solid ${COLORS.xiaomiOrange}`,
                boxShadow: dotVisible
                  ? `0 0 12px ${COLORS.glow}`
                  : "none",
              }}
            />

            {/* Connector line */}
            <div
              style={{
                position: "absolute",
                left: x,
                top: isAbove ? LINE_Y - 50 : LINE_Y + DOT_SIZE / 2 + 2,
                width: 1,
                height: interpolate(dotProgress, [0, 1], [0, 30]),
                backgroundColor: "rgba(255,255,255,0.2)",
              }}
            />

            {/* Year */}
            <div
              style={{
                position: "absolute",
                left: x - 40,
                top: yearY,
                width: 80,
                textAlign: "center",
                fontSize: 28,
                fontWeight: 900,
                color: COLORS.xiaomiOrange,
                opacity: interpolate(dotProgress, [0, 0.5, 1], [0, 0, 1]),
              }}
            >
              {item.year}
            </div>

            {/* Event label */}
            <div
              style={{
                position: "absolute",
                left: x - 80,
                top: labelY,
                width: 160,
                textAlign: "center",
                fontSize: 22,
                color: COLORS.textSecondary,
                opacity: interpolate(dotProgress, [0, 0.5, 1], [0, 0, 1]),
                transform: `translateY(${interpolate(dotProgress, [0, 1], [isAbove ? 10 : -10, 0])}px)`,
              }}
            >
              {item.event[lang]}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
