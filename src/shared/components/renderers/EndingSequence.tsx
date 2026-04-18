import { VideoBackground } from "../VideoBackground";
import type { Lang } from "../../schemas/video-schema";

type EndingSequenceProps = {
  lang: Lang;
  brollFile: string;
  brollStartFrom: number;
  videoOpacity?: number;
  Component: React.ComponentType<{ lang: Lang }>;
};

export const EndingSequence: React.FC<EndingSequenceProps> = ({
  lang,
  brollFile,
  brollStartFrom,
  videoOpacity,
  Component,
}) => (
  <>
    <VideoBackground
      src={brollFile}
      startFrom={brollStartFrom}
      overlayOpacity={videoOpacity ?? 0.7}
    />
    <Component lang={lang} />
  </>
);
