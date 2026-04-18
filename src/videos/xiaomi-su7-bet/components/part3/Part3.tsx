import { PartRenderer } from "../../../../shared/components/PartRenderer";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { Su7VsModel3Card } from "./Su7VsModel3Card";
import { PricingScale } from "./PricingScale";
import { OrderCounter } from "./OrderCounter";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { audioManifest } from "../../data/audio-manifest";

const sequences: SequenceEntry[] = [
  { kind: "title", lineIdx: 0 },
  { kind: "chart", lineIdx: 1, component: Su7VsModel3Card },
  { kind: "video", lineIdx: 2, brollKey: "narration3" },
  { kind: "chart", lineIdx: 3, component: PricingScale },
  { kind: "chart", lineIdx: 4, component: OrderCounter },
  { kind: "video", lineIdx: 5, brollKey: "narration6" },
];

export const Part3: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = (lang === "cn" ? contentCN : contentEN).part3;
  return (
    <PartRenderer
      lang={lang}
      partKey="part3"
      sequences={sequences}
      content={content}
      broll={brollManifest.part3}
      audio={getPartAudio(alignmentManifest, audioManifest as never, lang, "part3")}
    />
  );
};
