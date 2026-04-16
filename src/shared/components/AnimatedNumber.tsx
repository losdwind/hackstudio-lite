import { useCurrentFrame, interpolate, Easing } from "remotion";

type AnimatedNumberProps = {
  value: number;
  startFrame?: number;
  durationFrames?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
};

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  startFrame = 0,
  durationFrames = 60,
  suffix = "",
  prefix = "",
  decimals = 0,
  fontSize = 48,
  color = "#FFFFFF",
  fontFamily,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    },
  );

  const currentValue = progress * value;
  const display = currentValue.toFixed(decimals);

  return (
    <span
      style={{
        fontSize,
        fontWeight: 700,
        color,
        fontFamily,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {prefix}
      {display}
      {suffix}
    </span>
  );
};
