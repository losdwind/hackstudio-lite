import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
  Easing,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { SPRING_SMOOTH, SPRING_BOUNCY } from "../../lib/timing";
import type { Lang } from "../../schemas/video-schema";
import { getFontFamily } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";

type Props = { lang: Lang };

const BEAM_WIDTH = 700;
const BEAM_Y = 450;
const PIVOT_X = 960; // center of 1920

export const PricingBalance: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontFamily = getFontFamily(lang);
  const content = lang === "cn" ? contentCN.part3 : contentEN.part3;

  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });

  // Phase 1 (0-90): Specs pile on left → tilt left (negative rotation)
  // Phase 2 (90-160): Price drops on right → tilt right
  // Phase 3 (160-240): Settle to equilibrium
  const phase1Tilt = interpolate(frame, [20, 80], [0, -8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  const phase2Tilt = interpolate(frame, [90, 140], [0, 14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const phase3Settle = interpolate(frame, [160, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  // Combine tilt phases
  let beamRotation: number;
  if (frame < 90) {
    beamRotation = phase1Tilt;
  } else if (frame < 160) {
    beamRotation = -8 + phase2Tilt;
  } else {
    beamRotation = interpolate(phase3Settle, [0, 1], [6, 0]);
  }

  // Spec items appear staggered
  const specItems = lang === "cn"
    ? ["续航 700km", "673匹马力", "2.78s百公里", "智能驾驶"]
    : ["700km Range", "673 HP", "2.78s 0-100", "Smart Drive"];

  // Price drop animation
  const priceDropProgress = spring({
    frame,
    fps,
    delay: 90,
    config: SPRING_BOUNCY,
  });

  const priceY = interpolate(priceDropProgress, [0, 1], [-200, 0]);
  const priceScale = interpolate(priceDropProgress, [0, 1], [0.5, 1]);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          textAlign: "center",
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
        }}
      >
        {content.balanceTitle}
      </div>

      {/* Balance pivot */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 15,
          top: BEAM_Y,
          width: 30,
          height: 200,
          background: `linear-gradient(to bottom, ${COLORS.textMuted}, transparent)`,
          borderRadius: "4px 4px 0 0",
        }}
      />

      {/* Pivot triangle */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 20,
          top: BEAM_Y - 10,
          width: 0,
          height: 0,
          borderLeft: "20px solid transparent",
          borderRight: "20px solid transparent",
          borderBottom: `20px solid ${COLORS.textMuted}`,
        }}
      />

      {/* Beam */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - BEAM_WIDTH / 2,
          top: BEAM_Y - 8,
          width: BEAM_WIDTH,
          height: 8,
          backgroundColor: COLORS.textSecondary,
          borderRadius: 4,
          transformOrigin: "center center",
          transform: `rotate(${beamRotation}deg)`,
        }}
      >
        {/* Left pan - Performance */}
        <div
          style={{
            position: "absolute",
            left: -20,
            top: -180,
            width: 200,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.accentBlue,
              textAlign: "center",
              marginBottom: 12,
              transform: `rotate(${-beamRotation}deg)`,
            }}
          >
            {content.balanceLeft}
          </div>
          {specItems.map((item, i) => {
            const itemDelay = 25 + i * 12;
            const itemProgress = spring({
              frame,
              fps,
              delay: itemDelay,
              config: SPRING_SMOOTH,
            });

            return (
              <div
                key={item}
                style={{
                  fontSize: 18,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  padding: "4px 12px",
                  backgroundColor: `rgba(59, 130, 246, ${0.15 * itemProgress})`,
                  borderRadius: 8,
                  marginBottom: 6,
                  opacity: interpolate(itemProgress, [0, 1], [0, 1]),
                  transform: `rotate(${-beamRotation}deg) translateY(${interpolate(itemProgress, [0, 1], [-20, 0])}px)`,
                }}
              >
                {item}
              </div>
            );
          })}
        </div>

        {/* Right pan - Price */}
        <div
          style={{
            position: "absolute",
            right: -20,
            top: -180,
            width: 200,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.xiaomiOrange,
              marginBottom: 12,
              transform: `rotate(${-beamRotation}deg)`,
            }}
          >
            {content.balanceRight}
          </div>

          {/* Price tag dropping in */}
          <div
            style={{
              transform: `rotate(${-beamRotation}deg) translateY(${priceY}px) scale(${priceScale})`,
              opacity: priceDropProgress,
            }}
          >
            <div
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: COLORS.xiaomiOrange,
                textShadow: `0 0 20px ${COLORS.glow}`,
              }}
            >
              ¥21.59{lang === "cn" ? "万" : "K"}
            </div>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: "100%",
          textAlign: "center",
          fontSize: 28,
          color: COLORS.textMuted,
          opacity: interpolate(
            frame,
            [200, 230],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {lang === "cn"
          ? "性能与价格的最佳平衡"
          : "The Perfect Balance of Performance & Price"}
      </div>
    </AbsoluteFill>
  );
};
