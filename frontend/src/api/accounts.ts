import { api } from "./client";
import type { EmailAccount, EmailAccountFormValues } from "../types";

export interface ConnectionTestResult {
  imap_ok: boolean;
  smtp_ok: boolean;
  imap_error: string | null;
  smtp_error: string | null;
}

type ConnectionFields = Pick<
  EmailAccountFormValues,
  | "imap_host"
  | "imap_port"
  | "imap_use_ssl"
  | "imap_username"
  | "imap_password"
  | "smtp_host"
  | "smtp_port"
  | "smtp_use_tls"
  | "smtp_username"
  | "smtp_password"
>;

export const accountsApi = {
  list: () => api.get<EmailAccount[]>("/accounts"),
  create: (values: EmailAccountFormValues) => api.post<EmailAccount>("/accounts", values),
  update: (id: string, values: Partial<EmailAccountFormValues>) =>
    api.patch<EmailAccount>(`/accounts/${id}`, values),
  remove: (id: string) => api.delete<void>(`/accounts/${id}`),
  testConnection: (id: string) => api.post<ConnectionTestResult>(`/accounts/${id}/test-connection`),
  /** Tests IMAP/SMTP credentials before an account is saved - nothing is persisted. */
  testConnectionFields: (fields: ConnectionFields) =>
    api.post<ConnectionTestResult>("/accounts/test-connection", fields),
};
