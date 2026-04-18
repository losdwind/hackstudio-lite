import { AbsoluteFill } from "remotion";
import { StaticBackground } from "../StaticBackground";
import { SubtitleOverlay } from "../SubtitleOverlay";
import { NarrationAudio } from "../NarrationAudio";
import type { LineTiming } from "../../lib/alignment-types";

type QuoteSequenceProps = {
  text: string;
  attribution?: string;
  displayFont: string;
  bodyFont: string;
  line?: LineTiming;
  legacyAudio?: { file: string; duration: number };
  fallbackText?: string;
};

export const QuoteSequence: React.FC<QuoteSequenceProps> = ({
  text,
  attribution,
  displayFont,
  bodyFont,
  line,
  legacyAudio,
  fallbackText,
}) => (
  <>
    <StaticBackground tone="warm" />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "8rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: displayFont,
          fontSize: "4.5rem",
          lineHeight: 1.2,
          color: "rgba(255,255,255,0.95)",
          fontWeight: 600,
          maxWidth: "1600px",
        }}
      >
        {`"${text}"`}
      </div>
      {attribution && (
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: "1.75rem",
            color: "rgba(255,255,255,0.6)",
            marginTop: "2.5rem",
            letterSpacing: "0.05em",
          }}
        >
          — {attribution}
        </div>
      )}
    </AbsoluteFill>
    {line && (
      <SubtitleOverlay
        words={line.words}
        lineStartTime={line.startTime}
        fontFamily={bodyFont}
      />
    )}
    {!line && legacyAudio && fallbackText && (
      <>
        <NarrationAudio src={legacyAudio.file} />
        <SubtitleOverlay
          text={fallbackText}
          audioDuration={legacyAudio.duration}
          fontFamily={bodyFont}
        />
      </>
    )}
  </>
);
