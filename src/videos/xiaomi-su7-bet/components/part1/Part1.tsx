import { PartRenderer } from "../../../../shared/components/PartRenderer";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { EvPenetrationChart } from "./EvPenetrationChart";
import { XiaomiTimeline } from "./XiaomiTimeline";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { audioManifest } from "../../data/audio-manifest";

const sequences: SequenceEntry[] = [
  { kind: "title", lineIdx: 0 },
  { kind: "chart", lineIdx: 1, component: XiaomiTimeline },
  { kind: "chart", lineIdx: 2, component: EvPenetrationChart },
  { kind: "video", lineIdx: 3, brollKey: "narration4" },
];

export const Part1: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = (lang === "cn" ? contentCN : contentEN).part1;
  return (
    <PartRenderer
      lang={lang}
      partKey="part1"
      sequences={sequences}
      content={content}
      broll={brollManifest.part1}
      audio={getPartAudio(alignmentManifest, audioManifest as never, lang, "part1")}
    />
  );
};
