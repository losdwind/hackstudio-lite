import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SHADOWS } from "../../../../shared/lib/colors";
import { getDisplayFont, getBodyFont } from "../../../../shared/lib/fonts";
import { useTimeScale, SPRING_SMOOTH, STAGGER_DEFAULT } from "../../../../shared/lib/timing";
import { ecosystemData } from "../../data/chart-data";
import type { Lang } from "../../../../shared/schemas/video-schema";

const DESIGNED_FRAMES = 300;
const CENTER_RADIUS = 140;
const NODE_RADIUS = 90;
const ORBIT_RADIUS = 340;

export const EcosystemDiagram: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { d } = useTimeScale(DESIGNED_FRAMES);
  const data = ecosystemData[lang];
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);

  const titleIn = spring({ frame, fps, delay: d(10), config: SPRING_SMOOTH });
  const titleOpacity = interpolate(titleIn, [0, 1], [0, 1]);
  const titleY = interpolate(titleIn, [0, 1], [-20, 0]);

  const centerIn = spring({ frame, fps, delay: d(30), config: SPRING_SMOOTH });
  const centerScale = interpolate(centerIn, [0, 1], [0.6, 1]);

  const captionIn = spring({ frame, fps, delay: d(180), config: SPRING_SMOOTH });
  const captionOpacity = interpolate(captionIn, [0, 1], [0, 1]);
  const captionY = interpolate(captionIn, [0, 1], [20, 0]);

  const angleStep = (Math.PI * 2) / data.nodes.length;
  const startAngle = -Math.PI / 2;

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
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontFamily: displayFont,
          fontSize: 44,
          fontWeight: 700,
          color: COLORS.textPrimary,
          letterSpacing: "-0.01em",
          marginBottom: 60,
        }}
      >
        {data.title}
      </div>

      <svg
        width={ORBIT_RADIUS * 2 + NODE_RADIUS * 2 + 80}
        height={ORBIT_RADIUS * 2 + NODE_RADIUS * 2 + 80}
        viewBox={`${-(ORBIT_RADIUS + NODE_RADIUS + 40)} ${-(ORBIT_RADIUS + NODE_RADIUS + 40)} ${ORBIT_RADIUS * 2 + NODE_RADIUS * 2 + 80} ${ORBIT_RADIUS * 2 + NODE_RADIUS * 2 + 80}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.primary} />
            <stop offset="100%" stopColor={COLORS.primaryContainer} />
          </linearGradient>
          <radialGradient id="node-glow">
            <stop offset="0%" stopColor="rgba(157, 202, 255, 0.35)" />
            <stop offset="100%" stopColor="rgba(157, 202, 255, 0)" />
          </radialGradient>
        </defs>

        {/* Connectivity lines — tonal, no solid border */}
        {data.nodes.map((_, i) => {
          const angle = startAngle + angleStep * i;
          const x = Math.cos(angle) * ORBIT_RADIUS;
          const y = Math.sin(angle) * ORBIT_RADIUS;
          const lineProgress = spring({
            frame,
            fps,
            delay: d(50 + i * STAGGER_DEFAULT),
            config: SPRING_SMOOTH,
          });
          const dashOffset = interpolate(lineProgress, [0, 1], [400, 0]);
          return (
            <line
              key={`line-${i}`}
              x1={0}
              y1={0}
              x2={x}
              y2={y}
              stroke={COLORS.outlineVariant}
              strokeWidth={2}
              strokeDasharray="6 8"
              strokeDashoffset={dashOffset}
              opacity={lineProgress}
            />
          );
        })}

        {/* Central HyperOS node — primary gradient */}
        <g transform={`scale(${centerScale})`}>
          <circle r={CENTER_RADIUS + 20} fill="url(#node-glow)" opacity={0.6} />
          <circle r={CENTER_RADIUS} fill="url(#primary-grad)" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={displayFont}
            fontSize={36}
            fontWeight={700}
            fill={COLORS.surface}
            letterSpacing="-0.01em"
          >
            {data.center}
          </text>
        </g>

        {/* Orbiting nodes — tertiary glow */}
        {data.nodes.map((node, i) => {
          const angle = startAngle + angleStep * i;
          const x = Math.cos(angle) * ORBIT_RADIUS;
          const y = Math.sin(angle) * ORBIT_RADIUS;
          const nodeIn = spring({
            frame,
            fps,
            delay: d(80 + i * STAGGER_DEFAULT),
            config: SPRING_SMOOTH,
          });
          const scale = interpolate(nodeIn, [0, 1], [0.4, 1]);
          return (
            <g key={`node-${i}`} transform={`translate(${x}, ${y}) scale(${scale})`}>
              <circle r={NODE_RADIUS + 16} fill="url(#node-glow)" opacity={0.55} />
              <circle
                r={NODE_RADIUS}
                fill={COLORS.surfaceContainerHigh}
                stroke={COLORS.tertiary}
                strokeWidth={2}
                opacity={0.95}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={bodyFont}
                fontSize={24}
                fontWeight={600}
                fill={COLORS.textPrimary}
              >
                {node}
              </text>
            </g>
          );
        })}
      </svg>

      <div
        style={{
          opacity: captionOpacity,
          transform: `translateY(${captionY}px)`,
          fontFamily: bodyFont,
          fontSize: 24,
          color: COLORS.secondary,
          textAlign: "center",
          maxWidth: 900,
          marginTop: 60,
          padding: "16px 32px",
          background: COLORS.glassSurface,
          backdropFilter: "blur(24px)",
          borderRadius: 16,
          boxShadow: SHADOWS.ambient,
        }}
      >
        {data.caption}
      </div>
    </AbsoluteFill>
  );
};
