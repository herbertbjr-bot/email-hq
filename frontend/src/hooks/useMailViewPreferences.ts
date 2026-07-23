import { useCallback, useState } from "react";
import type { MailSort } from "../api/mail";

export type MailDensity = "comfortable" | "compact";

const STORAGE_KEY = "emailhq.mail-view-preferences.v1";

interface StoredPreferences {
  density: MailDensity;
  sort: MailSort;
}

const DEFAULT_PREFERENCES: StoredPreferences = { density: "comfortable", sort: "date_desc" };

function load(): StoredPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    return {
      density: parsed.density === "compact" ? "compact" : "comfortable",
      sort: parsed.sort === "date_asc" ? "date_asc" : "date_desc",
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function persist(prefs: StoredPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/** Density and default sort persist across sessions (like the dashboard
 * layout and icon pack preferences); search text and unread/flagged
 * filters are intentionally session-only state owned by MailToolbar. */
export function useMailViewPreferences() {
  const [prefs, setPrefs] = useState<StoredPreferences>(() => load());

  const setDensity = useCallback((density: MailDensity) => {
    setPrefs((prev) => {
      const next = { ...prev, density };
      persist(next);
      return next;
    });
  }, []);

  const setSort = useCallback((sort: MailSort) => {
    setPrefs((prev) => {
      const next = { ...prev, sort };
      persist(next);
      return next;
    });
  }, []);

  return { density: prefs.density, sort: prefs.sort, setDensity, setSort };
}
