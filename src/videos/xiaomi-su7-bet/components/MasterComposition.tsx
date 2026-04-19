import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { computePartFrames } from "../../../shared/lib/compute-durations";
import { alignmentManifest } from "../data/alignment-manifest";
import { audioManifest } from "../data/audio-manifest";
import { Part1 } from "./part1/Part1";
import { Part2 } from "./part2/Part2";
import { Part3 } from "./part3/Part3";
import { Part4 } from "./part4/Part4";
import type { Lang } from "../../../shared/schemas/video-schema";

const TRANSITION_FRAMES = 15;

export const MasterComposition: React.FC<{ lang: Lang }> = ({ lang }) => {
  const partFrames = computePartFrames(alignmentManifest, audioManifest, lang);

  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={Math.max(1, partFrames.part1)}>
          <Part1 lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={Math.max(1, partFrames.part2)}>
          <Part2 lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={Math.max(1, partFrames.part3)}>
          <Part3 lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={Math.max(1, partFrames.part4)}>
          <Part4 lang={lang} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
