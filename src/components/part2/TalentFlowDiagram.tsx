import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { COLORS, GRADIENTS, SHADOWS } from "../../lib/colors";
import { SPRING_SMOOTH, STAGGER_DRAMATIC } from "../../lib/timing";
import { talentFlowSources } from "../../data/chart-data";
import type { Lang } from "../../schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";

type Props = { lang: Lang };

const SOURCE_X = 200;
const DEST_X = 1600;
const START_Y = 250;
const SPACING_Y = 130;

export const TalentFlowDiagram: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);
  const content = lang === "cn" ? contentCN.part2 : contentEN.part2;

  const titleProgress = spring({ frame, fps, config: SPRING_SMOOTH });

  // Destination node entrance
  const destProgress = spring({
    frame,
    fps,
    delay: 5,
    config: SPRING_SMOOTH,
  });

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
        {content.talentFlowTitle}
      </div>

      {/* SVG arrows */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {talentFlowSources.map((source, i) => {
          const y = START_Y + i * SPACING_Y;
          const arrowDelay = 30 + i * STAGGER_DRAMATIC;
          const arrowProgress = spring({
            frame,
            fps,
            delay: arrowDelay,
            config: SPRING_SMOOTH,
          });

          // Arrow path from source to destination with a slight curve
          const midX = (SOURCE_X + DEST_X) / 2;
          const destY = START_Y + ((talentFlowSources.length - 1) * SPACING_Y) / 2;
          const pathD = `M ${SOURCE_X + 140} ${y} Q ${midX} ${y} ${DEST_X - 140} ${destY}`;

          // Calculate path length for dash animation
          const pathLength = 1200;
          const dashOffset = pathLength * (1 - arrowProgress);

          // Person dot traveling along the arrow
          const dotX = interpolate(
            arrowProgress,
            [0, 1],
            [SOURCE_X + 140, DEST_X - 150],
          );
          const dotY = interpolate(
            arrowProgress,
            [0, 0.5, 1],
            [y, (y + destY) / 2, destY],
          );

          return (
            <g key={source.name.en}>
              {/* Arrow path */}
              <path
                d={pathD}
                fill="none"
                stroke={COLORS.primaryContainer}
                strokeWidth={2}
                strokeDasharray={pathLength}
                strokeDashoffset={dashOffset}
                opacity={0.6}
              />
              {/* Traveling dot */}
              {arrowProgress > 0.05 && (
                <circle
                  cx={dotX}
                  cy={dotY}
                  r={6}
                  fill={COLORS.primaryContainer}
                  opacity={interpolate(
                    arrowProgress,
                    [0, 0.1, 0.9, 1],
                    [0, 1, 1, 0],
                  )}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Source nodes */}
      {talentFlowSources.map((source, i) => {
        const y = START_Y + i * SPACING_Y;
        const nodeDelay = 15 + i * STAGGER_DRAMATIC;
        const nodeProgress = spring({
          frame,
          fps,
          delay: nodeDelay,
          config: SPRING_SMOOTH,
        });

        return (
          <div
            key={source.name.en}
            style={{
              position: "absolute",
              left: SOURCE_X - 100,
              top: y - 25,
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: interpolate(nodeProgress, [0, 1], [0, 1]),
              transform: `translateX(${interpolate(nodeProgress, [0, 1], [-30, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 12,
                backgroundColor: "rgba(28, 27, 27, 0.7)",
                backdropFilter: "blur(20px)",
                boxShadow: SHADOWS.nodeGlow,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 24,
              }}
            >
              {source.icon}
            </div>
            <span
              style={{
                fontSize: 24,
                color: COLORS.secondary,
                fontWeight: 600,
              }}
            >
              {source.name[lang]}
            </span>
          </div>
        );
      })}

      {/* Destination node */}
      <div
        style={{
          position: "absolute",
          left: DEST_X - 100,
          top:
            START_Y +
            ((talentFlowSources.length - 1) * SPACING_Y) / 2 -
            50,
          width: 200,
          height: 100,
          borderRadius: 16,
          background: GRADIENTS.primaryCTA,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: interpolate(destProgress, [0, 1], [0, 1]),
          transform: `scale(${interpolate(destProgress, [0, 1], [0.7, 1])})`,
          boxShadow: SHADOWS.primaryGlow,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#FFFFFF",
          }}
        >
          {content.destination}
        </span>
      </div>

      {/* Engineer count */}
      <div
        style={{
          position: "absolute",
          left: DEST_X - 80,
          top:
            START_Y +
            ((talentFlowSources.length - 1) * SPACING_Y) / 2 +
            70,
          fontSize: 22,
          color: COLORS.textMuted,
          opacity: interpolate(destProgress, [0, 0.5, 1], [0, 0, 1]),
          textAlign: "center",
          width: 160,
        }}
      >
        4,000+ {lang === "cn" ? "工程师" : "Engineers"}
      </div>
    </AbsoluteFill>
  );
};
