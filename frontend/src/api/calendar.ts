import { api } from "./client";
import type { CalendarEvent } from "../types";

export interface CalendarEventCreateInput {
  title: string;
  notes?: string | null;
  start_at: string;
  end_at: string;
  all_day?: boolean;
  source_account_id?: string | null;
  source_folder?: string | null;
  source_uid?: string | null;
  source_subject?: string | null;
}

export interface CalendarEventUpdateInput {
  title?: string;
  notes?: string | null;
  start_at?: string;
  end_at?: string;
  all_day?: boolean;
}

export const calendarApi = {
  list: () => api.get<CalendarEvent[]>("/calendar/events"),
  create: (values: CalendarEventCreateInput) => api.post<CalendarEvent>("/calendar/events", values),
  update: (id: string, values: CalendarEventUpdateInput) => api.patch<CalendarEvent>(`/calendar/events/${id}`, values),
  remove: (id: string) => api.delete<void>(`/calendar/events/${id}`),
};
