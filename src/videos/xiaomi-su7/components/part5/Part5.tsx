import { PartRenderer } from "../../../../shared/components/PartRenderer";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { EcosystemDiagram } from "../part4/EcosystemDiagram";
import { EndingSubtitles } from "../part4/EndingSubtitles";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { audioManifest } from "../../data/audio-manifest";

const sequences: SequenceEntry[] = [
  { kind: "title", lineIdx: 0 },
  { kind: "chart", lineIdx: 1, component: EcosystemDiagram },
  { kind: "video", lineIdx: 2, brollKey: "narration3" },
  { kind: "video", lineIdx: 3, brollKey: "narration4" },
  { kind: "video", lineIdx: 4, brollKey: "narration5" },
  { kind: "video", lineIdx: 5, brollKey: "narration6" },
  { kind: "video", lineIdx: 6, brollKey: "narration7" },
  { kind: "ending", brollKey: "ending", component: EndingSubtitles },
];

export const Part5: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = (lang === "cn" ? contentCN : contentEN).part5;
  return (
    <PartRenderer
      lang={lang}
      partKey="part5"
      sequences={sequences}
      content={content}
      broll={brollManifest.part5}
      audio={getPartAudio(alignmentManifest, audioManifest as never, lang, "part5")}
    />
  );
};
