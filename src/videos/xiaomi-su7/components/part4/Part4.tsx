import { PartRenderer } from "../../../../shared/components/PartRenderer";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { SpecComparison } from "../part3/SpecComparison";
import { PricingBalance } from "../part3/PricingBalance";
import { SalesCounter } from "../part3/SalesCounter";
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
  { kind: "chart", lineIdx: 3, component: SpecComparison },
  { kind: "chart", lineIdx: 4, component: PricingBalance },
  { kind: "video", lineIdx: 5, brollKey: "narration6" },
  { kind: "chart", lineIdx: 6, component: SalesCounter },
  { kind: "video", lineIdx: 7, brollKey: "narration8" },
];

export const Part4: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = (lang === "cn" ? contentCN : contentEN).part4;
  return (
    <PartRenderer
      lang={lang}
      partKey="part4"
      sequences={sequences}
      content={content}
      broll={brollManifest.part4}
      audio={getPartAudio(alignmentManifest, audioManifest as never, lang, "part4")}
    />
  );
};
