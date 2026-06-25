/**
 * ABM System — XP-inspired design tokens.
 *
 * Not a full XP theme: chunky progress bars, title-bar chrome, classic button
 * bevels, and the teal/silver palette used as accents on an otherwise clean,
 * modern B2B dashboard. These tokens back both inline styles and the CSS
 * classes defined in app/globals.css.
 */
import type { CSSProperties } from "react";

export const xp = {
  teal: "#008080",
  silver: "#d4d0c8",
  blue: "#0a246a", // title bar
  blueLight: "#1b5dbf",
  highlight: "#316ac5",
  success: "#2d7a2d",
  warning: "#c8a020",
  danger: "#a02020",
  face: "#ece9d8",
  white: "#ffffff",
  ink: "#1a1a1a",
} as const;

/** Title bar gradient (#0a246a → #1b5dbf) used on every XP window. */
export const titleBarGradient =
  "linear-gradient(180deg, #0a246a 0%, #2657c9 8%, #1b5dbf 40%, #1b5dbf 88%, #134ba8 100%)";

/** Inline style for a raised, beveled XP button (mirrors .xp-btn). */
export const xpButtonStyle: CSSProperties = {
  fontFamily: "Tahoma, 'Segoe UI', Verdana, Arial, sans-serif",
  fontSize: 12,
  padding: "4px 14px",
  background: "linear-gradient(180deg, #fdfdfd 0%, #ece9d8 45%, #d6d2c2 100%)",
  border: "1px solid #707070",
  borderRadius: 3,
  boxShadow: "inset 1px 1px 0 #ffffff, inset -1px -1px 0 #a0a0a0",
  cursor: "pointer",
};

/** Account pipeline state → accent colour used for progress fills/badges. */
export const stateColors: Record<string, string> = {
  DISCOVERED: "#1a73e8",
  ENRICHED: "#008080",
  SIGNAL_DETECTED: "#6a1aad",
  DRAFTED: "#c8a020",
  PENDING_APPROVAL: "#995200",
  APPROVED: "#2d7a2d",
  SENT: "#1b5dbf",
  REPLIED: "#0c8597",
  CONVERTED: "#2d7a2d",
  NO_REPLY: "#777777",
  COLD: "#a02020",
  BOUNCED: "#a02020",
};

/** Canonical pipeline order shown on dashboards. */
export const PIPELINE_STATES = [
  "DISCOVERED",
  "ENRICHED",
  "DRAFTED",
  "SENT",
  "REPLIED",
  "CONVERTED",
] as const;

/** Progress-fill variant by semantic meaning. */
export type ProgressTone = "green" | "teal" | "amber";

export function toneForConfidence(value: number): ProgressTone {
  // value expected 0..1
  if (value >= 0.7) return "green";
  if (value >= 0.4) return "amber";
  return "teal";
}
