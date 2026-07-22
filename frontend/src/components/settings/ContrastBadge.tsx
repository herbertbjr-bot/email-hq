import { classifyContrast, contrastRatio } from "../../theme/contrast";
import styles from "./ContrastBadge.module.css";

const LABEL: Record<string, string> = {
  fail: "Fails AA",
  "aa-large": "AA (large text)",
  aa: "AA",
  aaa: "AAA",
};

/** Live WCAG contrast readout for two hex colors - used by the Settings panel to verify custom accent colors before they're applied. */
export function ContrastBadge({ foreground, background, label }: { foreground: string; background: string; label: string }) {
  const ratio = contrastRatio(foreground, background);
  const level = classifyContrast(ratio);

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.badge} ${styles[level]}`}>
        {ratio ? `${ratio.toFixed(2)}:1` : "n/a"} · {LABEL[level]}
      </span>
    </div>
  );
}
