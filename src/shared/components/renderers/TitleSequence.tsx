import { StaticBackground } from "../StaticBackground";
import { SectionTitle } from "../SectionTitle";
import { SubtitleOverlay } from "../SubtitleOverlay";
import { NarrationAudio } from "../NarrationAudio";
import type { LineTiming } from "../../lib/alignment-types";

type TitleSequenceProps = {
  title: string;
  subtitle: string;
  displayFont: string;
  bodyFont: string;
  line?: LineTiming;
  legacyAudio?: { file: string; duration: number };
  fallbackText?: string;
};

export const TitleSequence: React.FC<TitleSequenceProps> = ({
  title,
  subtitle,
  displayFont,
  bodyFont,
  line,
  legacyAudio,
  fallbackText,
}) => (
  <>
    <StaticBackground tone="calm" />
    <SectionTitle
      title={title}
      subtitle={subtitle}
      displayFont={displayFont}
      bodyFont={bodyFont}
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
