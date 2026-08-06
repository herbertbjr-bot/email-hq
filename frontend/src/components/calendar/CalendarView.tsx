import { useMemo, useState } from "react";
import { useCalendarContext } from "../../context/CalendarContext";
import { useTaskContext } from "../../context/TaskContext";
import { useToast } from "../../context/ToastContext";
import { Icon } from "../../icons/IconRegistry";
import type { CalendarEvent, Task } from "../../types";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { Spinner } from "../common/Spinner";
import styles from "./CalendarView.module.css";
import { ScheduleEventModal } from "./ScheduleEventModal";

type ViewMode = "month" | "agenda";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CELL_ITEMS = 3;

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

/** Every day cell needed to fill complete weeks (Sun-Sat) covering the given
 * month - includes the leading/trailing days from adjacent months, same as
 * a standard month-grid calendar. */
function buildMonthGrid(monthCursor: Date): Date[] {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const start = new Date(year, month, 1);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(year, month + 1, 0);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const days: Date[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(new Date(cursor));
  }
  return days;
}

/** Overdue tasks read as urgent (danger), done tasks read as resolved
 * (success), everything else uses the same "due" amber the Tasks view
 * already uses - consistent semantics, just relocated onto the grid. */
function taskDotColor(task: Task, todayKeyValue: string): string {
  if (task.is_done) return "var(--success-color)";
  if (task.due_date && task.due_date < todayKeyValue) return "var(--danger-color)";
  return "var(--warning-color)";
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
  const { tasks, updateTask } = useTaskContext();
  const { notify } = useToast();
  const [view, setView] = useState<ViewMode>("month");
  const [showModal, setShowModal] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [showTasks, setShowTasks] = useState(true);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = useMemo(() => new Date(), []);
  const todayKeyValue = useMemo(() => dateKey(today), [today]);

  const { pastGroups, upcomingGroups } = useMemo(() => {
    const groups = groupByDay(events);
    return {
      pastGroups: groups.filter((g) => g.key < todayKeyValue).reverse(),
      upcomingGroups: groups.filter((g) => g.key >= todayKeyValue),
    };
  }, [events, todayKeyValue]);

  const upcomingCount = upcomingGroups.reduce((sum, g) => sum + g.events.length, 0);
  const pastCount = pastGroups.reduce((sum, g) => sum + g.events.length, 0);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.start_at));
      const list = map.get(key);
      if (list) list.push(event);
      else map.set(key, [event]);
    }
    return map;
  }, [events]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const list = map.get(task.due_date);
      if (list) list.push(task);
      else map.set(task.due_date, [task]);
    }
    return map;
  }, [tasks]);

  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const goPrevMonth = () => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  const handleDelete = async (event: CalendarEvent) => {
    try {
      await removeEvent(event.id);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete event", "error");
    }
  };

  const toggleTaskDone = async (task: Task) => {
    try {
      await updateTask(task.id, { is_done: !task.is_done });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update task", "error");
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

  const renderDayCell = (day: Date) => {
    const key = dateKey(day);
    const inCurrentMonth = day.getMonth() === monthCursor.getMonth();
    const isToday = key === todayKeyValue;
    const dayEvents = eventsByDate.get(key) ?? [];
    const dayTasks = showTasks ? (tasksByDate.get(key) ?? []) : [];
    const total = dayEvents.length + dayTasks.length;
    const visibleEvents = dayEvents.slice(0, MAX_CELL_ITEMS);
    const visibleTasks = dayTasks.slice(0, Math.max(0, MAX_CELL_ITEMS - visibleEvents.length));
    const overflow = total - visibleEvents.length - visibleTasks.length;

    return (
      <div key={key} className={`${styles.cell} ${!inCurrentMonth ? styles.cellMuted : ""}`}>
        <span className={`${styles.cellNumber} ${isToday ? styles.cellNumberToday : ""}`}>{day.getDate()}</span>
        <div className={styles.cellItems}>
          {visibleEvents.map((event) => (
            <span key={event.id} className={styles.eventChip} title={event.title}>
              <span className={styles.dot} style={{ background: "var(--accent-color)" }} />
              <span className={styles.chipLabel}>{event.title}</span>
            </span>
          ))}
          {visibleTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              className={`${styles.taskChip} ${task.is_done ? styles.taskChipDone : ""}`}
              title={task.is_done ? `${task.title} (done - click to reopen)` : `${task.title} (click to mark done)`}
              onClick={() => toggleTaskDone(task)}
            >
              <span className={styles.dot} style={{ background: taskDotColor(task, todayKeyValue) }} />
              <span className={styles.chipLabel}>{task.title}</span>
            </button>
          ))}
          {overflow > 0 && <span className={styles.overflow}>+{overflow} more</span>}
        </div>
      </div>
    );
  };

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
          {view === "agenda" && upcomingCount > 0 && <span className={styles.count}>{upcomingCount} upcoming</span>}
          <Button onClick={() => setShowModal(true)}>
            <Icon name="plus" size={14} />
            New event
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={view === "month" ? styles.viewToggleActive : ""}
            onClick={() => setView("month")}
          >
            Month
          </button>
          <button
            type="button"
            className={view === "agenda" ? styles.viewToggleActive : ""}
            onClick={() => setView("agenda")}
          >
            Agenda
          </button>
        </div>

        {view === "month" && (
          <>
            <div className={styles.monthNav}>
              <button type="button" className={styles.navButton} onClick={goPrevMonth} aria-label="Previous month">
                ‹
              </button>
              <button type="button" className={styles.todayButton} onClick={goToday}>
                Today
              </button>
              <button type="button" className={styles.navButton} onClick={goNextMonth} aria-label="Next month">
                ›
              </button>
              <h2 className={styles.monthLabel}>{monthLabel}</h2>
            </div>
            <label className={styles.taskToggle}>
              <input type="checkbox" checked={showTasks} onChange={(e) => setShowTasks(e.target.checked)} />
              <span className={styles.dot} style={{ background: "var(--warning-color)" }} />
              Tasks
            </label>
          </>
        )}
      </div>

      {loading && events.length === 0 && <Spinner label="Loading events..." />}

      {error && <EmptyState title="Couldn't load events" description={error} />}

      {!loading && !error && view === "month" && (
        <div className={styles.monthWrap}>
          <div className={styles.weekdays}>
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className={styles.weekday}>
                {label}
              </span>
            ))}
          </div>
          <div className={styles.monthGrid}>{monthDays.map(renderDayCell)}</div>
        </div>
      )}

      {!loading && !error && view === "agenda" && events.length === 0 && (
        <EmptyState
          title="No events yet"
          description="Add one above, or use the Schedule button on a message to create one linked back to it."
        />
      )}

      {!error && view === "agenda" && events.length > 0 && (
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
