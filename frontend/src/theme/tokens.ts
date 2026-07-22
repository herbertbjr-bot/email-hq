/**
 * Design tokens for every built-in theme/skin. Each token maps 1:1 to a CSS
 * custom property (see TOKEN_CSS_VAR_MAP) that ThemeProvider writes onto
 * <html> at runtime - components never hardcode colors, they consume the
 * CSS variables (--bg-primary, --text-primary, --accent-color, ...).
 *
 * Colors here were chosen to clear WCAG AA contrast for their intended use
 * (textPrimary/textSecondary against bgPrimary/bgSecondary >= 4.5:1, accent
 * against bgSecondary >= 4.5:1 where used as text/icon color). The Settings
 * panel's live contrast checker (theme/contrast.ts) re-verifies this for
 * any user-picked accent override, since that can't be guaranteed statically.
 */

export interface ThemeTokens {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  accentColorHover: string;
  accentSoft: string;
  borderColor: string;
  dangerColor: string;
  successColor: string;
  warningColor: string;
}

export interface ThemeShape {
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  borderWidth: string;
  shadowSm: string;
  shadowMd: string;
}

export type ThemeCategory = "base" | "skin";

export interface ThemeDefinition {
  id: string;
  name: string;
  category: ThemeCategory;
  colorScheme: "light" | "dark";
  tokens: ThemeTokens;
  shape: ThemeShape;
}

const DEFAULT_SHAPE: ThemeShape = {
  radiusSm: "6px",
  radiusMd: "10px",
  radiusLg: "16px",
  borderWidth: "1px",
  shadowSm: "0 1px 2px rgba(16, 24, 40, 0.06)",
  shadowMd: "0 4px 16px rgba(16, 24, 40, 0.08)",
};

const DARK_SHAPE: ThemeShape = {
  ...DEFAULT_SHAPE,
  shadowSm: "0 1px 2px rgba(0, 0, 0, 0.24)",
  shadowMd: "0 8px 24px rgba(0, 0, 0, 0.36)",
};

export const THEMES: ThemeDefinition[] = [
  {
    id: "light",
    name: "Light",
    category: "base",
    colorScheme: "light",
    shape: DEFAULT_SHAPE,
    tokens: {
      bgPrimary: "#f5f6fa",
      bgSecondary: "#ffffff",
      bgTertiary: "#eef0f5",
      textPrimary: "#1a1d29",
      textSecondary: "#565a6b",
      accentColor: "#4f46e5",
      accentColorHover: "#4338ca",
      accentSoft: "#eef2ff",
      borderColor: "#e3e5ec",
      dangerColor: "#dc2626",
      successColor: "#15803d",
      warningColor: "#b45309",
    },
  },
  {
    id: "dark",
    name: "Dark",
    category: "base",
    colorScheme: "dark",
    shape: DARK_SHAPE,
    tokens: {
      bgPrimary: "#14151c",
      bgSecondary: "#1c1e29",
      bgTertiary: "#262838",
      textPrimary: "#eef0f6",
      textSecondary: "#aeb1c2",
      accentColor: "#818cf8",
      accentColorHover: "#a5b4fc",
      accentSoft: "#262a45",
      borderColor: "#2b2d3a",
      dangerColor: "#f87171",
      successColor: "#4ade80",
      warningColor: "#fbbf24",
    },
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    category: "base",
    colorScheme: "dark",
    shape: { ...DARK_SHAPE, borderWidth: "2px", radiusSm: "4px", radiusMd: "6px", radiusLg: "10px" },
    tokens: {
      bgPrimary: "#000000",
      bgSecondary: "#000000",
      bgTertiary: "#1a1a1a",
      textPrimary: "#ffffff",
      textSecondary: "#e6e6e6",
      accentColor: "#ffff00",
      accentColorHover: "#ffff66",
      accentSoft: "#332f00",
      borderColor: "#ffffff",
      dangerColor: "#ff6b6b",
      successColor: "#33ff33",
      warningColor: "#ffaa00",
    },
  },
  {
    id: "midnight-blue",
    name: "Midnight Blue",
    category: "skin",
    colorScheme: "dark",
    shape: DARK_SHAPE,
    tokens: {
      bgPrimary: "#0b1220",
      bgSecondary: "#101a2e",
      bgTertiary: "#16233d",
      textPrimary: "#e8edf7",
      textSecondary: "#a4b3cf",
      accentColor: "#5b8def",
      accentColorHover: "#7ba3f2",
      accentSoft: "#1c2c4d",
      borderColor: "#24304a",
      dangerColor: "#f87171",
      successColor: "#34d399",
      warningColor: "#fbbf24",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    category: "skin",
    colorScheme: "light",
    shape: DEFAULT_SHAPE,
    tokens: {
      bgPrimary: "#f4faf7",
      bgSecondary: "#ffffff",
      bgTertiary: "#e8f5ee",
      textPrimary: "#0f2419",
      textSecondary: "#3f6b57",
      accentColor: "#059669",
      accentColorHover: "#047857",
      accentSoft: "#d1fae5",
      borderColor: "#d3e8dc",
      dangerColor: "#dc2626",
      successColor: "#059669",
      warningColor: "#b45309",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    category: "skin",
    colorScheme: "light",
    shape: DEFAULT_SHAPE,
    tokens: {
      bgPrimary: "#fff8f3",
      bgSecondary: "#ffffff",
      bgTertiary: "#ffe9db",
      textPrimary: "#3a1f14",
      textSecondary: "#7a4a35",
      accentColor: "#c2410c",
      accentColorHover: "#9a3412",
      accentSoft: "#ffe4d1",
      borderColor: "#f3d9c8",
      dangerColor: "#dc2626",
      successColor: "#15803d",
      warningColor: "#b45309",
    },
  },
  {
    id: "minimalist-mono",
    name: "Minimalist Mono",
    category: "skin",
    colorScheme: "light",
    shape: { ...DEFAULT_SHAPE, radiusSm: "2px", radiusMd: "4px", radiusLg: "8px" },
    tokens: {
      bgPrimary: "#fafafa",
      bgSecondary: "#ffffff",
      bgTertiary: "#f0f0f0",
      textPrimary: "#111111",
      textSecondary: "#55555a",
      accentColor: "#111111",
      accentColorHover: "#000000",
      accentSoft: "#ececec",
      borderColor: "#dddddd",
      dangerColor: "#b91c1c",
      successColor: "#15803d",
      warningColor: "#92400e",
    },
  },
];

export const DEFAULT_THEME_ID = "light";

export function getTheme(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Maps ThemeTokens keys to their CSS custom property names. */
export const TOKEN_CSS_VAR_MAP: Record<keyof ThemeTokens, string> = {
  bgPrimary: "--bg-primary",
  bgSecondary: "--bg-secondary",
  bgTertiary: "--bg-tertiary",
  textPrimary: "--text-primary",
  textSecondary: "--text-secondary",
  accentColor: "--accent-color",
  accentColorHover: "--accent-color-hover",
  accentSoft: "--accent-soft",
  borderColor: "--border-color",
  dangerColor: "--danger-color",
  successColor: "--success-color",
  warningColor: "--warning-color",
};

export const SHAPE_CSS_VAR_MAP: Record<keyof ThemeShape, string> = {
  radiusSm: "--radius-sm",
  radiusMd: "--radius-md",
  radiusLg: "--radius-lg",
  borderWidth: "--border-width",
  shadowSm: "--shadow-sm",
  shadowMd: "--shadow-md",
};
