import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { SPRING_SMOOTH, STAGGER_DEFAULT } from "../../lib/timing";
import { evPenetrationData } from "../../data/chart-data";
import { AnimatedNumber } from "../common/AnimatedNumber";
import type { Lang } from "../../schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../../lib/fonts";

const BAR_WIDTH = 120;
const BAR_GAP = 40;
const CHART_HEIGHT = 500;
const MAX_VALUE = 50;
const Y_TICKS = [0, 10, 20, 30, 40, 50];

type Props = { lang: Lang };

export const EVPenetrationChart: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);
  const title = lang === "cn" ? "中国新能源车渗透率" : "China NEV Penetration Rate";

  const totalWidth =
    evPenetrationData.length * BAR_WIDTH +
    (evPenetrationData.length - 1) * BAR_GAP;

  // Title entrance
  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

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
          top: 80,
          fontSize: 48,
          fontWeight: 700,
          fontFamily: displayFont,
          color: COLORS.textPrimary,
          opacity: titleOpacity,
        }}
      >
        {title}
      </div>

      {/* Chart area */}
      <div
        style={{
          position: "relative",
          width: totalWidth + 80,
          height: CHART_HEIGHT + 100,
          marginTop: 60,
        }}
      >
        {/* Y-axis ticks */}
        {Y_TICKS.map((tick) => {
          const y = CHART_HEIGHT - (tick / MAX_VALUE) * CHART_HEIGHT;
          return (
            <div key={tick} style={{ position: "absolute", left: 0, top: y }}>
              <span
                style={{
                  position: "absolute",
                  right: totalWidth + 30,
                  fontSize: 20,
                  color: COLORS.textMuted,
                  transform: "translateY(-50%)",
                  whiteSpace: "nowrap",
                }}
              >
                {tick}%
              </span>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: totalWidth,
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              />
            </div>
          );
        })}

        {/* Bars */}
        {evPenetrationData.map((item, i) => {
          const delay = 15 + i * STAGGER_DEFAULT;
          const barProgress = spring({
            frame,
            fps,
            delay,
            config: SPRING_SMOOTH,
          });

          const barHeight = barProgress * (item.rate / MAX_VALUE) * CHART_HEIGHT;
          const x = i * (BAR_WIDTH + BAR_GAP);

          return (
            <div key={item.year}>
              {/* Bar */}
              <div
                style={{
                  position: "absolute",
                  left: x,
                  bottom: 60,
                  width: BAR_WIDTH,
                  height: barHeight,
                  backgroundColor: COLORS.chart[i],
                  borderRadius: "8px 8px 0 0",
                }}
              />
              {/* Value label */}
              <div
                style={{
                  position: "absolute",
                  left: x,
                  bottom: 60 + barHeight + 10,
                  width: BAR_WIDTH,
                  textAlign: "center",
                  opacity: interpolate(barProgress, [0, 0.5, 1], [0, 0, 1]),
                }}
              >
                <AnimatedNumber
                  value={item.rate}
                  startFrame={delay}
                  durationFrames={40}
                  suffix="%"
                  decimals={1}
                  fontSize={28}
                  color={COLORS.textPrimary}
                  fontFamily={bodyFont}
                />
              </div>
              {/* Year label */}
              <div
                style={{
                  position: "absolute",
                  left: x,
                  bottom: 20,
                  width: BAR_WIDTH,
                  textAlign: "center",
                  fontSize: 24,
                  color: COLORS.secondary,
                  opacity: interpolate(barProgress, [0, 0.3, 1], [0, 0, 1]),
                }}
              >
                {item.year}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
