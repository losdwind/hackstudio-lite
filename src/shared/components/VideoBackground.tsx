import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Video } from "@remotion/media";
import { COLORS } from "../lib/colors";

type VideoBackgroundProps = {
  src: string;
  /**
   * Overlay darkness: 0 = fully transparent, 1 = fully opaque.
   * Default 0.25 — light dim for subtitle readability while keeping video vivid.
   * Use 0.65-0.85 when animation overlays are present.
   */
  overlayOpacity?: number;
  /** Slow down video for cinematic feel. Default 0.6 */
  playbackRate?: number;
  /** Start position in the source video (seconds). Default 0 */
  startFrom?: number;
  /** Fade in duration in frames. Default 20 */
  fadeInFrames?: number;
};

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src,
  overlayOpacity = 0.25,
  playbackRate = 0.6,
  startFrom = 0,
  fadeInFrames = 20,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Convert startFrom (seconds) to frames for trimBefore
  const trimBeforeFrames = Math.round(startFrom * fps);

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Video layer */}
      <Video
        src={staticFile(src)}
        muted
        loop
        playbackRate={playbackRate}
        trimBefore={trimBeforeFrames}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {/* Dark overlay for text readability */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.surface,
          opacity: overlayOpacity,
        }}
      />
      {/* Subtle vignette for cinematic depth */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(19, 19, 19, 0.5) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
