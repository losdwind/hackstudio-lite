import { PartRenderer, type SequenceEntry } from "../common/PartRenderer";
import { SpecComparison } from "./SpecComparison";
import { PricingBalance } from "./PricingBalance";
import { SalesCounter } from "./SalesCounter";
import type { Lang } from "../../schemas/video-schema";

const sequences: SequenceEntry[] = [
  { type: "title" },
  { type: "narration", lineIdx: 0, brollKey: "narration1" },
  { type: "narration", lineIdx: 1, brollKey: "narration2" },
  { type: "narration", lineIdx: 2, brollKey: "spec", Overlay: SpecComparison, overlayOpacity: 0.8 },
  { type: "narration", lineIdx: 3, brollKey: "narration3" },
  { type: "narration", lineIdx: 4, brollKey: "balance", Overlay: PricingBalance, overlayOpacity: 0.8 },
  { type: "narration", lineIdx: 5, brollKey: "counter", Overlay: SalesCounter, overlayOpacity: 0.8 },
];

export const Part3: React.FC<{ lang: Lang }> = ({ lang }) => (
  <PartRenderer lang={lang} partKey="part3" sequences={sequences} />
);
