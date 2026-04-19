import { PartRenderer } from "../../../../shared/components/PartRenderer";
import { getPartAudio } from "../../../../shared/lib/part-audio";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { brollManifest } from "../../data/broll-manifest";
import { audioManifest } from "../../data/audio-manifest";
import { alignmentManifest } from "../../data/alignment-manifest";
import type { SequenceEntry } from "../../../../shared/lib/sequence-types";
import type { Lang } from "../../../../shared/schemas/video-schema";

const QUOTE_CN = "这是我人生最后一个大的创业项目。我愿意押上全部声誉。";
const QUOTE_EN = "This is my final major entrepreneurial project. I'm willing to stake my entire reputation on it.";
const ATTRIBUTION_CN = "雷军 · 2021 年 3 月 30 日";
const ATTRIBUTION_EN = "Lei Jun · March 30, 2021";

export const Part1: React.FC<{ lang: Lang }> = ({ lang }) => {
  const content = lang === "cn" ? contentCN.part1 : contentEN.part1;
  const audio = getPartAudio(alignmentManifest, audioManifest, lang, "part1");

  const sequences: SequenceEntry[] = [
    { kind: "title", lineIdx: 0 },
    { kind: "video", lineIdx: 1, brollKey: "p1_2013", videoOpacity: 0.45 },
    { kind: "video", lineIdx: 2, brollKey: "p1_stage", videoOpacity: 0.35 },
    { kind: "video", lineIdx: 3, brollKey: "p1_apple", videoOpacity: 0.45 },
    { kind: "video", lineIdx: 4, brollKey: "p1_closeup", videoOpacity: 0.35 },
    {
      kind: "quote",
      lineIdx: 5,
      text: lang === "cn" ? QUOTE_CN : QUOTE_EN,
      attribution: lang === "cn" ? ATTRIBUTION_CN : ATTRIBUTION_EN,
    },
    { kind: "video", lineIdx: 6, brollKey: "p1_contemplative", videoOpacity: 0.4 },
  ];

  return (
    <PartRenderer
      lang={lang}
      partKey="part1"
      sequences={sequences}
      content={content}
      broll={brollManifest.part1}
      audio={audio}
    />
  );
};
