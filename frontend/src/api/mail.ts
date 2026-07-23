import { api } from "./client";
import type { Folder, MessageDetail, MessageListResponse, SendMessageRequest } from "../types";

export type MailSort = "date_desc" | "date_asc";

export interface MessageListParams {
  limit?: number;
  offset?: number;
  q?: string;
  unreadOnly?: boolean;
  flaggedOnly?: boolean;
  sort?: MailSort;
}

function buildQuery(params: MessageListParams): string {
  const search = new URLSearchParams();
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  if (params.q) search.set("q", params.q);
  if (params.unreadOnly) search.set("unread_only", "true");
  if (params.flaggedOnly) search.set("flagged_only", "true");
  if (params.sort) search.set("sort", params.sort);
  return search.toString();
}

export const mailApi = {
  folders: (accountId: string) => api.get<Folder[]>(`/accounts/${accountId}/mail/folders`),
  messages: (accountId: string, folder: string, params: MessageListParams = {}) =>
    api.get<MessageListResponse>(
      `/accounts/${accountId}/mail/folders/${encodeURIComponent(folder)}/messages?${buildQuery(params)}`,
    ),
  message: (accountId: string, folder: string, uid: string) =>
    api.get<MessageDetail>(
      `/accounts/${accountId}/mail/folders/${encodeURIComponent(folder)}/messages/${uid}`,
    ),
  setFlags: (accountId: string, folder: string, uid: string, flags: { is_read?: boolean; is_flagged?: boolean }) =>
    api.patch<void>(
      `/accounts/${accountId}/mail/folders/${encodeURIComponent(folder)}/messages/${uid}/flags`,
      flags,
    ),
  move: (accountId: string, folder: string, uid: string, targetFolder: string) =>
    api.post<void>(`/accounts/${accountId}/mail/folders/${encodeURIComponent(folder)}/messages/${uid}/move`, {
      target_folder: targetFolder,
    }),
  remove: (accountId: string, folder: string, uid: string) =>
    api.delete<void>(`/accounts/${accountId}/mail/folders/${encodeURIComponent(folder)}/messages/${uid}`),
  send: (accountId: string, payload: SendMessageRequest) =>
    api.post<{ status: string }>(`/accounts/${accountId}/mail/send`, payload),
};
