import { staticFile } from "remotion";
import { Audio } from "@remotion/media";

type NarrationAudioProps = {
  src: string; // path relative to public/, e.g. "audio/cn/part1-line1.mp3"
};

/**
 * Plays a narration audio file. Place inside a <Sequence> to time it.
 * The audio starts at the beginning of the Sequence it's in.
 */
export const NarrationAudio: React.FC<NarrationAudioProps> = ({ src }) => {
  return <Audio src={staticFile(src)} />;
};
