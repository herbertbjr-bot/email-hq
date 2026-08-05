import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { calendarApi } from "../api/calendar";
import type { CalendarEventCreateInput, CalendarEventUpdateInput } from "../api/calendar";
import type { CalendarEvent } from "../types";

interface CalendarContextValue {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createEvent: (values: CalendarEventCreateInput) => Promise<CalendarEvent>;
  updateEvent: (id: string, values: CalendarEventUpdateInput) => Promise<CalendarEvent>;
  removeEvent: (id: string) => Promise<void>;
  /** The event (if any) already linked to a given source message. */
  findLinkedEvent: (accountId: string, folder: string, uid: string) => CalendarEvent | undefined;
}

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calendarApi.list();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createEvent = useCallback(async (values: CalendarEventCreateInput) => {
    const event = await calendarApi.create(values);
    setEvents((prev) => [...prev, event]);
    return event;
  }, []);

  const updateEvent = useCallback(async (id: string, values: CalendarEventUpdateInput) => {
    const event = await calendarApi.update(id, values);
    setEvents((prev) => prev.map((e) => (e.id === id ? event : e)));
    return event;
  }, []);

  const removeEvent = useCallback(async (id: string) => {
    await calendarApi.remove(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const findLinkedEvent = useCallback(
    (accountId: string, folder: string, uid: string) =>
      events.find((e) => e.source_account_id === accountId && e.source_folder === folder && e.source_uid === uid),
    [events],
  );

  const value: CalendarContextValue = {
    events,
    loading,
    error,
    refresh,
    createEvent,
    updateEvent,
    removeEvent,
    findLinkedEvent,
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendarContext(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendarContext must be used within a CalendarProvider");
  return ctx;
}
