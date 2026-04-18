import { StaticBackground } from "../StaticBackground";
import { SubtitleOverlay } from "../SubtitleOverlay";
import { NarrationAudio } from "../NarrationAudio";
import type { Lang } from "../../schemas/video-schema";
import type { LineTiming } from "../../lib/alignment-types";

type ChartSequenceProps = {
  lang: Lang;
  Component: React.ComponentType<{ lang: Lang }>;
  line?: LineTiming;
  legacyAudio?: { file: string; duration: number };
  fallbackText?: string;
  bodyFont: string;
};

export const ChartSequence: React.FC<ChartSequenceProps> = ({
  lang,
  Component,
  line,
  legacyAudio,
  fallbackText,
  bodyFont,
}) => (
  <>
    <StaticBackground tone="calm" />
    <Component lang={lang} />
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
