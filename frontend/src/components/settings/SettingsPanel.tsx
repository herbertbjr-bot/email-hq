import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useToast } from "../../context/ToastContext";
import { Icon, ICON_PACK_META, useIconPack } from "../../icons/IconRegistry";
import type { IconName } from "../../icons/types";
import { useTheme } from "../../theme/ThemeProvider";
import type { ThemeSelection } from "../../theme/ThemeProvider";
import { Button } from "../common/Button";
import { ContrastBadge } from "./ContrastBadge";
import styles from "./SettingsPanel.module.css";

const PREVIEW_ICONS: IconName[] = ["inbox", "sparkles", "star", "pencil", "settings"];
const MAX_BACKGROUND_BYTES = 3 * 1024 * 1024;

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
    backgroundImage,
    setBackgroundImage,
    backgroundDim,
    setBackgroundDim,
    backgroundDimRange,
    availableThemes,
    resetToDefaults,
    exportTheme,
    importTheme,
  } = useTheme();
  const { pack, setPack } = useIconPack();
  const { notify } = useToast();
  const [cssDraft, setCssDraft] = useState(customCSS);

  // Keeps the textarea in sync when customCSS changes from elsewhere (Reset,
  // or an imported theme file) rather than only from this panel's own Apply
  // button - otherwise the draft would silently show stale text.
  useEffect(() => {
    setCssDraft(customCSS);
  }, [customCSS]);

  const effectiveAccent = accentOverride ?? resolvedTheme.tokens.accentColor;

  const handleAccentChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAccentOverride(event.target.value);
  };

  const handleApplyCustomCSS = () => setCustomCSS(cssDraft);
  const handleClearCustomCSS = () => {
    setCssDraft("");
    setCustomCSS("");
  };

  const handleBackgroundFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Please choose an image file", "error");
      return;
    }
    if (file.size > MAX_BACKGROUND_BYTES) {
      notify("That image is too large - please use one under 3MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setBackgroundImage(reader.result);
    };
    reader.onerror = () => notify("Couldn't read that image", "error");
    reader.readAsDataURL(file);
  };

  const handleImportTheme = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await importTheme(file);
      notify("Theme imported", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Couldn't import that file", "error");
    }
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
            <h3 className={styles.sectionTitle}>Background image</h3>
            <p className={styles.hint}>
              Shows behind the app, dimmed so text stays readable. Stored only in this browser - nothing is uploaded
              anywhere.
            </p>
            {backgroundImage ? (
              <div className={styles.backgroundRow}>
                <img src={backgroundImage} alt="" className={styles.backgroundThumb} />
                <div className={styles.backgroundControls}>
                  <label className={styles.dimLabel}>
                    <span>Dim</span>
                    <input
                      type="range"
                      min={backgroundDimRange.min}
                      max={backgroundDimRange.max}
                      step={0.05}
                      value={backgroundDim}
                      onChange={(e) => setBackgroundDim(Number(e.target.value))}
                    />
                  </label>
                  <Button variant="ghost" onClick={() => setBackgroundImage(null)}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className={styles.uploadButton}>
                <input type="file" accept="image/*" onChange={handleBackgroundFile} hidden />
                <Icon name="plus" size={14} />
                Upload image
              </label>
            )}
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

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Import / export theme</h3>
            <p className={styles.hint}>
              Save your current skin, accent, background, and custom CSS as a file to back up or share - or load one
              someone sent you.
            </p>
            <div className={styles.themeFileActions}>
              <Button variant="secondary" onClick={exportTheme}>
                <Icon name="chevronDown" size={14} />
                Export as file
              </Button>
              <label className={styles.uploadButton}>
                <input type="file" accept="application/json" onChange={handleImportTheme} hidden />
                <Icon name="plus" size={14} />
                Import from file
              </label>
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
