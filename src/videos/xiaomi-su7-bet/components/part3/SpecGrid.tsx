import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, GRADIENTS, SHADOWS } from "../../../../shared/lib/colors";
import { getDisplayFont, getBodyFont } from "../../../../shared/lib/fonts";
import { useTimeScale, SPRING_SMOOTH } from "../../../../shared/lib/timing";
import { specGridData } from "../../data/chart-data";
import type { Lang } from "../../../../shared/schemas/video-schema";

const DESIGNED_FRAMES = 300;

export const SpecGrid: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { d } = useTimeScale(DESIGNED_FRAMES);
  const stats = specGridData[lang];
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);

  const headerIn = spring({ frame, fps, delay: d(10), config: SPRING_SMOOTH });
  const headerOpacity = interpolate(headerIn, [0, 1], [0, 1]);
  const headerY = interpolate(headerIn, [0, 1], [-16, 0]);

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
          gap: 60,
          alignItems: "center",
        }}
      >
        <h2
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            fontFamily: displayFont,
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.textPrimary,
            letterSpacing: "-0.02em",
            margin: 0,
            textAlign: "center",
          }}
        >
          {lang === "cn" ? "SU7 Max 核心参数" : "SU7 Max Hero Specs"}
        </h2>

        <div style={{ display: "flex", gap: 48, alignItems: "stretch" }}>
          {stats.map((stat, i) => {
            const statIn = spring({
              frame,
              fps,
              delay: d(40 + i * 25),
              config: SPRING_SMOOTH,
            });
            const opacity = interpolate(statIn, [0, 1], [0, 1]);
            const translateY = interpolate(statIn, [0, 1], [40, 0]);

            return (
              <div
                key={stat.label}
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  width: 360,
                  padding: "48px 40px",
                  background: COLORS.glassSurface,
                  backdropFilter: "blur(28px)",
                  borderRadius: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 16,
                  boxShadow: SHADOWS.ambient,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Gradient accent — no solid border */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: 4,
                    width: "40%",
                    background: GRADIENTS.primaryCTA,
                    borderRadius: "0 0 4px 0",
                  }}
                />
                <span
                  style={{
                    fontFamily: bodyFont,
                    fontSize: 16,
                    color: COLORS.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  {stat.label}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span
                    style={{
                      fontFamily: displayFont,
                      fontSize: 120,
                      fontWeight: 700,
                      color: COLORS.primary,
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {stat.value}
                  </span>
                  <span
                    style={{
                      fontFamily: bodyFont,
                      fontSize: 28,
                      color: COLORS.secondary,
                      fontWeight: 500,
                    }}
                  >
                    {stat.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
