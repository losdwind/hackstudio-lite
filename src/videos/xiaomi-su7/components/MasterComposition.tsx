import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Background } from "../../../shared/components/Background";
import { Part1 } from "./part1/Part1";
import { Part2 } from "./part2/Part2";
import { Part3 } from "./part3/Part3";
import { Part4 } from "./part4/Part4";
import { Part5 } from "./part5/Part5";
import type { VideoProps } from "../../../shared/schemas/video-schema";
import { computePartFrames, computeTotalFrames } from "../../../shared/lib/compute-durations";
import { alignmentManifest } from "../data/alignment-manifest";
import { audioManifest } from "../data/audio-manifest";

const TRANSITION_FRAMES = 15;

export const TOTAL_FRAMES = computeTotalFrames(alignmentManifest, audioManifest as never, "cn");

export const MasterComposition: React.FC<VideoProps> = ({ lang }) => {
  const parts = computePartFrames(alignmentManifest, audioManifest as never, lang);

  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={parts.part1}>
          <Part1 lang={lang} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={parts.part2}>
          <Part2 lang={lang} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={parts.part3}>
          <Part3 lang={lang} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={parts.part4}>
          <Part4 lang={lang} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={parts.part5}>
          <Part5 lang={lang} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
