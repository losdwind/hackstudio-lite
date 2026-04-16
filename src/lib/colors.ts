// Design System: "Precision Editorial" — The Kinetic Architect
// See design.md for full specification

export const COLORS = {
  // Surface Hierarchy (Material Design layering)
  surface: "#131313", // Level 1 — Base void
  surfaceContainerLow: "#1C1B1B", // Level 2 — Section
  surfaceContainerHigh: "#2A2A2A", // Level 3 — Interactive Card
  surfaceBright: "#393939", // Level 4 — Floating/Overlay

  // Primary (warm gradient spectrum)
  primary: "#FFB595", // Light warm — headlines, data highlights
  primaryContainer: "#FF6700", // Xiaomi Orange — CTAs, key accents

  // Secondary
  secondary: "#C6C6C7", // Metallic sheen — body text, labels

  // Tertiary (Ecosystem Glow)
  tertiary: "#9DCAFF", // Node glow, connectivity
  tertiaryBright: "#019CFF", // Active data points, links

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#C6C6C7", // = secondary
  textMuted: "#6B7280",

  // Semantic
  winner: "#22C55E",
  loser: "#EF4444",

  // Ghost Border (15% opacity of #5A4136)
  ghostBorder: "rgba(90, 65, 54, 0.15)",

  // Outline variant for connectivity lines
  outlineVariant: "rgba(90, 65, 54, 0.30)",

  // Chart palette (cool tertiary → warm primary gradient)
  chart: [
    "#9DCAFF", // 2019 — tertiary
    "#7DB8FF", // 2020
    "#C6A0FF", // 2021 — transitional purple
    "#FFB595", // 2022 — primary
    "#FF8C4A", // 2023
    "#FF6700", // 2024 — primary container (Xiaomi Orange)
  ],
} as const;

// Gradient presets
export const GRADIENTS = {
  // Primary CTA gradient (135° angle)
  primaryCTA: "linear-gradient(135deg, #FFB595, #FF6700)",
  // Radial glow for data nodes
  nodeGlow: "radial-gradient(circle, rgba(157, 202, 255, 0.15) 0%, transparent 70%)",
  // Background ambient
  surfaceRadial: `radial-gradient(ellipse at 50% 30%, #1C1B1B 0%, #131313 70%)`,
} as const;

// Ambient shadow presets (no standard drop shadows allowed)
export const SHADOWS = {
  // Ambient glow for floating elements
  ambient: "0 0 60px rgba(19, 19, 19, 0.08)",
  // Primary glow for highlighted items
  primaryGlow: "0 0 40px rgba(255, 103, 0, 0.15)",
  // Tertiary glow for ecosystem nodes
  nodeGlow: "0 0 15px rgba(157, 202, 255, 0.4)",
  // Large ambient for key data
  heroGlow: "0 0 80px rgba(255, 181, 149, 0.10)",
} as const;
