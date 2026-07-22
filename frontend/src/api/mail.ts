import { api } from "./client";
import type { Folder, MessageDetail, MessageListResponse, SendMessageRequest } from "../types";

export const mailApi = {
  folders: (accountId: string) => api.get<Folder[]>(`/accounts/${accountId}/mail/folders`),
  messages: (accountId: string, folder: string, limit = 50, offset = 0) =>
    api.get<MessageListResponse>(
      `/accounts/${accountId}/mail/folders/${encodeURIComponent(folder)}/messages?limit=${limit}&offset=${offset}`,
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
  send: (accountId: string, payload: SendMessageRequest) =>
    api.post<{ status: string }>(`/accounts/${accountId}/mail/send`, payload),
};
