export const COLORS = {
  // Backgrounds
  bg: "#0A0A0F",
  surface: "#141420",
  surfaceLight: "#1E1E2E",

  // Brand
  xiaomiOrange: "#FF6900",
  xiaomiOrangeLight: "#FF8C33",
  accentBlue: "#3B82F6",
  accentBlueDark: "#1D4ED8",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",

  // Chart palette (gradient from blue to orange)
  chart: [
    "#60A5FA", // 2019 - light blue
    "#3B82F6", // 2020 - blue
    "#8B5CF6", // 2021 - purple
    "#EC4899", // 2022 - pink
    "#F97316", // 2023 - orange
    "#FF6900", // 2024 - xiaomi orange
  ],

  // Comparison
  winner: "#22C55E",
  loser: "#EF4444",
  neutral: "#4B5563",

  // Effects
  glow: "rgba(255, 105, 0, 0.3)",
  glassBorder: "rgba(255, 255, 255, 0.1)",
} as const;
