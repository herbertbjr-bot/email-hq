import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { darken, hexToRgbTriplet, isValidHex, softTint } from "./colorUtils";
import { DEFAULT_THEME_ID, getTheme, SHAPE_CSS_VAR_MAP, THEMES, TOKEN_CSS_VAR_MAP } from "./tokens";
import type { ThemeDefinition } from "./tokens";

export type ThemeSelection = "system" | (typeof THEMES)[number]["id"];

const STORAGE_KEY = "emailhq.theme-preferences.v1";
const THEME_STYLE_ID = "emailhq-theme-vars";
const CUSTOM_STYLE_ID = "emailhq-custom-css";
const MIN_FONT_SCALE = 0.9;
const MAX_FONT_SCALE = 1.3;
const MIN_BACKGROUND_DIM = 0;
const MAX_BACKGROUND_DIM = 0.9;
const VALID_THEME_IDS: string[] = ["system", ...THEMES.map((t) => t.id)];

interface StoredPreferences {
  themeId: ThemeSelection;
  accentOverride: string | null;
  fontScale: number;
  customCSS: string;
  /** Data URL of a user-uploaded background image, or null for none. */
  backgroundImage: string | null;
  /** How much of a dark/light scrim (matching the theme's own background) sits over the image, 0-0.9. */
  backgroundDim: number;
}

const DEFAULT_PREFERENCES: StoredPreferences = {
  themeId: "system",
  accentOverride: null,
  fontScale: 1,
  customCSS: "",
  backgroundImage: null,
  backgroundDim: 0.65,
};

function isThemeSelection(value: unknown): value is ThemeSelection {
  return typeof value === "string" && VALID_THEME_IDS.includes(value);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Applies the same defensive parsing/clamping to a preferences-shaped object,
 * whether it came from localStorage or an imported theme file - neither is
 * trusted to have the right shape. */
function sanitizePreferences(candidate: Partial<StoredPreferences> | null | undefined): StoredPreferences {
  return {
    themeId: isThemeSelection(candidate?.themeId) ? candidate.themeId : DEFAULT_PREFERENCES.themeId,
    accentOverride:
      typeof candidate?.accentOverride === "string" && isValidHex(candidate.accentOverride)
        ? candidate.accentOverride
        : null,
    fontScale:
      typeof candidate?.fontScale === "number"
        ? clampNumber(candidate.fontScale, MIN_FONT_SCALE, MAX_FONT_SCALE)
        : DEFAULT_PREFERENCES.fontScale,
    customCSS: typeof candidate?.customCSS === "string" ? candidate.customCSS : "",
    backgroundImage:
      typeof candidate?.backgroundImage === "string" && candidate.backgroundImage.startsWith("data:image/")
        ? candidate.backgroundImage
        : null,
    backgroundDim:
      typeof candidate?.backgroundDim === "number"
        ? clampNumber(candidate.backgroundDim, MIN_BACKGROUND_DIM, MAX_BACKGROUND_DIM)
        : DEFAULT_PREFERENCES.backgroundDim,
  };
}

function loadPreferences(): StoredPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return sanitizePreferences(JSON.parse(raw) as Partial<StoredPreferences>);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getOrCreateStyleTag(id: string): HTMLStyleElement {
  let styleEl = document.getElementById(id) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = id;
    document.head.appendChild(styleEl);
  }
  return styleEl;
}

/** A dark/light scrim (matching the theme's own bg-primary) layered under the
 * image so body text stays legible regardless of what the photo looks like -
 * without it, a bright uploaded photo would wash out anything sitting
 * directly on the page background (e.g. view titles that aren't inside an
 * opaque card). `dim` is how strong that scrim is, 0 (none) to 0.9 (mostly
 * hidden). */
function computeBackgroundImageCss(image: string | null, dim: number, bgPrimaryHex: string): string {
  if (!image) return "none";
  const scrim = `rgba(${hexToRgbTriplet(bgPrimaryHex)}, ${dim})`;
  return `linear-gradient(${scrim}, ${scrim}), url("${image}")`;
}

/**
 * Writes theme tokens into a real stylesheet (`:root { --bg-primary: ...; }`)
 * rather than inline styles on <html>. This matters for the Settings panel's
 * custom-CSS textarea: inline styles beat any stylesheet rule regardless of
 * source order, so a user's `:root { --radius-lg: 2px; }` override would be
 * silently ignored if theme tokens were applied via element.style. Using a
 * stylesheet keeps both at equal specificity, so normal cascade order
 * applies - and since this tag is inserted into <head> before the custom-CSS
 * tag (see applyCustomCSS), the user's overrides always win.
 */
function applyThemeToDocument(
  theme: ThemeDefinition,
  accentOverride: string | null,
  fontScale: number,
  backgroundImage: string | null,
  backgroundDim: number,
) {
  const root = document.documentElement;
  const accent = accentOverride && isValidHex(accentOverride) ? accentOverride : theme.tokens.accentColor;
  const accentHover = accentOverride && isValidHex(accentOverride) ? darken(accentOverride, 0.12) : theme.tokens.accentColorHover;
  const accentSoft = accentOverride && isValidHex(accentOverride) ? softTint(accentOverride) : theme.tokens.accentSoft;

  const declarations: string[] = [];
  for (const [key, cssVar] of Object.entries(TOKEN_CSS_VAR_MAP) as [keyof typeof TOKEN_CSS_VAR_MAP, string][]) {
    declarations.push(`  ${cssVar}: ${theme.tokens[key]};`);
  }
  for (const [key, cssVar] of Object.entries(SHAPE_CSS_VAR_MAP) as [keyof typeof SHAPE_CSS_VAR_MAP, string][]) {
    declarations.push(`  ${cssVar}: ${theme.shape[key]};`);
  }
  declarations.push(`  --accent-color: ${accent};`);
  declarations.push(`  --accent-color-hover: ${accentHover};`);
  declarations.push(`  --accent-soft: ${accentSoft};`);
  declarations.push(`  --font-scale: ${fontScale};`);
  declarations.push(`  --app-bg-image: ${computeBackgroundImageCss(backgroundImage, backgroundDim, theme.tokens.bgPrimary)};`);
  declarations.push(`  color-scheme: ${theme.colorScheme};`);

  getOrCreateStyleTag(THEME_STYLE_ID).textContent = `:root {\n${declarations.join("\n")}\n}`;
  root.setAttribute("data-theme-id", theme.id);
}

function applyCustomCSS(css: string) {
  getOrCreateStyleTag(CUSTOM_STYLE_ID).textContent = css;
}

interface ThemeContextValue {
  themeId: ThemeSelection;
  resolvedTheme: ThemeDefinition;
  setThemeId: (id: ThemeSelection) => void;
  accentOverride: string | null;
  setAccentOverride: (hex: string | null) => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
  customCSS: string;
  setCustomCSS: (css: string) => void;
  backgroundImage: string | null;
  setBackgroundImage: (dataUrl: string | null) => void;
  backgroundDim: number;
  setBackgroundDim: (dim: number) => void;
  availableThemes: ThemeDefinition[];
  resetToDefaults: () => void;
  fontScaleRange: { min: number; max: number };
  backgroundDimRange: { min: number; max: number };
  /** Downloads the current theme (skin, accent, background, custom CSS) as a shareable JSON file. */
  exportTheme: () => void;
  /** Reads and validates a previously exported theme file, then applies it wholesale. Throws with a
   * user-facing message if the file isn't a recognizable theme. */
  importTheme: (file: File) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<StoredPreferences>(() => loadPreferences());
  const [systemDark, setSystemDark] = useState(systemPrefersDark());

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const resolvedThemeId = useMemo(
    () => (preferences.themeId === "system" ? (systemDark ? "dark" : "light") : preferences.themeId),
    [preferences.themeId, systemDark],
  );
  const resolvedTheme = useMemo(() => getTheme(resolvedThemeId), [resolvedThemeId]);

  useEffect(() => {
    applyThemeToDocument(
      resolvedTheme,
      preferences.accentOverride,
      preferences.fontScale,
      preferences.backgroundImage,
      preferences.backgroundDim,
    );
  }, [resolvedTheme, preferences.accentOverride, preferences.fontScale, preferences.backgroundImage, preferences.backgroundDim]);

  useEffect(() => {
    applyCustomCSS(preferences.customCSS);
  }, [preferences.customCSS]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setThemeId = useCallback((id: ThemeSelection) => {
    setPreferences((prev) => ({ ...prev, themeId: id }));
  }, []);

  const setAccentOverride = useCallback((hex: string | null) => {
    setPreferences((prev) => ({ ...prev, accentOverride: hex }));
  }, []);

  const setFontScale = useCallback((scale: number) => {
    const clamped = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, scale));
    setPreferences((prev) => ({ ...prev, fontScale: clamped }));
  }, []);

  const setCustomCSS = useCallback((css: string) => {
    setPreferences((prev) => ({ ...prev, customCSS: css }));
  }, []);

  const setBackgroundImage = useCallback((dataUrl: string | null) => {
    setPreferences((prev) => ({ ...prev, backgroundImage: dataUrl }));
  }, []);

  const setBackgroundDim = useCallback((dim: number) => {
    const clamped = clampNumber(dim, MIN_BACKGROUND_DIM, MAX_BACKGROUND_DIM);
    setPreferences((prev) => ({ ...prev, backgroundDim: clamped }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const exportTheme = useCallback(() => {
    const blob = new Blob([JSON.stringify(preferences, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "emailhq-theme.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [preferences]);

  const importTheme = useCallback(async (file: File) => {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("That file isn't valid JSON.");
    }
    if (typeof parsed !== "object" || parsed === null || !isThemeSelection((parsed as Partial<StoredPreferences>).themeId)) {
      throw new Error("That file doesn't look like an Email HQ theme.");
    }
    setPreferences(sanitizePreferences(parsed as Partial<StoredPreferences>));
  }, []);

  const value: ThemeContextValue = {
    themeId: preferences.themeId,
    resolvedTheme,
    setThemeId,
    accentOverride: preferences.accentOverride,
    setAccentOverride,
    fontScale: preferences.fontScale,
    setFontScale,
    customCSS: preferences.customCSS,
    setCustomCSS,
    backgroundImage: preferences.backgroundImage,
    setBackgroundImage,
    backgroundDim: preferences.backgroundDim,
    setBackgroundDim,
    availableThemes: THEMES,
    resetToDefaults,
    fontScaleRange: { min: MIN_FONT_SCALE, max: MAX_FONT_SCALE },
    backgroundDimRange: { min: MIN_BACKGROUND_DIM, max: MAX_BACKGROUND_DIM },
    exportTheme,
    importTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export { DEFAULT_THEME_ID };
