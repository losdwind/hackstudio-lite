import { PartRenderer } from "../../../../shared/components/PartRenderer";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { audioManifest } from "../../data/audio-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import { EcosystemDiagram } from "./EcosystemDiagram";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import type { Lang } from "../../../../shared/schemas/video-schema";

export const Part2: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = lang === "cn" ? contentCN.part2 : contentEN.part2;
  const audio = getPartAudio(alignmentManifest, audioManifest, lang, "part2");

  const sequences: SequenceEntry[] = [
    { kind: "title", lineIdx: 0 },
    { kind: "video", lineIdx: 1, brollKey: "p2_offices", videoOpacity: 0.4 },
    { kind: "video", lineIdx: 2, brollKey: "p2_engineers", videoOpacity: 0.4 },
    { kind: "video", lineIdx: 3, brollKey: "p2_sv_vs_cn", videoOpacity: 0.45 },
    { kind: "chart", lineIdx: 4, component: EcosystemDiagram },
    { kind: "video", lineIdx: 5, brollKey: "p2_apple_hq", videoOpacity: 0.5 },
    { kind: "video", lineIdx: 6, brollKey: "p2_supply_chain", videoOpacity: 0.4 },
  ];

  return (
    <PartRenderer
      lang={lang}
      partKey="part2"
      sequences={sequences}
      content={content}
      broll={brollManifest.part2}
      audio={audio}
    />
  );
};
