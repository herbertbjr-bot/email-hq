import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { tasksApi } from "../api/tasks";
import type { TaskCreateInput, TaskUpdateInput } from "../api/tasks";
import type { Task } from "../types";

interface TaskContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (values: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, values: TaskUpdateInput) => Promise<Task>;
  removeTask: (id: string) => Promise<void>;
  /** The task (if any) already linked to a given source message. */
  findLinkedTask: (accountId: string, folder: string, uid: string) => Task | undefined;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createTask = useCallback(async (values: TaskCreateInput) => {
    const task = await tasksApi.create(values);
    setTasks((prev) => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, values: TaskUpdateInput) => {
    const task = await tasksApi.update(id, values);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  }, []);

  const removeTask = useCallback(async (id: string) => {
    await tasksApi.remove(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const findLinkedTask = useCallback(
    (accountId: string, folder: string, uid: string) =>
      tasks.find((t) => t.source_account_id === accountId && t.source_folder === folder && t.source_uid === uid),
    [tasks],
  );

  const value: TaskContextValue = {
    tasks,
    loading,
    error,
    refresh,
    createTask,
    updateTask,
    removeTask,
    findLinkedTask,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within a TaskProvider");
  return ctx;
}
