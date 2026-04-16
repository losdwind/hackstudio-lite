import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
  Easing,
} from "remotion";
import { COLORS, GRADIENTS, SHADOWS } from "../../../../shared/lib/colors";
import { SPRING_SMOOTH, SPRING_BOUNCY, useTimeScale } from "../../../../shared/lib/timing";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../../../../shared/lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";

type Props = { lang: Lang };

const BEAM_WIDTH = 700;
const BEAM_Y = 450;
const PIVOT_X = 960; // center of 1920

export const PricingBalance: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { f } = useTimeScale(300);
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);
  const content = lang === "cn" ? contentCN.part4 : contentEN.part4;

  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });

  // Phase 1: Specs pile on left -> tilt left
  // Phase 2: Price drops on right -> tilt right
  // Phase 3: Settle to equilibrium
  const phase1Tilt = interpolate(frame, [f(20), f(80)], [0, -8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  const phase2Tilt = interpolate(frame, [f(90), f(140)], [0, 14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const phase3Settle = interpolate(frame, [f(160), f(220)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  // Combine tilt phases
  let beamRotation: number;
  if (frame < f(90)) {
    beamRotation = phase1Tilt;
  } else if (frame < f(160)) {
    beamRotation = -8 + phase2Tilt;
  } else {
    beamRotation = interpolate(phase3Settle, [0, 1], [6, 0]);
  }

  // Spec items appear staggered
  const specItems =
    lang === "cn"
      ? ["续航 700km", "673匹马力", "2.78s百公里", "智能驾驶"]
      : ["700km Range", "673 HP", "2.78s 0-100", "Smart Drive"];

  // Price drop animation
  const priceDropProgress = spring({
    frame,
    fps,
    delay: f(90),
    config: SPRING_BOUNCY,
  });

  const priceY = interpolate(priceDropProgress, [0, 1], [-200, 0]);
  const priceScale = interpolate(priceDropProgress, [0, 1], [0.5, 1]);

  return (
    <AbsoluteFill style={{ fontFamily: bodyFont }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          textAlign: "center",
          fontSize: 48,
          fontWeight: 700,
          fontFamily: displayFont,
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

      {/* Pivot triangle — clipPath instead of border trick (No-Line Rule) */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 20,
          top: BEAM_Y - 10,
          width: 40,
          height: 20,
          backgroundColor: COLORS.textMuted,
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
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
          background: GRADIENTS.primaryCTA,
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
              fontFamily: displayFont,
              color: COLORS.tertiary,
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
                  color: COLORS.secondary,
                  textAlign: "center",
                  padding: "4px 12px",
                  backgroundColor: `rgba(157, 202, 255, ${0.1 * itemProgress})`,
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
              fontFamily: displayFont,
              color: COLORS.primaryContainer,
              marginBottom: 12,
              transform: `rotate(${-beamRotation}deg)`,
            }}
          >
            {content.balanceRight}
          </div>

          {/* Price tag dropping in — gradient/glow treatment */}
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
                fontFamily: displayFont,
                background: GRADIENTS.primaryCTA,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: `drop-shadow(${SHADOWS.primaryGlow})`,
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
          fontFamily: bodyFont,
          color: COLORS.textMuted,
          opacity: interpolate(frame, [f(200), f(230)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {lang === "cn"
          ? "性能与价格的最佳平衡"
          : "The Perfect Balance of Performance & Price"}
      </div>
    </AbsoluteFill>
  );
};
