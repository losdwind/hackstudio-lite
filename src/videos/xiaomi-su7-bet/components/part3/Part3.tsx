import { PartRenderer } from "../../../../shared/components/PartRenderer";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { audioManifest } from "../../data/audio-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { PriceCompareChart } from "./PriceCompareChart";
import { SpecGrid } from "./SpecGrid";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import type { Lang } from "../../../../shared/schemas/video-schema";

export const Part3: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = lang === "cn" ? contentCN.part3 : contentEN.part3;
  const audio = getPartAudio(alignmentManifest, audioManifest, lang, "part3");

  const sequences: SequenceEntry[] = [
    { kind: "title", lineIdx: 0 },
    { kind: "video", lineIdx: 1, brollKey: "p3_reveal", videoOpacity: 0.35 },
    { kind: "chart", lineIdx: 2, component: PriceCompareChart },
    { kind: "video", lineIdx: 3, brollKey: "p3_driving", videoOpacity: 0.35 },
    { kind: "chart", lineIdx: 4, component: SpecGrid },
    { kind: "video", lineIdx: 5, brollKey: "p3_luxury_ev", videoOpacity: 0.45 },
    { kind: "video", lineIdx: 6, brollKey: "p3_lei_stage", videoOpacity: 0.35 },
  ];

  return (
    <PartRenderer
      lang={lang}
      partKey="part3"
      sequences={sequences}
      content={content}
      broll={brollManifest.part3}
      audio={audio}
    />
  );
};
