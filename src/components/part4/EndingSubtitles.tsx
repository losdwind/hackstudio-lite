import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { COLORS, GRADIENTS } from "../../lib/colors";
import { SPRING_SMOOTH, SPRING_BOUNCY } from "../../lib/timing";
import type { Lang } from "../../schemas/video-schema";
import { getDisplayFont, getBodyFont } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";

type Props = { lang: Lang };

export const EndingSubtitles: React.FC<Props> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);
  const content = lang === "cn" ? contentCN.part4 : contentEN.part4;
  const lines = content.endingLines;

  // Line 1: Fade + scale spring
  const line1Progress = spring({
    frame,
    fps,
    delay: 0,
    config: SPRING_SMOOTH,
  });
  const line1Scale = interpolate(line1Progress, [0, 1], [0.8, 1]);
  const line1Opacity = interpolate(line1Progress, [0, 1], [0, 1]);

  // Line 2: Typewriter effect
  const line2Start = 50;
  const line2Text = lines[1];
  const charsPerFrame = 0.8;
  const visibleChars = Math.min(
    Math.max(0, Math.floor((frame - line2Start) * charsPerFrame)),
    line2Text.length,
  );
  const line2Visible = frame >= line2Start;

  // Line 3: Word highlight effect
  const line3Start = 130;
  const line3Progress = spring({
    frame,
    fps,
    delay: line3Start,
    config: SPRING_SMOOTH,
  });
  const line3Opacity = interpolate(line3Progress, [0, 1], [0, 1]);

  // Highlight wipe on the key phrase
  const highlightProgress = spring({
    frame,
    fps,
    delay: line3Start + 20,
    config: SPRING_SMOOTH,
  });

  // Subscribe text
  const subProgress = spring({
    frame,
    fps,
    delay: 190,
    config: SPRING_BOUNCY,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: bodyFont,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 50,
          maxWidth: 1400,
        }}
      >
        {/* Line 1: Fade + scale */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            fontFamily: displayFont,
            color: COLORS.textPrimary,
            opacity: line1Opacity,
            transform: `scale(${line1Scale})`,
            textAlign: "center",
          }}
        >
          {lines[0]}
        </div>

        {/* Line 2: Typewriter */}
        {line2Visible && (
          <div
            style={{
              fontSize: 44,
              fontWeight: 400,
              color: COLORS.secondary,
              textAlign: "center",
              minHeight: 60,
            }}
          >
            {line2Text.slice(0, visibleChars)}
            <span
              style={{
                opacity:
                  Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
                color: COLORS.primaryContainer,
              }}
            >
              |
            </span>
          </div>
        )}

        {/* Line 3: With highlight */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: COLORS.textPrimary,
            opacity: line3Opacity,
            textAlign: "center",
            position: "relative",
          }}
        >
          <span style={{ position: "relative", zIndex: 1 }}>
            {lines[2]}
          </span>
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: 0,
              height: 12,
              width: `${highlightProgress * 100}%`,
              background: GRADIENTS.primaryCTA,
              opacity: 0.4,
              borderRadius: 4,
              zIndex: 0,
            }}
          />
        </div>

        {/* Subscribe CTA */}
        <div
          style={{
            fontSize: 28,
            color: COLORS.textMuted,
            marginTop: 40,
            opacity: interpolate(subProgress, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(subProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          {content.subscribeText}
        </div>
      </div>
    </AbsoluteFill>
  );
};
