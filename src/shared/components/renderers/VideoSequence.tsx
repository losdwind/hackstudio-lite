import { VideoBackground } from "../VideoBackground";
import { SubtitleOverlay } from "../SubtitleOverlay";
import { NarrationAudio } from "../NarrationAudio";
import type { Lang } from "../../schemas/video-schema";
import type { LineTiming } from "../../lib/alignment-types";

type VideoSequenceProps = {
  lang: Lang;
  brollFile: string;
  brollStartFrom: number;
  videoOpacity?: number;
  // Continuous mode
  line?: LineTiming;
  // Per-line mode
  legacyAudio?: { file: string; duration: number };
  fallbackText?: string;
  bodyFont: string;
};

export const VideoSequence: React.FC<VideoSequenceProps> = ({
  brollFile,
  brollStartFrom,
  videoOpacity,
  line,
  legacyAudio,
  fallbackText,
  bodyFont,
}) => (
  <>
    <VideoBackground
      src={brollFile}
      startFrom={brollStartFrom}
      overlayOpacity={videoOpacity ?? 0.25}
    />
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
