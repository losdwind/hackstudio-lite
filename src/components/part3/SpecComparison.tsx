import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { SPRING_SMOOTH, SPRING_SNAPPY, STAGGER_SLOW } from "../../lib/timing";
import { specComparisonData } from "../../data/chart-data";
import type { Lang } from "../../schemas/video-schema";
import { getFontFamily } from "../../lib/fonts";

type Props = { lang: Lang };

export const SpecComparison: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontFamily = getFontFamily(lang);
  const title = lang === "cn" ? "SU7 vs Model 3" : "SU7 vs Model 3";

  // Cards slide in from sides
  const su7Entrance = spring({ frame, fps, delay: 10, config: SPRING_SNAPPY });
  const m3Entrance = spring({ frame, fps, delay: 20, config: SPRING_SNAPPY });

  const su7X = interpolate(su7Entrance, [0, 1], [-400, 0]);
  const m3X = interpolate(m3Entrance, [0, 1], [400, 0]);

  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          fontSize: 52,
          fontWeight: 900,
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
        {/* SU7 Card */}
        <div
          style={{
            width: 420,
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            border: `2px solid ${COLORS.xiaomiOrange}`,
            padding: "30px 40px",
            transform: `translateX(${su7X}px)`,
            opacity: su7Entrance,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: COLORS.xiaomiOrange,
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            Xiaomi SU7
          </div>

          {specComparisonData.map((row, i) => {
            const rowDelay = 40 + i * STAGGER_SLOW;
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
                  padding: "12px 0",
                  borderBottom: `1px solid rgba(255,255,255,0.06)`,
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

        {/* Model 3 Card */}
        <div
          style={{
            width: 420,
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            border: `2px solid ${COLORS.accentBlue}`,
            padding: "30px 40px",
            transform: `translateX(${m3X}px)`,
            opacity: m3Entrance,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: COLORS.accentBlue,
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            Tesla Model 3
          </div>

          {specComparisonData.map((row, i) => {
            const rowDelay = 40 + i * STAGGER_SLOW;
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
                  padding: "12px 0",
                  borderBottom: `1px solid rgba(255,255,255,0.06)`,
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
