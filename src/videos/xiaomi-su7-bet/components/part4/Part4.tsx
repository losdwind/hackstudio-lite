import { PartRenderer } from "../../../../shared/components/PartRenderer";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { audioManifest } from "../../data/audio-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { OrderCounter } from "./OrderCounter";
import { EndingCard } from "./EndingCard";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import type { Lang } from "../../../../shared/schemas/video-schema";

export const Part4: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = lang === "cn" ? contentCN.part4 : contentEN.part4;
  const audio = getPartAudio(alignmentManifest, audioManifest, lang, "part4");

  const sequences: SequenceEntry[] = [
    { kind: "title", lineIdx: 0 },
    { kind: "chart", lineIdx: 1, component: OrderCounter },
    { kind: "video", lineIdx: 2, brollKey: "p4_western_media", videoOpacity: 0.45 },
    { kind: "video", lineIdx: 3, brollKey: "p4_split_ceo", videoOpacity: 0.45 },
    { kind: "video", lineIdx: 4, brollKey: "p4_cook_close", videoOpacity: 0.4 },
    { kind: "video", lineIdx: 5, brollKey: "p4_lei_determined", videoOpacity: 0.35 },
    { kind: "video", lineIdx: 6, brollKey: "p4_final_narration", videoOpacity: 0.4 },
    {
      kind: "ending",
      brollKey: "p4_ending",
      component: EndingCard,
      videoOpacity: 0.75,
    },
  ];

  return (
    <PartRenderer
      lang={lang}
      partKey="part4"
      sequences={sequences}
      content={content}
      broll={brollManifest.part4}
      audio={audio}
    />
  );
};
