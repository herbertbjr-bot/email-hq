import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { darken, isValidHex, softTint } from "./colorUtils";
import { DEFAULT_THEME_ID, getTheme, SHAPE_CSS_VAR_MAP, THEMES, TOKEN_CSS_VAR_MAP } from "./tokens";
import type { ThemeDefinition } from "./tokens";

export type ThemeSelection = "system" | (typeof THEMES)[number]["id"];

const STORAGE_KEY = "emailhq.theme-preferences.v1";
const THEME_STYLE_ID = "emailhq-theme-vars";
const CUSTOM_STYLE_ID = "emailhq-custom-css";
const MIN_FONT_SCALE = 0.9;
const MAX_FONT_SCALE = 1.3;

interface StoredPreferences {
  themeId: ThemeSelection;
  accentOverride: string | null;
  fontScale: number;
  customCSS: string;
}

const DEFAULT_PREFERENCES: StoredPreferences = {
  themeId: "system",
  accentOverride: null,
  fontScale: 1,
  customCSS: "",
};

function loadPreferences(): StoredPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    return {
      themeId: parsed.themeId ?? DEFAULT_PREFERENCES.themeId,
      accentOverride: parsed.accentOverride ?? null,
      fontScale: parsed.fontScale ?? 1,
      customCSS: parsed.customCSS ?? "",
    };
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
function applyThemeToDocument(theme: ThemeDefinition, accentOverride: string | null, fontScale: number) {
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
  availableThemes: ThemeDefinition[];
  resetToDefaults: () => void;
  fontScaleRange: { min: number; max: number };
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
    applyThemeToDocument(resolvedTheme, preferences.accentOverride, preferences.fontScale);
  }, [resolvedTheme, preferences.accentOverride, preferences.fontScale]);

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

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
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
    availableThemes: THEMES,
    resetToDefaults,
    fontScaleRange: { min: MIN_FONT_SCALE, max: MAX_FONT_SCALE },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export { DEFAULT_THEME_ID };
