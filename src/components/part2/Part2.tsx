import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../common/Background";
import { SectionTitle } from "../common/SectionTitle";
import { TalentFlowDiagram } from "./TalentFlowDiagram";
import { InvestmentComparison } from "./InvestmentComparison";
import type { Lang } from "../../schemas/video-schema";
import { getFontFamily } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { COLORS } from "../../lib/colors";

type Props = { lang: Lang };

const TITLE_DURATION = 120;
const NARRATION_1_DURATION = 300;
const TALENT_FLOW_DURATION = 300;
const NARRATION_2_DURATION = 240;
const INVESTMENT_DURATION = 240;
const NARRATION_3_DURATION = 300;

export const Part2: React.FC<Props> = ({ lang }) => {
  const fontFamily = getFontFamily(lang);
  const content = lang === "cn" ? contentCN.part2 : contentEN.part2;

  let t = 0;

  return (
    <AbsoluteFill>
      <Background />

      <Sequence from={t} durationInFrames={TITLE_DURATION} name="Part2-Title">
        <SectionTitle
          title={content.title}
          subtitle={content.subtitle}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += TITLE_DURATION)}

      <Sequence
        from={t}
        durationInFrames={NARRATION_1_DURATION}
        name="Part2-Narration1"
      >
        <NarrationScreen
          lines={[content.narration[0], content.narration[1]]}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += NARRATION_1_DURATION)}

      <Sequence
        from={t}
        durationInFrames={TALENT_FLOW_DURATION}
        name="Part2-TalentFlow"
      >
        <TalentFlowDiagram lang={lang} />
      </Sequence>
      {(t += TALENT_FLOW_DURATION)}

      <Sequence
        from={t}
        durationInFrames={NARRATION_2_DURATION}
        name="Part2-Narration2"
      >
        <NarrationScreen
          lines={[content.narration[2]]}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += NARRATION_2_DURATION)}

      <Sequence
        from={t}
        durationInFrames={INVESTMENT_DURATION}
        name="Part2-Investment"
      >
        <InvestmentComparison lang={lang} />
      </Sequence>
      {(t += INVESTMENT_DURATION)}

      <Sequence
        from={t}
        durationInFrames={NARRATION_3_DURATION}
        name="Part2-Narration3"
      >
        <NarrationScreen
          lines={[content.narration[3]]}
          fontFamily={fontFamily}
          highlight
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const NarrationScreen: React.FC<{
  lines: string[];
  fontFamily: string;
  highlight?: boolean;
}> = ({ lines, fontFamily, highlight }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          maxWidth: 1200,
        }}
      >
        {lines.map((line, i) => (
          <p
            key={i}
            style={{
              fontSize: highlight ? 44 : 36,
              fontWeight: highlight ? 700 : 400,
              color: highlight ? COLORS.xiaomiOrange : COLORS.textSecondary,
              lineHeight: 1.6,
              textAlign: "center",
              margin: 0,
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </AbsoluteFill>
  );
};
