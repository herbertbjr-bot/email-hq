import { useMemo, useState } from "react";
import { useCalendarContext } from "../../context/CalendarContext";
import { useToast } from "../../context/ToastContext";
import { Icon } from "../../icons/IconRegistry";
import type { CalendarEvent } from "../../types";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { Spinner } from "../common/Spinner";
import styles from "./CalendarView.module.css";
import { ScheduleEventModal } from "./ScheduleEventModal";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDayHeading(d: Date, today: Date): string {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateKey(d) === dateKey(today)) return "Today";
  if (dateKey(d) === dateKey(tomorrow)) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTimeRange(event: CalendarEvent): string {
  if (event.all_day) return "All day";
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${fmt(event.start_at)} – ${fmt(event.end_at)}`;
}

interface DayGroup {
  key: string;
  date: Date;
  events: CalendarEvent[];
}

function groupByDay(events: CalendarEvent[]): DayGroup[] {
  const sorted = [...events].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const map = new Map<string, DayGroup>();
  for (const event of sorted) {
    const date = new Date(event.start_at);
    const key = dateKey(date);
    const group = map.get(key);
    if (group) {
      group.events.push(event);
    } else {
      map.set(key, { key, date, events: [event] });
    }
  }
  return [...map.values()];
}

export function CalendarView({
  onOpenMessage,
}: {
  onOpenMessage: (uid: string, accountId?: string, folder?: string) => void;
}) {
  const { events, loading, error, removeEvent } = useCalendarContext();
  const { notify } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const today = useMemo(() => new Date(), []);
  const { pastGroups, upcomingGroups } = useMemo(() => {
    const groups = groupByDay(events);
    const key = dateKey(today);
    return {
      pastGroups: groups.filter((g) => g.key < key).reverse(),
      upcomingGroups: groups.filter((g) => g.key >= key),
    };
  }, [events, today]);

  const upcomingCount = upcomingGroups.reduce((sum, g) => sum + g.events.length, 0);
  const pastCount = pastGroups.reduce((sum, g) => sum + g.events.length, 0);

  const handleDelete = async (event: CalendarEvent) => {
    try {
      await removeEvent(event.id);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete event", "error");
    }
  };

  const renderEvent = (event: CalendarEvent) => (
    <li key={event.id} className={styles.row}>
      <span className={styles.time}>{formatTimeRange(event)}</span>
      <div className={styles.rowMain}>
        <span className={styles.rowTitle}>{event.title}</span>
        {event.source_subject && event.source_uid && (
          <button
            type="button"
            className={styles.sourceChip}
            onClick={() =>
              onOpenMessage(event.source_uid!, event.source_account_id ?? undefined, event.source_folder ?? undefined)
            }
            title="Open the message this event came from"
          >
            <Icon name="inbox" size={11} />
            <span>{event.source_subject}</span>
          </button>
        )}
      </div>
      <button type="button" className={styles.deleteButton} onClick={() => handleDelete(event)} title="Delete event">
        <Icon name="trash" size={14} />
      </button>
    </li>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendar</h1>
          <p className={styles.subtitle}>
            See what's on your schedule, and turn a message into an event without leaving Mail.
          </p>
        </div>
        <div className={styles.headerActions}>
          {upcomingCount > 0 && <span className={styles.count}>{upcomingCount} upcoming</span>}
          <Button onClick={() => setShowModal(true)}>
            <Icon name="plus" size={14} />
            New event
          </Button>
        </div>
      </div>

      {loading && events.length === 0 && <Spinner label="Loading events..." />}

      {error && <EmptyState title="Couldn't load events" description={error} />}

      {!loading && !error && events.length === 0 && (
        <EmptyState
          title="No events yet"
          description="Add one above, or use the Schedule button on a message to create one linked back to it."
        />
      )}

      {!error && events.length > 0 && (
        <div className={styles.groups}>
          {upcomingGroups.length === 0 && <p className={styles.noUpcoming}>Nothing upcoming.</p>}

          {upcomingGroups.map((group) => (
            <section key={group.key} className={styles.group}>
              <h2 className={styles.groupHeading}>{formatDayHeading(group.date, today)}</h2>
              <ul className={styles.list}>{group.events.map(renderEvent)}</ul>
            </section>
          ))}

          {pastGroups.length > 0 && (
            <section className={styles.group}>
              <button type="button" className={styles.groupToggle} onClick={() => setShowPast((s) => !s)}>
                <Icon name="chevronDown" size={12} />
                Past ({pastCount})
              </button>
              {showPast &&
                pastGroups.map((group) => (
                  <div key={group.key} className={styles.pastGroup}>
                    <h2 className={styles.groupHeading}>{formatDayHeading(group.date, today)}</h2>
                    <ul className={styles.list}>{group.events.map(renderEvent)}</ul>
                  </div>
                ))}
            </section>
          )}
        </div>
      )}

      {showModal && <ScheduleEventModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
