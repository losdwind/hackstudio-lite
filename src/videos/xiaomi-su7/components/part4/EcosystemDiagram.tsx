import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { COLORS, GRADIENTS, SHADOWS } from "../../../../shared/lib/colors";
import { SPRING_SMOOTH, SPRING_BOUNCY, STAGGER_DEFAULT } from "../../../../shared/lib/timing";
import { ecosystemRings } from "../../data/chart-data";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../../../../shared/lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";

type Props = { lang: Lang };

const CX = 960;
const CY = 540;
const RING_RADII = [200, 340, 470];
const RING_COLORS = [COLORS.tertiary, COLORS.primaryContainer, COLORS.tertiaryBright];

export const EcosystemDiagram: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);
  const content = lang === "cn" ? contentCN.part5 : contentEN.part5;

  // Center logo entrance
  const centerProgress = spring({
    frame,
    fps,
    delay: 0,
    config: SPRING_BOUNCY,
  });

  // Title
  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });

  return (
    <AbsoluteFill style={{ fontFamily: bodyFont }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 30,
          width: "100%",
          textAlign: "center",
          fontSize: 48,
          fontWeight: 700,
          fontFamily: displayFont,
          color: COLORS.textPrimary,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
        }}
      >
        {content.ecosystemTitle}
      </div>

      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <defs>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7.5" result="blur" />
            <feFlood floodColor={COLORS.tertiary} floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Rings */}
        {ecosystemRings.map((ring, ringIdx) => {
          const ringDelay = 20 + ringIdx * 30;
          const ringProgress = spring({
            frame,
            fps,
            delay: ringDelay,
            config: SPRING_SMOOTH,
          });

          const radius = RING_RADII[ringIdx];
          const circumference = 2 * Math.PI * radius;
          const dashOffset = circumference * (1 - ringProgress);

          return (
            <g key={ring.ring.en}>
              {/* Ring circle */}
              <circle
                cx={CX}
                cy={CY}
                r={radius}
                fill="none"
                stroke={RING_COLORS[ringIdx]}
                strokeWidth={2}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                opacity={0.3}
              />

              {/* Ring label */}
              <text
                x={CX}
                y={CY - radius - 15}
                textAnchor="middle"
                fontSize={24}
                fontWeight={700}
                fill={RING_COLORS[ringIdx]}
                opacity={interpolate(ringProgress, [0, 0.5, 1], [0, 0, 1])}
              >
                {ring.ring[lang]}
              </text>

              {/* Items on the ring */}
              {ring.items.map((item, itemIdx) => {
                const itemDelay =
                  ringDelay + 15 + itemIdx * STAGGER_DEFAULT;
                const itemProgress = spring({
                  frame,
                  fps,
                  delay: itemDelay,
                  config: SPRING_SMOOTH,
                });

                const angle =
                  (itemIdx / ring.items.length) * 2 * Math.PI -
                  Math.PI / 2;
                const ix = CX + Math.cos(angle) * radius;
                const iy = CY + Math.sin(angle) * radius;

                return (
                  <g key={item.en}>
                    {/* Item dot — ghost border + node glow */}
                    <circle
                      cx={ix}
                      cy={iy}
                      r={interpolate(itemProgress, [0, 1], [0, 24])}
                      fill={COLORS.surfaceContainerLow}
                      filter="url(#nodeGlow)"
                    />
                    {/* Item label */}
                    <text
                      x={ix}
                      y={iy + 4}
                      textAnchor="middle"
                      fontSize={14}
                      fontWeight={600}
                      fill={COLORS.textPrimary}
                      opacity={interpolate(
                        itemProgress,
                        [0, 0.5, 1],
                        [0, 0, 1],
                      )}
                    >
                      {item[lang]}
                    </text>

                    {/* Connection line to center */}
                    <line
                      x1={CX}
                      y1={CY}
                      x2={ix}
                      y2={iy}
                      stroke={RING_COLORS[ringIdx]}
                      strokeWidth={1}
                      opacity={interpolate(
                        itemProgress,
                        [0, 1],
                        [0, 0.15],
                      )}
                      strokeDasharray="4 4"
                    />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Center logo — glassmorphism + primary gradient + hero glow */}
      <div
        style={{
          position: "absolute",
          left: CX - 60,
          top: CY - 60,
          width: 120,
          height: 120,
          borderRadius: "50%",
          backgroundColor: COLORS.glassSurface,
          backdropFilter: "blur(20px)",
          background: GRADIENTS.primaryCTA,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${interpolate(centerProgress, [0, 1], [0, 1])})`,
          boxShadow: SHADOWS.heroGlow,
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: "#FFFFFF",
          }}
        >
          {content.ecosystemCenter}
        </span>
      </div>
    </AbsoluteFill>
  );
};
