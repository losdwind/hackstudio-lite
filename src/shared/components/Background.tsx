import { AbsoluteFill } from "remotion";
import { GRADIENTS } from "../lib/colors";

export const Background: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: GRADIENTS.surfaceRadial,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
