import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import type { WordTiming } from "../lib/alignment-types";

type SubtitleOverlayProps = {
  fontFamily: string;
  fontSize?: number;
  highlightColor?: string;
} & (
  | {
      /** Word-level timestamps from MiniMax alignment data */
      words: WordTiming[];
      /** The line's startTime in the part audio (seconds) — used to convert to local frames */
      lineStartTime: number;
      text?: undefined;
      audioDuration?: undefined;
    }
  | {
      /** Legacy: narration text, evenly distributed across audioDuration */
      text: string;
      audioDuration: number;
      words?: undefined;
      lineStartTime?: undefined;
    }
);

/**
 * Displays word-by-word highlighted captions synced to audio.
 *
 * Two modes:
 *   1. Word timestamps (new): uses MiniMax alignment data for precise per-word sync.
 *   2. Even distribution (legacy): splits text into tokens spread across audioDuration.
 *
 * Place inside a <Sequence> — uses local frame (starts at 0 within the Sequence).
 */
export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = (props) => {
  const { fontFamily, fontSize = 40, highlightColor = COLORS.primaryContainer } =
    props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // If words prop is passed (continuous mode) but empty, render nothing.
  // This happens with placeholder alignment data before TTS is generated.
  if (props.words !== undefined && props.words.length === 0) {
    return null;
  }

  const useWordTimestamps = props.words && props.words.length > 0;

  // ── Word-timestamp mode ────────────────────────
  if (useWordTimestamps) {
    const { words, lineStartTime } = props;

    // Find the currently active chunk to display (only one at a time)
    const activeWord = words.find((word) => {
      const startFrame = Math.round((word.start - lineStartTime) * fps);
      const endFrame = Math.round((word.end - lineStartTime) * fps);
      return frame >= startFrame && frame < endFrame;
    });

    // Fall back to the last chunk if past all words
    const displayWord =
      activeWord ??
      words.findLast((word) => {
        const endFrame = Math.round((word.end - lineStartTime) * fps);
        return frame >= endFrame;
      });

    if (!displayWord) return null;

    return (
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 80,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(19, 19, 19, 0.75)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 12,
            padding: "14px 28px",
            maxWidth: 1400,
          }}
        >
          <div
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily,
              lineHeight: 1.5,
              textAlign: "center",
              whiteSpace: "pre-wrap",
              color: highlightColor,
            }}
          >
            {displayWord.text}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ── Legacy even-distribution mode ──────────────
  const { text, audioDuration } = props as {
    text: string;
    audioDuration: number;
  };
  const isChinese = /[\u4e00-\u9fff]/.test(text);
  const tokens = isChinese
    ? (text.match(/.{1,4}/g) || [text])
    : text.split(/(\s+)/).filter(Boolean);

  const contentTokens = tokens.filter((t) => t.trim().length > 0);
  const totalDurationFrames = Math.ceil(audioDuration * fps);
  const tokenDuration = totalDurationFrames / contentTokens.length;

  let contentIdx = 0;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 80,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(19, 19, 19, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 12,
          padding: "14px 28px",
          maxWidth: 1400,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily,
            lineHeight: 1.5,
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}
        >
          {tokens.map((token, i) => {
            const isWhitespace = token.trim().length === 0;

            if (isWhitespace) {
              return (
                <span key={i} style={{ color: COLORS.textPrimary }}>
                  {token}
                </span>
              );
            }

            const tokenStart = contentIdx * tokenDuration;
            const tokenEnd = (contentIdx + 1) * tokenDuration;
            contentIdx++;

            const isActive = frame >= tokenStart && frame < tokenEnd;
            const isPast = frame >= tokenEnd;

            return (
              <span
                key={i}
                style={{
                  color: isActive
                    ? highlightColor
                    : isPast
                      ? COLORS.textPrimary
                      : COLORS.secondary,
                }}
              >
                {token}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
