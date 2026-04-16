import { PartRenderer, type SequenceEntry } from "../common/PartRenderer";
import { EcosystemDiagram } from "./EcosystemDiagram";
import { GlobalExpansionMap } from "./GlobalExpansionMap";
import { EndingSubtitles } from "./EndingSubtitles";
import type { Lang } from "../../schemas/video-schema";

const sequences: SequenceEntry[] = [
  { type: "title" },
  { type: "narration", lineIdx: 0, brollKey: "narration1" },
  { type: "narration", lineIdx: 1, brollKey: "ecosystem", Overlay: EcosystemDiagram, overlayOpacity: 0.85 },
  { type: "narration", lineIdx: 2, brollKey: "narration2" },
  { type: "narration", lineIdx: 3, brollKey: "map", Overlay: GlobalExpansionMap, overlayOpacity: 0.85 },
  { type: "narration", lineIdx: 4, brollKey: "narration3" },
  { type: "ending", brollKey: "ending", Overlay: EndingSubtitles, overlayOpacity: 0.75 },
];

export const Part4: React.FC<{ lang: Lang }> = ({ lang }) => (
  <PartRenderer lang={lang} partKey="part4" sequences={sequences} />
);
