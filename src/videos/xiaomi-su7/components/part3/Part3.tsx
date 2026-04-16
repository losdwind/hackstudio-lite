import { PartRenderer, type SequenceEntry } from "../../../../shared/components/PartRenderer";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import type { Lang } from "../../../../shared/schemas/video-schema";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { audioManifest } from "../../data/audio-manifest";

// Part 3: "Why Big Companies Die"
// Animation overlays (ThreeKillers, TenX) to be built separately.
const sequences: SequenceEntry[] = [
  { type: "narration", lineIdx: 0, brollKey: "narration1", showTitle: true },
  { type: "narration", lineIdx: 1, brollKey: "narration2" },
  { type: "narration", lineIdx: 2, brollKey: "narration3" },
  { type: "narration", lineIdx: 3, brollKey: "narration4" },
  { type: "narration", lineIdx: 4, brollKey: "narration5" },
  { type: "narration", lineIdx: 5, brollKey: "narration6" },
  { type: "narration", lineIdx: 6, brollKey: "narration7" },
  { type: "narration", lineIdx: 7, brollKey: "narration8" },
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
