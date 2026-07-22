import { Icon } from "../../icons/IconRegistry";
import { useTheme } from "../../theme/ThemeProvider";
import type { ThemeSelection } from "../../theme/ThemeProvider";
import styles from "./ThemeToggle.module.css";

const CYCLE: ThemeSelection[] = ["system", "light", "dark"];
const LABEL: Record<string, string> = { light: "Light", dark: "Dark", system: "Auto" };

/**
 * Quick Light/Dark/System shortcut. Skins (Midnight Blue, Emerald, ...),
 * accent color, icon pack, and font scale live in the full Settings panel -
 * see components/settings/SettingsPanel.tsx.
 */
export function ThemeToggle() {
  const { themeId, setThemeId, resolvedTheme } = useTheme();

  const cycle = () => {
    const index = CYCLE.indexOf(themeId as ThemeSelection);
    const next = CYCLE[(index === -1 ? 0 : index + 1) % CYCLE.length];
    setThemeId(next);
  };

  return (
    <button className={styles.toggle} onClick={cycle} title={`Theme: ${LABEL[themeId] ?? themeId} (click to change)`}>
      <Icon name={resolvedTheme.colorScheme === "dark" ? "moon" : "sun"} size={16} />
      <span className={styles.label}>{LABEL[themeId] ?? resolvedTheme.name}</span>
    </button>
  );
}
