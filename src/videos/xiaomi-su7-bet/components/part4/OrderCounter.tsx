import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, GRADIENTS, SHADOWS } from "../../../../shared/lib/colors";
import { getDisplayFont, getBodyFont } from "../../../../shared/lib/fonts";
import { useTimeScale, SPRING_SMOOTH } from "../../../../shared/lib/timing";
import { AnimatedNumber } from "../../../../shared/components/AnimatedNumber";
import { orderCounterData } from "../../data/chart-data";
import type { Lang } from "../../../../shared/schemas/video-schema";

const DESIGNED_FRAMES = 300;

export const OrderCounter: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { d } = useTimeScale(DESIGNED_FRAMES);
  const copy = orderCounterData[lang];
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);

  const headerIn = spring({ frame, fps, delay: d(20), config: SPRING_SMOOTH });
  const headerOpacity = interpolate(headerIn, [0, 1], [0, 1]);
  const headerY = interpolate(headerIn, [0, 1], [-16, 0]);

  const counterStart = d(50);
  const counterDuration = d(180);

  const contextIn = spring({ frame, fps, delay: d(240), config: SPRING_SMOOTH });
  const contextOpacity = interpolate(contextIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          padding: "64px 96px",
          background: COLORS.glassSurface,
          backdropFilter: "blur(30px)",
          borderRadius: 24,
          boxShadow: SHADOWS.heroGlow,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient accent — 135deg */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 180,
            height: 4,
            background: GRADIENTS.primaryCTA,
            borderRadius: "0 0 4px 4px",
          }}
        />

        <span
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            fontFamily: bodyFont,
            fontSize: 22,
            color: COLORS.secondary,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 500,
          }}
        >
          {copy.headline}
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 20,
            fontFamily: displayFont,
          }}
        >
          <AnimatedNumber
            value={orderCounterData.final}
            startFrame={counterStart}
            durationFrames={counterDuration}
            fontSize={220}
            color={COLORS.primary}
            fontFamily={displayFont}
          />
          <span
            style={{
              fontFamily: bodyFont,
              fontSize: 36,
              color: COLORS.textPrimary,
              fontWeight: 500,
            }}
          >
            {copy.suffix}
          </span>
        </div>

        <span
          style={{
            opacity: contextOpacity,
            fontFamily: bodyFont,
            fontSize: 18,
            color: COLORS.textMuted,
            letterSpacing: "0.04em",
          }}
        >
          {copy.context}
        </span>
      </div>
    </AbsoluteFill>
  );
};
