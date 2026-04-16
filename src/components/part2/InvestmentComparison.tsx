import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { COLORS, SHADOWS } from "../../lib/colors";
import { SPRING_SMOOTH, STAGGER_SLOW } from "../../lib/timing";
import { investmentData } from "../../data/chart-data";
import { AnimatedNumber } from "../common/AnimatedNumber";
import type { Lang } from "../../schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../../lib/fonts";

type Props = { lang: Lang };

const BAR_MAX_WIDTH = 900;
const BAR_HEIGHT = 60;
const BAR_GAP = 30;
const MAX_VALUE = 100;

export const InvestmentComparison: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);
  const title =
    lang === "cn" ? "造车投资规模对比（亿元）" : "Auto Investment (Billion CNY)";

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
          top: 120,
          fontSize: 48,
          fontWeight: 700,
          fontFamily: displayFont,
          color: COLORS.textPrimary,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
        }}
      >
        {title}
      </div>

      {/* Bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: BAR_GAP,
          marginTop: 40,
        }}
      >
        {investmentData.map((item, i) => {
          const delay = 15 + i * STAGGER_SLOW;
          const barProgress = spring({
            frame,
            fps,
            delay,
            config: SPRING_SMOOTH,
          });

          const barWidth =
            barProgress * (item.amount / MAX_VALUE) * BAR_MAX_WIDTH;

          return (
            <div
              key={item.company.en}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              {/* Company name */}
              <div
                style={{
                  width: 180,
                  textAlign: "right",
                  fontSize: 28,
                  fontWeight: 600,
                  color: item.highlight
                    ? COLORS.primaryContainer
                    : COLORS.secondary,
                  opacity: interpolate(barProgress, [0, 0.3, 1], [0, 0, 1]),
                }}
              >
                {item.company[lang]}
              </div>

              {/* Bar */}
              <div
                style={{
                  position: "relative",
                  height: BAR_HEIGHT,
                  width: barWidth,
                  backgroundColor: item.highlight
                    ? COLORS.primaryContainer
                    : COLORS.surfaceBright,
                  borderRadius: "0 12px 12px 0",
                  boxShadow: item.highlight
                    ? SHADOWS.primaryGlow
                    : "none",
                }}
              />

              {/* Value */}
              <div
                style={{
                  opacity: interpolate(barProgress, [0, 0.5, 1], [0, 0, 1]),
                }}
              >
                <AnimatedNumber
                  value={item.amount}
                  startFrame={delay}
                  durationFrames={40}
                  suffix={lang === "cn" ? "亿" : "B"}
                  fontSize={28}
                  color={
                    item.highlight
                      ? COLORS.primaryContainer
                      : COLORS.secondary
                  }
                  fontFamily={bodyFont}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
