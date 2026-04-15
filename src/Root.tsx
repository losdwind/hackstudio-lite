import "./index.css";
import { Composition, Folder } from "remotion";
import { VideoSchema } from "./schemas/video-schema";
import { MasterComposition, TOTAL_FRAMES } from "./components/MasterComposition";
import { Part1 } from "./components/part1/Part1";
import { Part2 } from "./components/part2/Part2";
import { Part3 } from "./components/part3/Part3";
import { Part4 } from "./components/part4/Part4";
import { EVPenetrationChart } from "./components/part1/EVPenetrationChart";
import { XiaomiTimeline } from "./components/part1/XiaomiTimeline";
import { TalentFlowDiagram } from "./components/part2/TalentFlowDiagram";
import { InvestmentComparison } from "./components/part2/InvestmentComparison";
import { SpecComparison } from "./components/part3/SpecComparison";
import { PricingBalance } from "./components/part3/PricingBalance";
import { SalesCounter } from "./components/part3/SalesCounter";
import { EcosystemDiagram } from "./components/part4/EcosystemDiagram";
import { GlobalExpansionMap } from "./components/part4/GlobalExpansionMap";
import { EndingSubtitles } from "./components/part4/EndingSubtitles";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Xiaomi-SU7">
        {/* Full Videos */}
        <Folder name="Full-Video">
          <Composition
            id="XiaomiSU7-CN"
            component={MasterComposition}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="XiaomiSU7-EN"
            component={MasterComposition}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "en" as const }}
          />
        </Folder>

        {/* Individual Sections */}
        <Folder name="Sections">
          <Composition
            id="Section1-WhyMakeCars"
            component={Part1}
            durationInFrames={1500}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Section2-TenBillionBet"
            component={Part2}
            durationInFrames={1500}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Section3-FightingBattle"
            component={Part3}
            durationInFrames={1800}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Section4-BiggerStory"
            component={Part4}
            durationInFrames={1950}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
        </Folder>

        {/* Individual Animations */}
        <Folder name="Animations">
          <Composition
            id="Anim01-EVChart"
            component={EVPenetrationChart}
            durationInFrames={300}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Anim02-Timeline"
            component={XiaomiTimeline}
            durationInFrames={300}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Anim03-TalentFlow"
            component={TalentFlowDiagram}
            durationInFrames={300}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Anim04-Investment"
            component={InvestmentComparison}
            durationInFrames={240}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Anim05-SpecComparison"
            component={SpecComparison}
            durationInFrames={360}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Anim06-PricingBalance"
            component={PricingBalance}
            durationInFrames={300}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Anim07-SalesCounter"
            component={SalesCounter}
            durationInFrames={300}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Anim08-Ecosystem"
            component={EcosystemDiagram}
            durationInFrames={360}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Anim09-GlobalMap"
            component={GlobalExpansionMap}
            durationInFrames={420}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
          <Composition
            id="Anim10-EndingText"
            component={EndingSubtitles}
            durationInFrames={300}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            schema={VideoSchema}
            defaultProps={{ lang: "cn" as const }}
          />
        </Folder>
      </Folder>
    </>
  );
};
