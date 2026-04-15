import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../common/Background";
import { SectionTitle } from "../common/SectionTitle";
import { EcosystemDiagram } from "./EcosystemDiagram";
import { GlobalExpansionMap } from "./GlobalExpansionMap";
import { EndingSubtitles } from "./EndingSubtitles";
import type { Lang } from "../../schemas/video-schema";
import { getFontFamily } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { COLORS } from "../../lib/colors";

type Props = { lang: Lang };

const TITLE_DURATION = 120;
const NARRATION_1_DURATION = 300;
const ECOSYSTEM_DURATION = 360;
const NARRATION_2_DURATION = 240;
const MAP_DURATION = 420;
const NARRATION_3_DURATION = 210;
const ENDING_DURATION = 300;

export const Part4: React.FC<Props> = ({ lang }) => {
  const fontFamily = getFontFamily(lang);
  const content = lang === "cn" ? contentCN.part4 : contentEN.part4;

  let t = 0;

  return (
    <AbsoluteFill>
      <Background />

      <Sequence from={t} durationInFrames={TITLE_DURATION} name="Part4-Title">
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
        name="Part4-Narration1"
      >
        <NarrationScreen
          lines={[content.narration[0]]}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += NARRATION_1_DURATION)}

      <Sequence
        from={t}
        durationInFrames={ECOSYSTEM_DURATION}
        name="Part4-Ecosystem"
      >
        <EcosystemDiagram lang={lang} />
      </Sequence>
      {(t += ECOSYSTEM_DURATION)}

      <Sequence
        from={t}
        durationInFrames={NARRATION_2_DURATION}
        name="Part4-Narration2"
      >
        <NarrationScreen
          lines={[content.narration[1]]}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += NARRATION_2_DURATION)}

      <Sequence from={t} durationInFrames={MAP_DURATION} name="Part4-Map">
        <GlobalExpansionMap lang={lang} />
      </Sequence>
      {(t += MAP_DURATION)}

      <Sequence
        from={t}
        durationInFrames={NARRATION_3_DURATION}
        name="Part4-Narration3"
      >
        <NarrationScreen
          lines={[content.narration[2]]}
          fontFamily={fontFamily}
          highlight
        />
      </Sequence>
      {(t += NARRATION_3_DURATION)}

      <Sequence
        from={t}
        durationInFrames={ENDING_DURATION}
        name="Part4-Ending"
      >
        <EndingSubtitles lang={lang} />
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
