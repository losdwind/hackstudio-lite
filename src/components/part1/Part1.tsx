import { PartRenderer, type SequenceEntry } from "../common/PartRenderer";
import { EVPenetrationChart } from "./EVPenetrationChart";
import { XiaomiTimeline } from "./XiaomiTimeline";
import type { Lang } from "../../schemas/video-schema";

const sequences: SequenceEntry[] = [
  { type: "title" },
  { type: "narration", lineIdx: 0, brollKey: "narration1" },
  { type: "narration", lineIdx: 1, brollKey: "narration2" },
  { type: "narration", lineIdx: 2, brollKey: "evChart", Overlay: EVPenetrationChart, overlayOpacity: 0.8 },
  { type: "narration", lineIdx: 3, brollKey: "narration3" },
  { type: "narration", lineIdx: 4, brollKey: "timeline", Overlay: XiaomiTimeline, overlayOpacity: 0.8 },
  { type: "narration", lineIdx: 5, brollKey: "narration4" },
];

export const Part1: React.FC<{ lang: Lang }> = ({ lang }) => (
  <PartRenderer lang={lang} partKey="part1" sequences={sequences} />
);
