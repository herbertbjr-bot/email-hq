import { api } from "./client";
import type { PriorityLevel, QuickReplySuggestion } from "../types";

export type AISource = "ai" | "heuristic";

export interface SmartTagRequest {
  subject: string;
  body_text: string;
  sender_address: string;
}

export interface PrioritizeRequest extends SmartTagRequest {
  is_reply?: boolean;
}

export interface QuickReplyRequest {
  subject: string;
  body_text: string;
  sender_name?: string | null;
  tone?: "professional" | "friendly" | "brief";
}

export interface AIStatus {
  enabled: boolean;
  provider: string;
  model: string | null;
}

export const aiApi = {
  status: () => api.get<AIStatus>("/ai/status"),
  tag: (payload: SmartTagRequest) =>
    api.post<{ tags: string[]; confidence: number | null; source: AISource }>("/ai/tag", payload),
  prioritize: (payload: PrioritizeRequest) =>
    api.post<{ priority: PriorityLevel; score: number; reasons: string[]; source: AISource }>(
      "/ai/prioritize",
      payload,
    ),
  quickReply: (payload: QuickReplyRequest) =>
    api.post<{ suggestions: QuickReplySuggestion[]; source: AISource }>("/ai/quick-reply", payload),
};
