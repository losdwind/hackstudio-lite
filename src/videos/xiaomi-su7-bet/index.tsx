import { Composition, Folder } from "remotion";
import { VideoSchema } from "../../shared/schemas/video-schema";
import { computeTotalFrames, computePartFrames } from "../../shared/lib/compute-durations";
import { alignmentManifest } from "./data/alignment-manifest";
import { audioManifest } from "./data/audio-manifest";
import { MasterComposition } from "./components/MasterComposition";
import { Part1 } from "./components/part1/Part1";
import { Part2 } from "./components/part2/Part2";
import { Part3 } from "./components/part3/Part3";
import { Part4 } from "./components/part4/Part4";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

/**
 * At least 1 frame so Remotion registers the composition even before TTS runs.
 * After `bun run scripts/generate-tts.ts`, these pick up real durations.
 */
const safeFrames = (n: number) => Math.max(1, n);

export const xiaomiSU7BetCompositions = () => {
  const cnTotal = safeFrames(computeTotalFrames(alignmentManifest, audioManifest, "cn"));
  const enTotal = safeFrames(computeTotalFrames(alignmentManifest, audioManifest, "en"));
  const cnParts = computePartFrames(alignmentManifest, audioManifest, "cn");
  const enParts = computePartFrames(alignmentManifest, audioManifest, "en");

  return (
    <Folder name="xiaomi-su7-bet">
      <Composition
        id="XiaomiSU7Bet-CN"
        component={MasterComposition}
        durationInFrames={cnTotal}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={VideoSchema}
        defaultProps={{ lang: "cn" as const }}
      />
      <Composition
        id="XiaomiSU7Bet-EN"
        component={MasterComposition}
        durationInFrames={enTotal}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={VideoSchema}
        defaultProps={{ lang: "en" as const }}
      />

      {/* Per-part preview compositions */}
      <Folder name="parts-cn">
        <Composition
          id="XiaomiSU7Bet-Part1-CN"
          component={Part1}
          durationInFrames={safeFrames(cnParts.part1)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          schema={VideoSchema}
          defaultProps={{ lang: "cn" as const }}
        />
        <Composition
          id="XiaomiSU7Bet-Part2-CN"
          component={Part2}
          durationInFrames={safeFrames(cnParts.part2)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          schema={VideoSchema}
          defaultProps={{ lang: "cn" as const }}
        />
        <Composition
          id="XiaomiSU7Bet-Part3-CN"
          component={Part3}
          durationInFrames={safeFrames(cnParts.part3)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          schema={VideoSchema}
          defaultProps={{ lang: "cn" as const }}
        />
        <Composition
          id="XiaomiSU7Bet-Part4-CN"
          component={Part4}
          durationInFrames={safeFrames(cnParts.part4)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          schema={VideoSchema}
          defaultProps={{ lang: "cn" as const }}
        />
      </Folder>

      <Folder name="parts-en">
        <Composition
          id="XiaomiSU7Bet-Part1-EN"
          component={Part1}
          durationInFrames={safeFrames(enParts.part1)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          schema={VideoSchema}
          defaultProps={{ lang: "en" as const }}
        />
        <Composition
          id="XiaomiSU7Bet-Part2-EN"
          component={Part2}
          durationInFrames={safeFrames(enParts.part2)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          schema={VideoSchema}
          defaultProps={{ lang: "en" as const }}
        />
        <Composition
          id="XiaomiSU7Bet-Part3-EN"
          component={Part3}
          durationInFrames={safeFrames(enParts.part3)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          schema={VideoSchema}
          defaultProps={{ lang: "en" as const }}
        />
        <Composition
          id="XiaomiSU7Bet-Part4-EN"
          component={Part4}
          durationInFrames={safeFrames(enParts.part4)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          schema={VideoSchema}
          defaultProps={{ lang: "en" as const }}
        />
      </Folder>
    </Folder>
  );
};
