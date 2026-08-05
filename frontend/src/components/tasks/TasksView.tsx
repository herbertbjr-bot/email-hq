import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTaskContext } from "../../context/TaskContext";
import { useToast } from "../../context/ToastContext";
import { Icon } from "../../icons/IconRegistry";
import type { Task } from "../../types";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { Spinner } from "../common/Spinner";
import styles from "./TasksView.module.css";

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDue(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type DueVariant = "overdue" | "today" | "upcoming";

function dueVariant(task: Task, today: string): DueVariant | null {
  if (!task.due_date || task.is_done) return null;
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "today";
  return "upcoming";
}

interface Groups {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  noDate: Task[];
  done: Task[];
}

function groupTasks(tasks: Task[], today: string): Groups {
  const open = tasks.filter((t) => !t.is_done);
  return {
    overdue: open.filter((t) => t.due_date && t.due_date < today),
    today: open.filter((t) => t.due_date === today),
    upcoming: open.filter((t) => t.due_date && t.due_date > today),
    noDate: open.filter((t) => !t.due_date),
    done: tasks.filter((t) => t.is_done),
  };
}

const DUE_CLASS: Record<DueVariant, string> = {
  overdue: styles.dueOverdue,
  today: styles.dueToday,
  upcoming: styles.dueUpcoming,
};

export function TasksView({
  onOpenMessage,
}: {
  onOpenMessage: (uid: string, accountId?: string, folder?: string) => void;
}) {
  const { tasks, loading, error, createTask, updateTask, removeTask } = useTaskContext();
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const today = useMemo(todayIso, []);
  const groups = useMemo(() => groupTasks(tasks, today), [tasks, today]);
  const openCount = groups.overdue.length + groups.today.length + groups.upcoming.length + groups.noDate.length;

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await createTask({ title: trimmed, due_date: dueDate || null });
      setTitle("");
      setDueDate("");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to add task", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDone = async (task: Task) => {
    try {
      await updateTask(task.id, { is_done: !task.is_done });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update task", "error");
    }
  };

  const handleDelete = async (task: Task) => {
    try {
      await removeTask(task.id);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete task", "error");
    }
  };

  const renderTask = (task: Task) => {
    const variant = dueVariant(task, today);
    return (
      <li key={task.id} className={styles.row}>
        <button
          type="button"
          className={`${styles.checkbox} ${task.is_done ? styles.checkboxDone : ""}`}
          onClick={() => toggleDone(task)}
          aria-label={task.is_done ? "Mark as not done" : "Mark as done"}
        >
          {task.is_done && <Icon name="check" size={11} />}
        </button>
        <div className={styles.rowMain}>
          <span className={`${styles.rowTitle} ${task.is_done ? styles.rowTitleDone : ""}`}>{task.title}</span>
          {(task.due_date || task.source_subject) && (
            <div className={styles.rowMeta}>
              {task.due_date && (
                <span className={`${styles.due} ${variant ? DUE_CLASS[variant] : ""}`}>{formatDue(task.due_date)}</span>
              )}
              {task.source_subject && task.source_uid && (
                <button
                  type="button"
                  className={styles.sourceChip}
                  onClick={() =>
                    onOpenMessage(task.source_uid!, task.source_account_id ?? undefined, task.source_folder ?? undefined)
                  }
                  title="Open the message this task came from"
                >
                  <Icon name="inbox" size={11} />
                  <span>{task.source_subject}</span>
                </button>
              )}
            </div>
          )}
        </div>
        <button type="button" className={styles.deleteButton} onClick={() => handleDelete(task)} title="Delete task">
          <Icon name="trash" size={14} />
        </button>
      </li>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.subtitle}>Keep track of what mail is waiting on you.</p>
        </div>
        {openCount > 0 && <span className={styles.count}>{openCount} open</span>}
      </div>

      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          className={styles.addInput}
          placeholder="Add a task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
        />
        <input
          type="date"
          className={styles.addDate}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={submitting}
          aria-label="Due date"
        />
        <Button disabled={submitting || !title.trim()}>
          <Icon name="plus" size={14} />
          Add
        </Button>
      </form>

      {loading && tasks.length === 0 && <Spinner label="Loading tasks..." />}

      {error && <EmptyState title="Couldn't load tasks" description={error} />}

      {!loading && !error && tasks.length === 0 && (
        <EmptyState
          title="No tasks yet"
          description="Add one above, or use the Task button on a message to create one linked back to it."
        />
      )}

      {!error && tasks.length > 0 && (
        <div className={styles.groups}>
          {groups.overdue.length > 0 && (
            <section className={styles.group}>
              <h2 className={styles.groupHeading}>Overdue</h2>
              <ul className={styles.list}>{groups.overdue.map(renderTask)}</ul>
            </section>
          )}
          {groups.today.length > 0 && (
            <section className={styles.group}>
              <h2 className={styles.groupHeading}>Today</h2>
              <ul className={styles.list}>{groups.today.map(renderTask)}</ul>
            </section>
          )}
          {groups.upcoming.length > 0 && (
            <section className={styles.group}>
              <h2 className={styles.groupHeading}>Upcoming</h2>
              <ul className={styles.list}>{groups.upcoming.map(renderTask)}</ul>
            </section>
          )}
          {groups.noDate.length > 0 && (
            <section className={styles.group}>
              <h2 className={styles.groupHeading}>No due date</h2>
              <ul className={styles.list}>{groups.noDate.map(renderTask)}</ul>
            </section>
          )}
          {groups.done.length > 0 && (
            <section className={styles.group}>
              <button type="button" className={styles.groupToggle} onClick={() => setShowDone((s) => !s)}>
                <Icon name="chevronDown" size={12} />
                Completed ({groups.done.length})
              </button>
              {showDone && <ul className={styles.list}>{groups.done.map(renderTask)}</ul>}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
