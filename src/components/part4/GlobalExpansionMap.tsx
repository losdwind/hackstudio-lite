import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
  Easing,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { SPRING_SMOOTH } from "../../lib/timing";
import { expansionRoutes, chinaCoords } from "../../data/chart-data";
import type { Lang } from "../../schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";

type Props = { lang: Lang };

// Mercator projection: convert [lng, lat] to SVG [x, y]
// Map bounds: lng [-180, 180] → x [0, 1920], lat [80, -60] → y [0, 1080]
const project = (coords: [number, number]): [number, number] => {
  const x = ((coords[0] + 180) / 360) * 1920;
  const latRad = (coords[1] * Math.PI) / 180;
  const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = 540 - mercY * (1920 / (2 * Math.PI)) * 0.85;
  return [x, y];
};

// Generate a curved path (quadratic bezier) between two points
const curvedPath = (
  from: [number, number],
  to: [number, number],
): string => {
  const [x1, y1] = project(from);
  const [x2, y2] = project(to);
  // Control point: midpoint raised upward for arc effect
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.15;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
};

// Simplified world continent outlines (major landmasses as SVG paths)
const CONTINENTS = [
  // Eurasia (simplified)
  "M 880,180 C 920,170 980,160 1050,165 C 1100,168 1150,175 1200,185 C 1250,195 1300,200 1350,210 C 1380,215 1400,225 1380,240 C 1360,260 1320,270 1280,280 C 1240,290 1200,285 1160,275 C 1120,265 1100,280 1080,300 C 1060,320 1040,340 1020,350 C 1000,360 980,355 960,340 C 940,325 920,310 900,300 C 880,290 860,285 840,280 C 820,275 800,270 780,260 C 760,250 740,240 730,225 C 720,210 730,195 760,185 C 790,175 830,175 860,178 Z",
  // Africa
  "M 900,340 C 920,335 940,340 960,360 C 975,375 985,400 990,430 C 995,460 990,490 985,520 C 980,550 970,575 955,590 C 940,605 920,610 905,600 C 890,590 880,570 875,545 C 870,520 868,490 870,460 C 872,430 878,400 885,375 C 890,355 895,345 900,340 Z",
  // North America
  "M 200,180 C 240,170 290,175 340,190 C 380,200 410,220 430,250 C 445,275 450,300 440,320 C 430,340 410,350 385,355 C 360,360 330,355 300,345 C 270,335 245,320 225,300 C 210,285 200,265 195,240 C 190,215 192,195 200,180 Z",
  // South America
  "M 350,420 C 370,415 390,425 400,445 C 410,465 415,490 415,520 C 415,555 410,590 400,620 C 390,650 375,670 355,680 C 335,685 320,670 315,645 C 310,620 310,590 315,555 C 318,525 325,495 335,465 C 342,445 345,425 350,420 Z",
  // Australia
  "M 1350,520 C 1380,515 1420,520 1450,535 C 1475,548 1485,565 1480,580 C 1475,595 1455,605 1430,605 C 1405,605 1380,598 1360,585 C 1345,575 1340,560 1342,545 C 1344,530 1346,522 1350,520 Z",
  // East Asia / China area (highlighted)
  "M 1200,240 C 1230,235 1270,240 1310,255 C 1340,268 1360,285 1365,305 C 1368,320 1355,335 1335,340 C 1315,345 1290,340 1265,330 C 1240,320 1220,305 1210,285 C 1202,268 1198,252 1200,240 Z",
];

const [chinaX, chinaY] = project(chinaCoords);

export const GlobalExpansionMap: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);
  const content = lang === "cn" ? contentCN.part4 : contentEN.part4;

  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });

  // China marker pulse
  const chinaScale = spring({ frame, fps, delay: 15, config: SPRING_SMOOTH });
  const chinaPulse =
    1 + 0.08 * Math.sin((frame / 15) * Math.PI);

  // Continent fade in
  const continentOpacity = interpolate(frame, [0, 40], [0, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Grid lines
  const gridOpacity = interpolate(frame, [0, 30], [0, 0.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.surface,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 30,
          width: "100%",
          textAlign: "center",
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
          fontFamily: displayFont,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
          zIndex: 10,
        }}
      >
        {content.mapTitle}
      </div>

      <svg
        viewBox="0 0 1920 1080"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Grid lines for cartographic feel */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const [, y] = project([0, lat]);
          return (
            <line
              key={`lat-${lat}`}
              x1={0}
              y1={y}
              x2={1920}
              y2={y}
              stroke={COLORS.secondary}
              strokeWidth={0.5}
              opacity={gridOpacity}
            />
          );
        })}
        {[-120, -60, 0, 60, 120].map((lng) => {
          const [x] = project([lng, 0]);
          return (
            <line
              key={`lng-${lng}`}
              x1={x}
              y1={0}
              x2={x}
              y2={1080}
              stroke={COLORS.secondary}
              strokeWidth={0.5}
              opacity={gridOpacity}
            />
          );
        })}

        {/* Continent outlines */}
        {CONTINENTS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={i === 5 ? COLORS.primaryContainer : COLORS.surfaceContainerHigh}
            opacity={i === 5 ? continentOpacity * 2 : continentOpacity}
            stroke={COLORS.surfaceBright}
            strokeWidth={0.5}
          />
        ))}

        {/* Route lines (animated) */}
        {expansionRoutes.map((route, i) => {
          const lineStart = 60 + i * 40;
          const lineEnd = lineStart + 80;

          const lineProgress = interpolate(frame, [lineStart, lineEnd], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          });

          const pathD = curvedPath(chinaCoords, route.coords);
          const pathLength = 2000;
          const dashOffset = pathLength * (1 - lineProgress);

          // Destination marker
          const [destX, destY] = project(route.coords);
          const markerProgress = spring({
            frame,
            fps,
            delay: lineEnd - 10,
            config: SPRING_SMOOTH,
          });

          return (
            <g key={route.target.en}>
              {/* Route arc */}
              <path
                d={pathD}
                fill="none"
                stroke={COLORS.primaryContainer}
                strokeWidth={2.5}
                strokeDasharray={pathLength}
                strokeDashoffset={dashOffset}
                opacity={0.7}
                strokeLinecap="round"
              />

              {/* Destination glow */}
              <circle
                cx={destX}
                cy={destY}
                r={interpolate(markerProgress, [0, 1], [0, 30])}
                fill={COLORS.tertiary}
                opacity={interpolate(markerProgress, [0, 1], [0, 0.1])}
              />

              {/* Destination dot */}
              <circle
                cx={destX}
                cy={destY}
                r={interpolate(markerProgress, [0, 1], [0, 10])}
                fill={COLORS.tertiary}
                opacity={interpolate(markerProgress, [0, 1], [0, 1])}
              />

              {/* Destination label */}
              <text
                x={destX}
                y={destY + 28}
                textAnchor="middle"
                fontSize={24}
                fontWeight={700}
                fontFamily={bodyFont}
                fill={COLORS.textPrimary}
                opacity={interpolate(markerProgress, [0, 0.5, 1], [0, 0, 1])}
              >
                {route.target[lang]}
              </text>
            </g>
          );
        })}

        {/* China origin marker */}
        <g
          transform={`translate(${chinaX}, ${chinaY})`}
          opacity={chinaScale}
        >
          {/* Outer glow pulse */}
          <circle
            r={35 * chinaPulse}
            fill={COLORS.primaryContainer}
            opacity={0.12}
          />
          {/* Main dot */}
          <circle
            r={16}
            fill={COLORS.primaryContainer}
            transform={`scale(${chinaScale})`}
          />
          {/* Inner bright dot */}
          <circle r={6} fill="#FFFFFF" opacity={0.9} />
          {/* Label */}
          <text
            y={-28}
            textAnchor="middle"
            fontSize={28}
            fontWeight={900}
            fontFamily={displayFont}
            fill={COLORS.textPrimary}
          >
            {lang === "cn" ? "中国" : "China"}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
