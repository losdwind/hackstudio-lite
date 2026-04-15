import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
  Easing,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { SPRING_SMOOTH, STAGGER_SLOW } from "../../lib/timing";
import { salesData } from "../../data/chart-data";
import type { Lang } from "../../schemas/video-schema";
import { getFontFamily } from "../../lib/fonts";

type Props = { lang: Lang };

const BAR_MAX_WIDTH = 700;

export const SalesCounter: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontFamily = getFontFamily(lang);

  const title =
    lang === "cn" ? "27分钟的奇迹" : "The 27-Minute Miracle";
  const ordersLabel = lang === "cn" ? "订单数" : "Orders";
  const timeLabel = lang === "cn" ? "分钟" : "Minutes";

  // Counter accelerates using bezier easing
  const counterProgress = interpolate(frame, [20, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.0, 0.4, 1.0),
  });

  const currentOrders = Math.round(
    counterProgress * salesData.totalOrders,
  );
  const currentMinutes = Math.round(counterProgress * salesData.timeMinutes);

  // Pulse effect at completion
  const isPulsing = frame >= 180 && frame <= 210;
  const pulseScale = isPulsing
    ? interpolate(frame, [180, 195, 210], [1, 1.08, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

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
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
        }}
      >
        {title}
      </div>

      {/* Counter section */}
      <div
        style={{
          display: "flex",
          gap: 100,
          marginTop: -60,
          marginBottom: 60,
        }}
      >
        {/* Orders counter */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: COLORS.xiaomiOrange,
              fontVariantNumeric: "tabular-nums",
              transform: `scale(${pulseScale})`,
              textShadow: isPulsing
                ? `0 0 40px ${COLORS.glow}`
                : "none",
            }}
          >
            {currentOrders.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: 24,
              color: COLORS.textSecondary,
              marginTop: 8,
            }}
          >
            {ordersLabel}
          </div>
        </div>

        {/* Timer */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: COLORS.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {currentMinutes}
          </div>
          <div
            style={{
              fontSize: 24,
              color: COLORS.textSecondary,
              marginTop: 8,
            }}
          >
            {timeLabel}
          </div>
        </div>
      </div>

      {/* Racing bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 20,
        }}
      >
        {salesData.competitors.map((comp, i) => {
          const delay = 30 + i * STAGGER_SLOW;
          const barProgress = spring({
            frame,
            fps,
            delay,
            config: SPRING_SMOOTH,
          });

          const maxOrders = salesData.totalOrders;
          const barWidth =
            barProgress * (comp.firstDayOrders / maxOrders) * BAR_MAX_WIDTH;

          return (
            <div
              key={comp.name.en}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 160,
                  textAlign: "right",
                  fontSize: 22,
                  fontWeight: 600,
                  color: comp.highlight
                    ? COLORS.xiaomiOrange
                    : COLORS.textSecondary,
                  opacity: interpolate(barProgress, [0, 0.3, 1], [0, 0, 1]),
                }}
              >
                {comp.name[lang]}
              </div>
              <div
                style={{
                  height: 36,
                  width: barWidth,
                  backgroundColor: comp.highlight
                    ? COLORS.xiaomiOrange
                    : COLORS.neutral,
                  borderRadius: "0 6px 6px 0",
                  boxShadow: comp.highlight
                    ? `0 0 16px ${COLORS.glow}`
                    : "none",
                }}
              />
              <div
                style={{
                  fontSize: 20,
                  color: comp.highlight
                    ? COLORS.xiaomiOrange
                    : COLORS.textMuted,
                  opacity: interpolate(barProgress, [0, 0.5, 1], [0, 0, 1]),
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(
                  barProgress * comp.firstDayOrders,
                ).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
