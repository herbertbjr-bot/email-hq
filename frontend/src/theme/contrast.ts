/**
 * WCAG 2.1 contrast-ratio utilities. Used by the Settings panel to verify
 * theme tokens (and any user-picked accent color) meet AA thresholds before
 * they're applied - see components/settings/ContrastBadge.tsx.
 */

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

function channelLuminance(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** Returns the WCAG contrast ratio (1-21) between two hex colors, or null if either is unparsable. */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return null;
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastLevel = "fail" | "aa-large" | "aa" | "aaa";

/**
 * Classifies a contrast ratio against WCAG 2.1 thresholds.
 * - aa: 4.5:1+ (normal text)
 * - aa-large: 3:1+ (large text / 18pt+, or UI components/graphics)
 * - aaa: 7:1+ (enhanced)
 */
export function classifyContrast(ratio: number | null): ContrastLevel {
  if (ratio === null) return "fail";
  if (ratio >= 7) return "aaa";
  if (ratio >= 4.5) return "aa";
  if (ratio >= 3) return "aa-large";
  return "fail";
}
