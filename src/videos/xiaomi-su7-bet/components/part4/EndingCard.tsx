import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, GRADIENTS } from "../../../../shared/lib/colors";
import { getDisplayFont, getBodyFont } from "../../../../shared/lib/fonts";
import { SPRING_SMOOTH } from "../../../../shared/lib/timing";
import type { Lang } from "../../../../shared/schemas/video-schema";

const COPY = {
  cn: {
    sign: "中国产业观察",
    tagline: "从中国视角，拆解全球产业。",
    cta: "订阅 · 追下一场豪赌",
  },
  en: {
    sign: "China Industry Decoded",
    tagline: "Decoding global industries from a China perspective.",
    cta: "Subscribe for the next big bet.",
  },
} as const;

export const EndingCard: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = COPY[lang];
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);

  const signIn = spring({ frame, fps, delay: 20, config: SPRING_SMOOTH });
  const taglineIn = spring({ frame, fps, delay: 60, config: SPRING_SMOOTH });
  const ctaIn = spring({ frame, fps, delay: 140, config: SPRING_SMOOTH });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          padding: "72px 120px",
          background: COLORS.glassSurface,
          backdropFilter: "blur(40px)",
          borderRadius: 24,
        }}
      >
        <div
          style={{
            opacity: interpolate(signIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(signIn, [0, 1], [20, 0])}px)`,
            width: 160,
            height: 4,
            background: GRADIENTS.primaryCTA,
            borderRadius: 2,
          }}
        />
        <h1
          style={{
            opacity: interpolate(signIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(signIn, [0, 1], [32, 0])}px)`,
            fontFamily: displayFont,
            fontSize: 88,
            fontWeight: 800,
            color: COLORS.textPrimary,
            letterSpacing: "-0.03em",
            margin: 0,
            textAlign: "center",
          }}
        >
          {copy.sign}
        </h1>
        <p
          style={{
            opacity: interpolate(taglineIn, [0, 1], [0, 1]),
            fontFamily: bodyFont,
            fontSize: 28,
            color: COLORS.secondary,
            margin: 0,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          {copy.tagline}
        </p>
        <p
          style={{
            opacity: interpolate(ctaIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(ctaIn, [0, 1], [16, 0])}px)`,
            fontFamily: bodyFont,
            fontSize: 20,
            color: COLORS.primary,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontWeight: 600,
          }}
        >
          {copy.cta}
        </p>
      </div>
    </AbsoluteFill>
  );
};
