import { useState } from "react";
import type { FormEvent } from "react";
import { useCalendarContext } from "../../context/CalendarContext";
import { useToast } from "../../context/ToastContext";
import { Icon } from "../../icons/IconRegistry";
import { Button } from "../common/Button";
import styles from "./ScheduleEventModal.module.css";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Next half-hour mark, so a freshly opened form defaults to a plausible slot. */
function nextHalfHour(): Date {
  const d = new Date();
  d.setSeconds(0, 0);
  const add = d.getMinutes() < 30 ? 30 - d.getMinutes() : 60 - d.getMinutes();
  d.setMinutes(d.getMinutes() + add);
  return d;
}

/** Combines a date-only and time-only input value as local wall-clock time -
 * `new Date("YYYY-MM-DDTHH:MM")` (no offset) is local time per spec, unlike
 * the date-only form which JS treats as UTC. */
function combineLocal(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}`);
}

export interface ScheduleEventModalProps {
  initialTitle?: string;
  sourceAccountId?: string | null;
  sourceFolder?: string | null;
  sourceUid?: string | null;
  sourceSubject?: string | null;
  onClose: () => void;
  onCreated?: () => void;
}

export function ScheduleEventModal({
  initialTitle,
  sourceAccountId,
  sourceFolder,
  sourceUid,
  sourceSubject,
  onClose,
  onCreated,
}: ScheduleEventModalProps) {
  const { createEvent } = useCalendarContext();
  const { notify } = useToast();

  const defaultStart = nextHalfHour();
  const defaultEnd = new Date(defaultStart.getTime() + 30 * 60_000);

  const [title, setTitle] = useState(initialTitle ?? "");
  const [allDay, setAllDay] = useState(false);
  const [date, setDate] = useState(toDateInput(defaultStart));
  const [startTime, setStartTime] = useState(toTimeInput(defaultStart));
  const [endTime, setEndTime] = useState(toTimeInput(defaultEnd));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    let start: Date;
    let end: Date;
    if (allDay) {
      start = combineLocal(date, "00:00");
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    } else {
      start = combineLocal(date, startTime);
      end = combineLocal(date, endTime);
    }

    if (end <= start) {
      setError("End time must be after start time");
      return;
    }

    setSubmitting(true);
    try {
      await createEvent({
        title: title.trim() || "(untitled event)",
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        all_day: allDay,
        source_account_id: sourceAccountId ?? undefined,
        source_folder: sourceFolder ?? undefined,
        source_uid: sourceUid ?? undefined,
        source_subject: sourceSubject ?? undefined,
      });
      notify("Added to Calendar", "success");
      onCreated?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create event";
      setError(message);
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>New event</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span>Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's this event about?"
              autoFocus
            />
          </label>

          <label className={styles.checkboxField}>
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            <span>All day</span>
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Date</span>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            {!allDay && (
              <>
                <label className={styles.field}>
                  <span>Start</span>
                  <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </label>
                <label className={styles.field}>
                  <span>End</span>
                  <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </label>
              </>
            )}
          </div>

          {sourceSubject && (
            <p className={styles.linkedHint}>
              <Icon name="inbox" size={12} />
              <span>Linked to "{sourceSubject}"</span>
            </p>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
