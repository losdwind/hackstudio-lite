import { PartRenderer, type SequenceEntry } from "../common/PartRenderer";
import { TalentFlowDiagram } from "./TalentFlowDiagram";
import { InvestmentComparison } from "./InvestmentComparison";
import type { Lang } from "../../schemas/video-schema";

const sequences: SequenceEntry[] = [
  { type: "title" },
  { type: "narration", lineIdx: 0, brollKey: "narration1" },
  { type: "narration", lineIdx: 1, brollKey: "narration2" },
  { type: "narration", lineIdx: 2, brollKey: "talentFlow", Overlay: TalentFlowDiagram, overlayOpacity: 0.8 },
  { type: "narration", lineIdx: 3, brollKey: "narration3" },
  { type: "narration", lineIdx: 4, brollKey: "investment", Overlay: InvestmentComparison, overlayOpacity: 0.8 },
  { type: "narration", lineIdx: 5, brollKey: "narration4" },
];

export const Part2: React.FC<{ lang: Lang }> = ({ lang }) => (
  <PartRenderer lang={lang} partKey="part2" sequences={sequences} />
);
