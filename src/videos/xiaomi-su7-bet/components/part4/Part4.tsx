import { PartRenderer } from "../../../../shared/components/PartRenderer";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { ChinaAutoGlobalMap } from "./ChinaAutoGlobalMap";
import { EcosystemDiagram } from "./EcosystemDiagram";
import { ClosingTitle } from "./ClosingTitle";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { audioManifest } from "../../data/audio-manifest";

const sequences: SequenceEntry[] = [
  { kind: "title", lineIdx: 0 },
  { kind: "video", lineIdx: 1, brollKey: "narration2" },
  { kind: "chart", lineIdx: 2, component: ChinaAutoGlobalMap },
  { kind: "chart", lineIdx: 3, component: EcosystemDiagram },
  { kind: "chart", lineIdx: 4, component: ClosingTitle },
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
