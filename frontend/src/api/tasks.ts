import { api } from "./client";
import type { Task } from "../types";

export interface TaskCreateInput {
  title: string;
  notes?: string | null;
  due_date?: string | null;
  source_account_id?: string | null;
  source_folder?: string | null;
  source_uid?: string | null;
  source_subject?: string | null;
}

export interface TaskUpdateInput {
  title?: string;
  notes?: string | null;
  due_date?: string | null;
  is_done?: boolean;
}

export const tasksApi = {
  list: () => api.get<Task[]>("/tasks"),
  create: (values: TaskCreateInput) => api.post<Task>("/tasks", values),
  update: (id: string, values: TaskUpdateInput) => api.patch<Task>(`/tasks/${id}`, values),
  remove: (id: string) => api.delete<void>(`/tasks/${id}`),
};
