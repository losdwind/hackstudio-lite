import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { COLORS, GRADIENTS, SHADOWS } from "../../../../shared/lib/colors";
import { SPRING_SMOOTH, SPRING_SNAPPY, STAGGER_SLOW, useTimeScale } from "../../../../shared/lib/timing";
import { specComparisonData } from "../../data/chart-data";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../../../../shared/lib/fonts";

type Props = { lang: Lang };

export const SpecComparison: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { d } = useTimeScale(360);
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);
  const title = lang === "cn" ? "SU7 vs Model 3" : "SU7 vs Model 3";

  // Cards slide in from sides
  const su7Entrance = spring({ frame, fps, delay: d(10), config: SPRING_SNAPPY });
  const m3Entrance = spring({ frame, fps, delay: d(20), config: SPRING_SNAPPY });

  const su7X = interpolate(su7Entrance, [0, 1], [-400, 0]);
  const m3X = interpolate(m3Entrance, [0, 1], [400, 0]);

  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: bodyFont,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          fontSize: 52,
          fontWeight: 900,
          fontFamily: displayFont,
          color: COLORS.textPrimary,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
        }}
      >
        {title}
      </div>

      {/* Comparison cards container */}
      <div
        style={{
          display: "flex",
          gap: 60,
          marginTop: 40,
        }}
      >
        {/* SU7 Card — glassmorphism with left-edge gradient accent */}
        <div
          style={{
            width: 420,
            backgroundColor: COLORS.glassSurface,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 16,
            padding: "30px 40px",
            transform: `translateX(${su7X}px)`,
            opacity: su7Entrance,
            boxShadow: SHADOWS.primaryGlow,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Left-edge gradient accent */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              background: GRADIENTS.primaryCTA,
              borderRadius: "16px 0 0 16px",
            }}
          />
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontFamily: displayFont,
              color: COLORS.primaryContainer,
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            Xiaomi SU7
          </div>

          {specComparisonData.map((row, i) => {
            const rowDelay = d(40 + i * STAGGER_SLOW);
            const rowProgress = spring({
              frame,
              fps,
              delay: rowDelay,
              config: SPRING_SMOOTH,
            });

            return (
              <div
                key={row.label.en}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 8px",
                  borderRadius: 8,
                  backgroundColor:
                    i % 2 === 0
                      ? COLORS.surfaceContainerLow
                      : "transparent",
                  opacity: interpolate(rowProgress, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(rowProgress, [0, 1], [15, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 22, color: COLORS.textMuted }}>
                  {row.label[lang]}
                </span>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color:
                      row.winner === "su7"
                        ? COLORS.winner
                        : COLORS.textPrimary,
                  }}
                >
                  {row.su7.value}
                  {row.winner === "su7" ? " ✓" : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Model 3 Card — glassmorphism with left-edge gradient accent */}
        <div
          style={{
            width: 420,
            backgroundColor: COLORS.glassSurface,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 16,
            padding: "30px 40px",
            transform: `translateX(${m3X}px)`,
            opacity: m3Entrance,
            boxShadow: SHADOWS.nodeGlow,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Left-edge gradient accent */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              background: `linear-gradient(135deg, ${COLORS.tertiary}, ${COLORS.tertiaryBright})`,
              borderRadius: "16px 0 0 16px",
            }}
          />
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontFamily: displayFont,
              color: COLORS.tertiary,
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            Tesla Model 3
          </div>

          {specComparisonData.map((row, i) => {
            const rowDelay = d(40 + i * STAGGER_SLOW);
            const rowProgress = spring({
              frame,
              fps,
              delay: rowDelay,
              config: SPRING_SMOOTH,
            });

            return (
              <div
                key={row.label.en}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 8px",
                  borderRadius: 8,
                  backgroundColor:
                    i % 2 === 0
                      ? COLORS.surfaceContainerLow
                      : "transparent",
                  opacity: interpolate(rowProgress, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(rowProgress, [0, 1], [15, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 22, color: COLORS.textMuted }}>
                  {row.label[lang]}
                </span>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color:
                      row.winner !== "su7"
                        ? COLORS.winner
                        : COLORS.textPrimary,
                  }}
                >
                  {row.model3.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
