import { useEffect, useState } from "react";
import type { MailSort } from "../../api/mail";
import { Icon } from "../../icons/IconRegistry";
import type { MailDensity } from "../../hooks/useMailViewPreferences";
import styles from "./MailToolbar.module.css";

/** Debounces search-box typing so every keystroke doesn't fire an IMAP SEARCH. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function MailToolbar({
  q,
  onQChange,
  unreadOnly,
  onUnreadOnlyChange,
  flaggedOnly,
  onFlaggedOnlyChange,
  sort,
  onSortChange,
  density,
  onDensityChange,
  onRefresh,
  refreshing,
}: {
  q: string;
  onQChange: (value: string) => void;
  unreadOnly: boolean;
  onUnreadOnlyChange: (value: boolean) => void;
  flaggedOnly: boolean;
  onFlaggedOnlyChange: (value: boolean) => void;
  sort: MailSort;
  onSortChange: (value: MailSort) => void;
  density: MailDensity;
  onDensityChange: (value: MailDensity) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [draft, setDraft] = useState(q);
  const debounced = useDebouncedValue(draft, 350);

  useEffect(() => {
    onQChange(debounced);
    // Only fire when the debounced value actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.searchBox}>
        <Icon name="search" size={14} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search subject, sender, or body..."
          aria-label="Search messages"
        />
        {draft && (
          <button className={styles.clearButton} onClick={() => setDraft("")} aria-label="Clear search">
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.chip} ${unreadOnly ? styles.chipActive : ""}`}
          onClick={() => onUnreadOnlyChange(!unreadOnly)}
          aria-pressed={unreadOnly}
        >
          Unread
        </button>
        <button
          className={`${styles.chip} ${flaggedOnly ? styles.chipActive : ""}`}
          onClick={() => onFlaggedOnlyChange(!flaggedOnly)}
          aria-pressed={flaggedOnly}
        >
          <Icon name="star" size={11} />
          Flagged
        </button>

        <select
          className={styles.select}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as MailSort)}
          aria-label="Sort order"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
        </select>

        <div className={styles.iconGroup}>
          <button
            className={styles.iconButton}
            onClick={() => onDensityChange(density === "compact" ? "comfortable" : "compact")}
            title={density === "compact" ? "Switch to comfortable view" : "Switch to compact view"}
            aria-label="Toggle list density"
          >
            <Icon name="grid" size={14} />
          </button>

          <button
            className={styles.iconButton}
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh"
            aria-label="Refresh messages"
          >
            <Icon name="refresh" size={14} className={refreshing ? styles.spinning : undefined} />
          </button>
        </div>
      </div>
    </div>
  );
}
