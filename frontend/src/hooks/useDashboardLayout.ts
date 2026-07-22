import { useCallback, useEffect, useState } from "react";

export interface WidgetMeta {
  id: string;
  title: string;
}

export const DASHBOARD_WIDGETS: WidgetMeta[] = [
  { id: "accounts", title: "Accounts overview" },
  { id: "priority-inbox", title: "Priority inbox" },
  { id: "smart-tags", title: "Smart tags" },
  { id: "quick-compose", title: "Quick compose" },
  { id: "ai-status", title: "AI status" },
];

const STORAGE_KEY = "emailhq.dashboard.layout.v1";

interface StoredLayout {
  order: string[];
  hidden: string[];
}

function loadLayout(): StoredLayout {
  const defaultOrder = DASHBOARD_WIDGETS.map((w) => w.id);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: defaultOrder, hidden: [] };
    const parsed = JSON.parse(raw) as StoredLayout;
    const known = new Set(defaultOrder);
    const order = parsed.order.filter((id) => known.has(id));
    for (const id of defaultOrder) {
      if (!order.includes(id)) order.push(id);
    }
    return { order, hidden: parsed.hidden.filter((id) => known.has(id)) };
  } catch {
    return { order: defaultOrder, hidden: [] };
  }
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<StoredLayout>(() => loadLayout());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const toggleVisible = useCallback((id: string) => {
    setLayout((prev) => ({
      ...prev,
      hidden: prev.hidden.includes(id) ? prev.hidden.filter((h) => h !== id) : [...prev.hidden, id],
    }));
  }, []);

  const move = useCallback((id: string, direction: -1 | 1) => {
    setLayout((prev) => {
      const order = [...prev.order];
      const index = order.indexOf(id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= order.length) return prev;
      [order[index], order[target]] = [order[target], order[index]];
      return { ...prev, order };
    });
  }, []);

  const reset = useCallback(() => {
    setLayout({ order: DASHBOARD_WIDGETS.map((w) => w.id), hidden: [] });
  }, []);

  const orderedWidgets = layout.order
    .map((id) => DASHBOARD_WIDGETS.find((w) => w.id === id))
    .filter((w): w is WidgetMeta => Boolean(w));

  const visibleWidgets = orderedWidgets.filter((w) => !layout.hidden.includes(w.id));

  return {
    orderedWidgets,
    visibleWidgets,
    hidden: layout.hidden,
    toggleVisible,
    move,
    reset,
  };
}
