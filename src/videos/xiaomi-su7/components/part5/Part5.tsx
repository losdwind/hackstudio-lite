import { PartRenderer, type SequenceEntry } from "../../../../shared/components/PartRenderer";
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
  { type: "narration", lineIdx: 0, brollKey: "narration1", showTitle: true },
  { type: "narration", lineIdx: 1, brollKey: "narration2", Overlay: EcosystemDiagram, overlayOpacity: 0.85 },
  { type: "narration", lineIdx: 2, brollKey: "narration3" },
  { type: "narration", lineIdx: 3, brollKey: "narration4" },
  { type: "narration", lineIdx: 4, brollKey: "narration5" },
  { type: "narration", lineIdx: 5, brollKey: "narration6" },
  { type: "narration", lineIdx: 6, brollKey: "narration7" },
  { type: "ending", brollKey: "ending", Overlay: EndingSubtitles, overlayOpacity: 0.75 },
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
