import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, GRADIENTS, SHADOWS } from "../../../../shared/lib/colors";
import { getDisplayFont, getBodyFont } from "../../../../shared/lib/fonts";
import { useTimeScale, SPRING_SMOOTH } from "../../../../shared/lib/timing";
import { AnimatedNumber } from "../../../../shared/components/AnimatedNumber";
import { priceCompareData } from "../../data/chart-data";
import type { Lang } from "../../../../shared/schemas/video-schema";

const DESIGNED_FRAMES = 300;
const BAR_HEIGHT = 72;
const BAR_MAX_WIDTH = 980;

export const PriceCompareChart: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { d } = useTimeScale(DESIGNED_FRAMES);
  const copy = priceCompareData[lang];
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);

  const taycanRatio = 1;
  const su7Ratio = priceCompareData.su7Price / priceCompareData.taycanPrice;

  const headerIn = spring({ frame, fps, delay: d(10), config: SPRING_SMOOTH });
  const headerOpacity = interpolate(headerIn, [0, 1], [0, 1]);
  const headerY = interpolate(headerIn, [0, 1], [-20, 0]);

  const su7BarIn = spring({ frame, fps, delay: d(40), config: SPRING_SMOOTH });
  const taycanBarIn = spring({ frame, fps, delay: d(100), config: SPRING_SMOOTH });

  const su7Width = interpolate(su7BarIn, [0, 1], [0, BAR_MAX_WIDTH * su7Ratio]);
  const taycanWidth = interpolate(taycanBarIn, [0, 1], [0, BAR_MAX_WIDTH * taycanRatio]);

  const su7NumStart = d(40);
  const taycanNumStart = d(100);
  const numDuration = d(60);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 48,
          width: "100%",
          maxWidth: 1200,
        }}
      >
        <h2
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            fontFamily: displayFont,
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.textPrimary,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {lang === "cn" ? "价格对比" : "Price Comparison"}
        </h2>

        <BarRow
          label={copy.su7Label}
          sublabel={copy.su7Sub}
          width={su7Width}
          color={GRADIENTS.primaryCTA}
          glow={SHADOWS.primaryGlow}
          displayFont={displayFont}
          bodyFont={bodyFont}
          numStart={su7NumStart}
          numDuration={numDuration}
          price={priceCompareData.su7Price}
          currency={priceCompareData.currency}
          highlight
        />

        <BarRow
          label={copy.taycanLabel}
          sublabel={copy.taycanSub}
          width={taycanWidth}
          color={COLORS.surfaceBright}
          glow={SHADOWS.ambient}
          displayFont={displayFont}
          bodyFont={bodyFont}
          numStart={taycanNumStart}
          numDuration={numDuration}
          price={priceCompareData.taycanPrice}
          currency={priceCompareData.currency}
        />
      </div>
    </AbsoluteFill>
  );
};

const BarRow: React.FC<{
  label: string;
  sublabel: string;
  width: number;
  color: string;
  glow: string;
  displayFont: string;
  bodyFont: string;
  numStart: number;
  numDuration: number;
  price: number;
  currency: string;
  highlight?: boolean;
}> = ({ label, sublabel, width, color, glow, displayFont, bodyFont, numStart, numDuration, price, currency, highlight }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        fontFamily: bodyFont,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: COLORS.textPrimary }}>{label}</span>
        <span style={{ fontSize: 16, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{sublabel}</span>
      </div>
      <span
        style={{
          fontFamily: displayFont,
          fontSize: 42,
          fontWeight: 700,
          color: highlight ? COLORS.primary : COLORS.textPrimary,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {currency}
        <AnimatedNumber
          value={price}
          startFrame={numStart}
          durationFrames={numDuration}
          fontSize={42}
          color={highlight ? COLORS.primary : COLORS.textPrimary}
          fontFamily={displayFont}
        />
      </span>
    </div>
    <div
      style={{
        height: BAR_HEIGHT,
        width,
        background: color,
        borderRadius: 12,
        boxShadow: glow,
      }}
    />
  </div>
);
