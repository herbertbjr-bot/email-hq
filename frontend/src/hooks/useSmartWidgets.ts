import { useCallback, useState } from "react";
import type { MailSort } from "../api/mail";

export interface SmartWidgetFilters {
  q?: string;
  subject?: string;
  fromAddress?: string;
  toAddress?: string;
  dateFrom?: string; // "YYYY-MM-DD"
  dateTo?: string; // "YYYY-MM-DD"
  unreadOnly?: boolean;
  flaggedOnly?: boolean;
}

export interface SmartWidgetConfig {
  id: string;
  title: string;
  accountId: string;
  folder: string;
  filters: SmartWidgetFilters;
  sort: MailSort;
  limit: number;
}

const STORAGE_KEY = "emailhq.smart-widgets.v1";

function load(): SmartWidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(widgets: SmartWidgetConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

function makeId(): string {
  return `smart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * User-defined dashboard widgets, each a saved IMAP search (any combination
 * of subject/from/to/date/read/flagged + sort) against a chosen account and
 * folder. Unlike the fixed built-in widgets (Accounts Overview, Priority
 * Inbox, ...), any number of these can exist at once - persisted to
 * localStorage like the rest of this app's view preferences.
 */
export function useSmartWidgets() {
  const [widgets, setWidgets] = useState<SmartWidgetConfig[]>(() => load());

  const addWidget = useCallback((config: Omit<SmartWidgetConfig, "id">) => {
    const widget: SmartWidgetConfig = { ...config, id: makeId() };
    setWidgets((prev) => {
      const next = [...prev, widget];
      persist(next);
      return next;
    });
    return widget.id;
  }, []);

  const updateWidget = useCallback((id: string, config: Omit<SmartWidgetConfig, "id">) => {
    setWidgets((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...config, id } : w));
      persist(next);
      return next;
    });
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => {
      const next = prev.filter((w) => w.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { widgets, addWidget, updateWidget, removeWidget };
}
