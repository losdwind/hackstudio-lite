import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Background } from "./common/Background";
import { Part1 } from "./part1/Part1";
import { Part2 } from "./part2/Part2";
import { Part3 } from "./part3/Part3";
import { Part4 } from "./part4/Part4";
import type { VideoProps } from "../schemas/video-schema";

// Section frame counts (must match the sum of Sequence durations in each Part)
const PART1_FRAMES = 1500; // ~50s
const PART2_FRAMES = 1500; // ~50s
const PART3_FRAMES = 1800; // ~60s
const PART4_FRAMES = 1950; // ~65s
const TRANSITION_FRAMES = 15;

export const TOTAL_FRAMES =
  PART1_FRAMES +
  PART2_FRAMES +
  PART3_FRAMES +
  PART4_FRAMES -
  3 * TRANSITION_FRAMES; // subtract 3 transitions

export const MasterComposition: React.FC<VideoProps> = ({ lang }) => {
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={PART1_FRAMES}>
          <Part1 lang={lang} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={PART2_FRAMES}>
          <Part2 lang={lang} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={PART3_FRAMES}>
          <Part3 lang={lang} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={PART4_FRAMES}>
          <Part4 lang={lang} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
