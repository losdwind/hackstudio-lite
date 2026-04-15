import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../common/Background";
import { SectionTitle } from "../common/SectionTitle";
import { EVPenetrationChart } from "./EVPenetrationChart";
import { XiaomiTimeline } from "./XiaomiTimeline";
import type { Lang } from "../../schemas/video-schema";
import { getFontFamily } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";
import { COLORS } from "../../lib/colors";

type Props = { lang: Lang };

// Part 1: 2:30 = 4500 frames at 30fps
const TITLE_DURATION = 120; // 4s
const NARRATION_1_DURATION = 300; // 10s
const EV_CHART_DURATION = 300; // 10s
const NARRATION_2_DURATION = 240; // 8s
const TIMELINE_DURATION = 360; // 12s
const NARRATION_3_DURATION = 180; // 6s

export const Part1: React.FC<Props> = ({ lang }) => {
  const fontFamily = getFontFamily(lang);
  const content = lang === "cn" ? contentCN.part1 : contentEN.part1;

  let t = 0;

  return (
    <AbsoluteFill>
      <Background />

      {/* Section title */}
      <Sequence from={t} durationInFrames={TITLE_DURATION} name="Part1-Title">
        <SectionTitle
          title={content.title}
          subtitle={content.subtitle}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += TITLE_DURATION)}

      {/* Narration screen 1 */}
      <Sequence
        from={t}
        durationInFrames={NARRATION_1_DURATION}
        name="Part1-Narration1"
      >
        <NarrationScreen
          lines={[content.narration[0], content.narration[1]]}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += NARRATION_1_DURATION)}

      {/* EV Penetration Chart */}
      <Sequence
        from={t}
        durationInFrames={EV_CHART_DURATION}
        name="Part1-EVChart"
      >
        <EVPenetrationChart lang={lang} />
      </Sequence>
      {(t += EV_CHART_DURATION)}

      {/* Narration screen 2 */}
      <Sequence
        from={t}
        durationInFrames={NARRATION_2_DURATION}
        name="Part1-Narration2"
      >
        <NarrationScreen
          lines={[content.narration[2]]}
          fontFamily={fontFamily}
        />
      </Sequence>
      {(t += NARRATION_2_DURATION)}

      {/* Xiaomi Timeline */}
      <Sequence
        from={t}
        durationInFrames={TIMELINE_DURATION}
        name="Part1-Timeline"
      >
        <XiaomiTimeline lang={lang} />
      </Sequence>
      {(t += TIMELINE_DURATION)}

      {/* Closing narration */}
      <Sequence
        from={t}
        durationInFrames={NARRATION_3_DURATION}
        name="Part1-Narration3"
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

// Simple narration screen component
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
