import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { VideoSequence } from "./renderers/VideoSequence";
import { ChartSequence } from "./renderers/ChartSequence";
import { TitleSequence } from "./renderers/TitleSequence";
import { QuoteSequence } from "./renderers/QuoteSequence";
import { EndingSequence } from "./renderers/EndingSequence";
import type { Lang } from "../schemas/video-schema";
import type { SequenceEntry } from "../lib/sequence-types";
import { getDisplayFont, getBodyFont } from "../lib/fonts";
import type { PartAudioConfig } from "../lib/part-audio";

const ENDING_DUR = 300;

export type PartContent = {
  title: string;
  subtitle: string;
  narration: string[];
};

export type BrollEntry = { file: string; startFrom: number };

type PartRendererProps = {
  lang: Lang;
  partKey: string;
  sequences: SequenceEntry[];
  content: PartContent;
  broll: Record<string, BrollEntry>;
  audio: PartAudioConfig;
};

export const PartRenderer: React.FC<PartRendererProps> = ({
  lang,
  sequences,
  content: c,
  broll,
  audio,
}) => {
  const displayFont = getDisplayFont(lang);
  const bodyFont = getBodyFont(lang);

  // Narration sequences carry lineIdx; ending does not.
  const narrationMeta = sequences
    .map((seq, i) =>
      seq.kind !== "ending" ? { idx: i, lineKey: `line${seq.lineIdx + 1}` } : null
    )
    .filter((x): x is { idx: number; lineKey: string } => x !== null);

  const getNextLineKey = (seqIndex: number): string | null => {
    const pos = narrationMeta.findIndex((m) => m.idx === seqIndex);
    return pos >= 0 && pos < narrationMeta.length - 1
      ? narrationMeta[pos + 1].lineKey
      : null;
  };

  let t = 0;
  const elements: React.ReactNode[] = [];

  if (audio.mode === "continuous") {
    elements.push(
      <Sequence key="part-audio" from={0} durationInFrames={audio.totalAudioFrames}>
        <Audio src={staticFile(audio.file)} />
      </Sequence>
    );
  }

  for (let i = 0; i < sequences.length; i++) {
    const seq = sequences[i];

    if (seq.kind === "ending") {
      const b = broll[seq.brollKey];
      elements.push(
        <Sequence key={`seq-${i}`} from={t} durationInFrames={ENDING_DUR}>
          <EndingSequence
            lang={lang}
            brollFile={b.file}
            brollStartFrom={b.startFrom}
            videoOpacity={seq.videoOpacity}
            Component={seq.component}
          />
        </Sequence>
      );
      t += ENDING_DUR;
      continue;
    }

    const lineKey = `line${seq.lineIdx + 1}`;
    const nextLineKey = getNextLineKey(i);

    const line =
      audio.mode === "continuous" ? audio.alignment.lines[lineKey] : undefined;
    const legacyAudio =
      audio.mode === "per-line" ? audio.legacy[lineKey] : undefined;
    const fallbackText =
      audio.mode === "per-line" ? c.narration[seq.lineIdx] : undefined;

    const duration =
      audio.mode === "continuous"
        ? audio.lineDur(lineKey, nextLineKey)
        : legacyAudio
          ? audio.dur(legacyAudio.duration)
          : 0;

    let body: React.ReactNode;
    switch (seq.kind) {
      case "video": {
        const b = broll[seq.brollKey];
        body = (
          <VideoSequence
            lang={lang}
            brollFile={b.file}
            brollStartFrom={b.startFrom}
            videoOpacity={seq.videoOpacity}
            line={line}
            legacyAudio={legacyAudio}
            fallbackText={fallbackText}
            bodyFont={bodyFont}
          />
        );
        break;
      }
      case "chart":
        body = (
          <ChartSequence
            lang={lang}
            Component={seq.component}
            line={line}
            legacyAudio={legacyAudio}
            fallbackText={fallbackText}
            bodyFont={bodyFont}
          />
        );
        break;
      case "title":
        body = (
          <TitleSequence
            title={seq.usePartTitle ?? true ? c.title : (seq.title ?? "")}
            subtitle={seq.usePartTitle ?? true ? c.subtitle : (seq.subtitle ?? "")}
            displayFont={displayFont}
            bodyFont={bodyFont}
            line={line}
            legacyAudio={legacyAudio}
            fallbackText={fallbackText}
          />
        );
        break;
      case "quote":
        body = (
          <QuoteSequence
            text={seq.text}
            attribution={seq.attribution}
            displayFont={displayFont}
            bodyFont={bodyFont}
            line={line}
            legacyAudio={legacyAudio}
            fallbackText={fallbackText}
          />
        );
        break;
    }

    elements.push(
      <Sequence key={`seq-${i}`} from={t} durationInFrames={duration}>
        {body}
      </Sequence>
    );
    t += duration;
  }

  return <AbsoluteFill>{elements}</AbsoluteFill>;
};
