import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import type { WordTiming } from "../lib/alignment-types";

// Max chars per displayed caption chunk. Chosen so a chunk always fits on one
// line at fontSize 40 inside the 1400px container (CJK glyphs ~42px wide,
// Latin avg ~18px). whisper-align.ts now emits sentence-level WordTimings,
// so most chunks already fit; this is only a safety net for overlong
// sentences which are split at comma (not terminal punct).
const MAX_CJK_CHARS = 28;
const MAX_LATIN_CHARS = 72;
// Only split at commas / semicolons / colons — NOT at sentence-ending
// punctuation, so sentence-level WordTimings from whisper-align stay whole.
const PUNCT_SPLIT_RE = /([，、；：,;:\n]+)/g;

function splitWordIntoChunks(word: WordTiming): WordTiming[] {
  const text = word.text;
  const isCJK = /[\u4e00-\u9fff]/.test(text);
  const maxLen = isCJK ? MAX_CJK_CHARS : MAX_LATIN_CHARS;

  if (text.length <= maxLen) return [word];

  // 1) Split on punctuation, re-attach punctuation to the preceding fragment.
  const raw = text.split(PUNCT_SPLIT_RE).filter((s) => s.length > 0);
  const merged: string[] = [];
  for (const piece of raw) {
    if (PUNCT_SPLIT_RE.test(piece) && merged.length > 0) {
      merged[merged.length - 1] += piece;
      PUNCT_SPLIT_RE.lastIndex = 0;
    } else {
      merged.push(piece);
      PUNCT_SPLIT_RE.lastIndex = 0;
    }
  }

  // 2) Any fragment still too long: hard-split at maxLen (or on space for Latin).
  const final: string[] = [];
  for (const frag of merged) {
    if (frag.length <= maxLen) {
      final.push(frag);
      continue;
    }
    if (isCJK) {
      for (let i = 0; i < frag.length; i += maxLen) {
        final.push(frag.slice(i, i + maxLen));
      }
    } else {
      // Word-safe wrap for Latin text
      const words = frag.split(/(\s+)/);
      let buf = "";
      for (const w of words) {
        if ((buf + w).length > maxLen && buf.trim().length > 0) {
          final.push(buf.trim());
          buf = w;
        } else {
          buf += w;
        }
      }
      if (buf.trim().length > 0) final.push(buf.trim());
    }
  }

  // 3) Distribute [word.start, word.end] across chunks, weighted by char count.
  const totalChars = final.reduce((acc, s) => acc + s.length, 0) || 1;
  const totalDur = word.end - word.start;
  const out: WordTiming[] = [];
  let cursor = 0;
  for (const seg of final) {
    const s = word.start + (cursor / totalChars) * totalDur;
    cursor += seg.length;
    const e = word.start + (cursor / totalChars) * totalDur;
    out.push({ text: seg, start: s, end: e });
  }
  return out;
}

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
  // Hooks must run unconditionally; compute chunks regardless of mode.
  const chunks = useMemo(() => {
    if (!props.words || props.words.length === 0) return [];
    return props.words.flatMap(splitWordIntoChunks);
  }, [props.words]);

  if (useWordTimestamps) {
    const { lineStartTime } = props;

    // Find the currently active chunk to display (only one at a time)
    const activeChunk = chunks.find((c) => {
      const startFrame = Math.round((c.start - lineStartTime) * fps);
      const endFrame = Math.round((c.end - lineStartTime) * fps);
      return frame >= startFrame && frame < endFrame;
    });

    // Fall back to the last chunk if past all chunks
    let fallbackChunk: WordTiming | undefined;
    for (let i = chunks.length - 1; i >= 0; i--) {
      const endFrame = Math.round((chunks[i].end - lineStartTime) * fps);
      if (frame >= endFrame) {
        fallbackChunk = chunks[i];
        break;
      }
    }
    const displayChunk = activeChunk ?? fallbackChunk;

    if (!displayChunk) return null;

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
            maxWidth: "min(1400px, 92vw)",
            display: "inline-block",
          }}
        >
          <div
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily,
              lineHeight: 1.4,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: highlightColor,
            }}
          >
            {displayChunk.text}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ── Legacy even-distribution mode ──────────────
  // Re-use the chunk/redistribute strategy: treat the whole line as one
  // WordTiming, split into single-line chunks, show one at a time.
  const { text, audioDuration } = props as {
    text: string;
    audioDuration: number;
  };
  const legacyChunks = splitWordIntoChunks({
    text,
    start: 0,
    end: audioDuration,
  });

  const activeLegacy = legacyChunks.find((c) => {
    const startFrame = Math.round(c.start * fps);
    const endFrame = Math.round(c.end * fps);
    return frame >= startFrame && frame < endFrame;
  });

  let fallbackLegacy: WordTiming | undefined;
  for (let i = legacyChunks.length - 1; i >= 0; i--) {
    const endFrame = Math.round(legacyChunks[i].end * fps);
    if (frame >= endFrame) {
      fallbackLegacy = legacyChunks[i];
      break;
    }
  }
  const displayLegacy = activeLegacy ?? fallbackLegacy;

  if (!displayLegacy) return null;

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
          maxWidth: "min(1400px, 92vw)",
          display: "inline-block",
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily,
            lineHeight: 1.4,
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: highlightColor,
          }}
        >
          {displayLegacy.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
