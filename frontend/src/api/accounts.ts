import { api } from "./client";
import type { EmailAccount, EmailAccountFormValues } from "../types";

export const accountsApi = {
  list: () => api.get<EmailAccount[]>("/accounts"),
  create: (values: EmailAccountFormValues) => api.post<EmailAccount>("/accounts", values),
  update: (id: string, values: Partial<EmailAccountFormValues>) =>
    api.patch<EmailAccount>(`/accounts/${id}`, values),
  remove: (id: string) => api.delete<void>(`/accounts/${id}`),
  testConnection: (id: string) =>
    api.post<{ imap_ok: boolean; smtp_ok: boolean; imap_error: string | null; smtp_error: string | null }>(
      `/accounts/${id}/test-connection`,
    ),
};
