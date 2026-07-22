export type AccountProfile = "personal" | "business" | "other";

export interface EmailAccount {
  id: string;
  label: string;
  email_address: string;
  profile: AccountProfile;
  color: string;
  is_default: boolean;
  imap_host: string;
  imap_port: number;
  imap_use_ssl: boolean;
  imap_username: string;
  smtp_host: string;
  smtp_port: number;
  smtp_use_tls: boolean;
  smtp_username: string;
  created_at: string;
  updated_at: string;
}

export interface EmailAccountFormValues {
  label: string;
  email_address: string;
  profile: AccountProfile;
  color: string;
  is_default: boolean;
  imap_host: string;
  imap_port: number;
  imap_use_ssl: boolean;
  imap_username: string;
  imap_password: string;
  smtp_host: string;
  smtp_port: number;
  smtp_use_tls: boolean;
  smtp_username: string;
  smtp_password: string;
}

export interface Folder {
  name: string;
  display_name: string;
  unread_count: number;
  total_count: number;
}

export type PriorityLevel = "low" | "normal" | "high" | "urgent";

export interface MessageSummary {
  uid: string;
  subject: string;
  sender_name: string | null;
  sender_address: string;
  recipients: string[];
  date: string | null;
  snippet: string;
  is_read: boolean;
  is_flagged: boolean;
  has_attachments: boolean;
  ai_tags: string[];
  ai_priority: PriorityLevel | null;
  ai_priority_score: number | null;
}

export interface MessageDetail extends MessageSummary {
  body_text: string | null;
  body_html: string | null;
  attachments: string[];
}

export interface MessageListResponse {
  folder: string;
  total: number;
  messages: MessageSummary[];
}

export interface SendMessageRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_text: string;
  body_html?: string;
  in_reply_to?: string;
}

export interface QuickReplySuggestion {
  label: string;
  body: string;
}
