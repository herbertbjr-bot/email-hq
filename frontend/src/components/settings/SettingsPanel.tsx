import { useState } from "react";
import type { ChangeEvent } from "react";
import { Icon, ICON_PACK_META, useIconPack } from "../../icons/IconRegistry";
import type { IconName } from "../../icons/types";
import { useTheme } from "../../theme/ThemeProvider";
import type { ThemeSelection } from "../../theme/ThemeProvider";
import { Button } from "../common/Button";
import { ContrastBadge } from "./ContrastBadge";
import styles from "./SettingsPanel.module.css";

const PREVIEW_ICONS: IconName[] = ["inbox", "sparkles", "star", "pencil", "settings"];

function ThemeSwatch({
  name,
  category,
  tokens,
  active,
  onSelect,
}: {
  name: string;
  category: string;
  tokens: { bgPrimary: string; bgSecondary: string; accentColor: string; textPrimary: string };
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`${styles.swatch} ${active ? styles.swatchActive : ""}`}
      onClick={onSelect}
      aria-pressed={active}
      title={name}
    >
      <span className={styles.swatchPreview} style={{ background: tokens.bgPrimary }}>
        <span className={styles.swatchCard} style={{ background: tokens.bgSecondary }}>
          <span className={styles.swatchDot} style={{ background: tokens.accentColor }} />
          <span className={styles.swatchLine} style={{ background: tokens.textPrimary }} />
        </span>
      </span>
      <span className={styles.swatchMeta}>
        <span className={styles.swatchName}>{name}</span>
        <span className={styles.swatchCategory}>{category}</span>
      </span>
      {active && (
        <span className={styles.swatchCheck}>
          <Icon name="check" size={12} />
        </span>
      )}
    </button>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    themeId,
    setThemeId,
    resolvedTheme,
    accentOverride,
    setAccentOverride,
    fontScale,
    setFontScale,
    fontScaleRange,
    customCSS,
    setCustomCSS,
    availableThemes,
    resetToDefaults,
  } = useTheme();
  const { pack, setPack } = useIconPack();
  const [cssDraft, setCssDraft] = useState(customCSS);

  const effectiveAccent = accentOverride ?? resolvedTheme.tokens.accentColor;

  const handleAccentChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAccentOverride(event.target.value);
  };

  const handleApplyCustomCSS = () => setCustomCSS(cssDraft);
  const handleClearCustomCSS = () => {
    setCssDraft("");
    setCustomCSS("");
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Customize appearance">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Customize appearance</h2>
            <p className={styles.subtitle}>Themes, icons, accent color, and layout preferences</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Theme &amp; skin</h3>
            <div className={styles.swatchGrid}>
              <button
                className={`${styles.swatch} ${themeId === "system" ? styles.swatchActive : ""}`}
                onClick={() => setThemeId("system")}
                aria-pressed={themeId === "system"}
                title="Match system"
              >
                <span className={styles.swatchPreview} style={{ background: "linear-gradient(135deg, #f5f6fa 50%, #14151c 50%)" }}>
                  <span className={styles.swatchCard} style={{ background: "linear-gradient(135deg, #fff 50%, #1c1e29 50%)" }}>
                    <span className={styles.swatchDot} style={{ background: "#4f46e5" }} />
                  </span>
                </span>
                <span className={styles.swatchMeta}>
                  <span className={styles.swatchName}>System</span>
                  <span className={styles.swatchCategory}>Auto</span>
                </span>
                {themeId === "system" && (
                  <span className={styles.swatchCheck}>
                    <Icon name="check" size={12} />
                  </span>
                )}
              </button>
              {availableThemes.map((theme) => (
                <ThemeSwatch
                  key={theme.id}
                  name={theme.name}
                  category={theme.category === "base" ? "Base" : "Skin"}
                  tokens={theme.tokens}
                  active={(themeId as ThemeSelection) === theme.id}
                  onSelect={() => setThemeId(theme.id)}
                />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Icon pack</h3>
            <div className={styles.iconPackGrid}>
              {ICON_PACK_META.map((meta) => (
                <button
                  key={meta.id}
                  className={`${styles.iconPackOption} ${pack === meta.id ? styles.iconPackOptionActive : ""}`}
                  onClick={() => setPack(meta.id)}
                  aria-pressed={pack === meta.id}
                >
                  <span className={styles.iconRow}>
                    {PREVIEW_ICONS.map((name) => (
                      <Icon key={name} name={name} size={16} />
                    ))}
                  </span>
                  <span className={styles.iconPackName}>{meta.name}</span>
                  <span className={styles.iconPackDescription}>{meta.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Accent color</h3>
            <div className={styles.accentRow}>
              <label className={styles.colorPicker}>
                <input type="color" value={effectiveAccent} onChange={handleAccentChange} />
                <span>{effectiveAccent}</span>
              </label>
              <Button variant="ghost" onClick={() => setAccentOverride(null)} disabled={!accentOverride}>
                Reset to theme default
              </Button>
            </div>
            <div className={styles.contrastChecks}>
              <ContrastBadge foreground={effectiveAccent} background={resolvedTheme.tokens.bgSecondary} label="Accent on surface" />
              <ContrastBadge foreground="#ffffff" background={effectiveAccent} label="White text on accent" />
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Font scale</h3>
            <div className={styles.fontScaleRow}>
              <input
                type="range"
                min={fontScaleRange.min}
                max={fontScaleRange.max}
                step={0.05}
                value={fontScale}
                onChange={(e) => setFontScale(Number(e.target.value))}
              />
              <span className={styles.fontScaleValue}>{Math.round(fontScale * 100)}%</span>
            </div>
            <p className={styles.fontPreview}>The quick brown fox jumps over the lazy dog.</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Custom CSS overrides</h3>
            <p className={styles.hint}>
              Advanced: write raw CSS to fine-tune anything beyond the built-in tokens. Applied globally in your
              browser only - nothing is sent anywhere.
            </p>
            <textarea
              className={styles.cssTextarea}
              rows={5}
              spellCheck={false}
              placeholder={":root {\n  --radius-lg: 24px;\n}"}
              value={cssDraft}
              onChange={(e) => setCssDraft(e.target.value)}
            />
            <div className={styles.cssActions}>
              <Button variant="ghost" onClick={handleClearCustomCSS} disabled={!customCSS && !cssDraft}>
                Clear
              </Button>
              <Button onClick={handleApplyCustomCSS} disabled={cssDraft === customCSS}>
                Apply CSS
              </Button>
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={resetToDefaults}>
            Reset everything to defaults
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
