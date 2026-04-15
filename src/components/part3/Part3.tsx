import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../common/Background";
import { SectionTitle } from "../common/SectionTitle";
import { SpecComparison } from "./SpecComparison";
import { PricingBalance } from "./PricingBalance";
import { SalesCounter } from "./SalesCounter";
import type { Lang } from "../../schemas/video-schema";
import { getFontFamily } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { COLORS } from "../../lib/colors";

type Props = { lang: Lang };

const TITLE_DURATION = 120;
const NARRATION_1_DURATION = 240;
const SPEC_DURATION = 360;
const NARRATION_2_DURATION = 180;
const BALANCE_DURATION = 300;
const NARRATION_3_DURATION = 180;
const COUNTER_DURATION = 300;
const NARRATION_4_DURATION = 120;

export const Part3: React.FC<Props> = ({ lang }) => {
  const fontFamily = getFontFamily(lang);
  const content = lang === "cn" ? contentCN.part3 : contentEN.part3;

  let t = 0;

  return (
    <AbsoluteFill>
      <Background />

      <Sequence from={t} durationInFrames={TITLE_DURATION} name="Part3-Title">
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
        name="Part3-Narration1"
      >
        <NarrationScreen
          lines={[content.narration[0], content.narration[1]]}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += NARRATION_1_DURATION)}

      <Sequence from={t} durationInFrames={SPEC_DURATION} name="Part3-Spec">
        <SpecComparison lang={lang} />
      </Sequence>
      {(t += SPEC_DURATION)}

      <Sequence
        from={t}
        durationInFrames={NARRATION_2_DURATION}
        name="Part3-Narration2"
      >
        <NarrationScreen
          lines={[content.narration[2]]}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += NARRATION_2_DURATION)}

      <Sequence
        from={t}
        durationInFrames={BALANCE_DURATION}
        name="Part3-Balance"
      >
        <PricingBalance lang={lang} />
      </Sequence>
      {(t += BALANCE_DURATION)}

      <Sequence
        from={t}
        durationInFrames={NARRATION_3_DURATION}
        name="Part3-Narration3"
      >
        <NarrationScreen
          lines={[content.narration[3]]}
          fontFamily={fontFamily}
          highlight
        />
      </Sequence>
      {(t += NARRATION_3_DURATION)}

      <Sequence
        from={t}
        durationInFrames={COUNTER_DURATION}
        name="Part3-Counter"
      >
        <SalesCounter lang={lang} />
      </Sequence>
      {(t += COUNTER_DURATION)}

      <Sequence
        from={t}
        durationInFrames={NARRATION_4_DURATION}
        name="Part3-Closing"
      >
        <NarrationScreen lines={[]} fontFamily={fontFamily} />
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
