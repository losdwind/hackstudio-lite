import { PartRenderer } from "../../../../shared/components/PartRenderer";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { InvestmentComparison } from "./InvestmentComparison";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { audioManifest } from "../../data/audio-manifest";

const sequences: SequenceEntry[] = [
  { kind: "title", lineIdx: 0 },
  { kind: "video", lineIdx: 1, brollKey: "narration2" },
  { kind: "video", lineIdx: 2, brollKey: "narration3" },
  { kind: "video", lineIdx: 3, brollKey: "narration4" },
  { kind: "chart", lineIdx: 4, component: InvestmentComparison },
  { kind: "video", lineIdx: 5, brollKey: "narration6" },
  { kind: "video", lineIdx: 6, brollKey: "narration7" },
  { kind: "video", lineIdx: 7, brollKey: "narration8" },
  { kind: "video", lineIdx: 8, brollKey: "narration9" },
  { kind: "video", lineIdx: 9, brollKey: "narration10" },
];

export const Part2: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = (lang === "cn" ? contentCN : contentEN).part2;
  return (
    <PartRenderer
      lang={lang}
      partKey="part2"
      sequences={sequences}
      content={content}
      broll={brollManifest.part2}
      audio={getPartAudio(alignmentManifest, audioManifest as never, lang, "part2")}
    />
  );
};
