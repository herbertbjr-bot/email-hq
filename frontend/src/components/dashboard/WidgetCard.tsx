import type { ReactNode } from "react";
import { Icon } from "../../icons/IconRegistry";
import styles from "./WidgetCard.module.css";

export function WidgetCard({
  title,
  icon,
  editMode,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  children,
}: {
  title: string;
  icon?: ReactNode;
  editMode?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`${styles.card} ${editMode ? styles.editing : ""}`}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          {editMode && <Icon name="grip" size={14} className={styles.grip} />}
          {icon}
          <h3 className={styles.title}>{title}</h3>
        </div>
        {editMode && (
          <div className={styles.controls}>
            <button className={styles.controlButton} onClick={onMoveUp} disabled={!canMoveUp} aria-label="Move up">
              <Icon name="chevronDown" size={14} style={{ transform: "rotate(180deg)" }} />
            </button>
            <button className={styles.controlButton} onClick={onMoveDown} disabled={!canMoveDown} aria-label="Move down">
              <Icon name="chevronDown" size={14} />
            </button>
            <button className={styles.controlButton} onClick={onHide} aria-label="Hide widget">
              <Icon name="eyeOff" size={14} />
            </button>
          </div>
        )}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
