import { AbsoluteFill } from "remotion";
import { COLORS } from "../../lib/colors";

export const Background: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${COLORS.surfaceLight} 0%, ${COLORS.bg} 70%)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
