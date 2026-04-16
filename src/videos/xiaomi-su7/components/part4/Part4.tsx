import { PartRenderer, type SequenceEntry } from "../../../../shared/components/PartRenderer";
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
  { type: "narration", lineIdx: 0, brollKey: "narration1", showTitle: true },
  { type: "narration", lineIdx: 1, brollKey: "narration2" },
  { type: "narration", lineIdx: 2, brollKey: "narration3" },
  { type: "narration", lineIdx: 3, brollKey: "narration4", Overlay: SpecComparison, overlayOpacity: 0.85 },
  { type: "narration", lineIdx: 4, brollKey: "narration5", Overlay: PricingBalance, overlayOpacity: 0.85 },
  { type: "narration", lineIdx: 5, brollKey: "narration6" },
  { type: "narration", lineIdx: 6, brollKey: "narration7", Overlay: SalesCounter, overlayOpacity: 0.8 },
  { type: "narration", lineIdx: 7, brollKey: "narration8" },
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
