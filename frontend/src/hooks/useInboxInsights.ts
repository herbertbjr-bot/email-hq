import { useEffect, useState } from "react";
import { aiApi } from "../api/ai";
import { mailApi } from "../api/mail";
import type { MessageSummary, PriorityLevel } from "../types";

export interface InsightMessage extends MessageSummary {
  ai_tags: string[];
  ai_priority: PriorityLevel | null;
  ai_score: number | null;
}

/**
 * Pulls the most recent inbox messages for an account and enriches each
 * with AI tags + a priority score, powering the dashboard's Priority Inbox
 * and Smart Tags widgets. AI calls run through backend/app/services/ai/,
 * which uses a real model when configured or heuristics otherwise.
 */
export function useInboxInsights(accountId: string | null, limit = 8) {
  const [messages, setMessages] = useState<InsightMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    mailApi
      .messages(accountId, "INBOX", limit, 0)
      .then(async (res) => {
        const enriched = await Promise.all(
          res.messages.map(async (message): Promise<InsightMessage> => {
            const bodyText = message.snippet;
            try {
              const [tagRes, priorityRes] = await Promise.all([
                aiApi.tag({ subject: message.subject, body_text: bodyText, sender_address: message.sender_address }),
                aiApi.prioritize({
                  subject: message.subject,
                  body_text: bodyText,
                  sender_address: message.sender_address,
                }),
              ]);
              return {
                ...message,
                ai_tags: tagRes.tags,
                ai_priority: priorityRes.priority,
                ai_score: priorityRes.score,
              };
            } catch {
              return { ...message, ai_tags: [], ai_priority: null, ai_score: null };
            }
          }),
        );
        if (!cancelled) setMessages(enriched);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load inbox insights");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, limit]);

  return { messages, loading, error };
}
