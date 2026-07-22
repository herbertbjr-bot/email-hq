import { useCallback, useEffect, useState } from "react";
import { mailApi } from "../api/mail";
import type { MessageSummary } from "../types";

export function useMessages(accountId: string | null, folder: string) {
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!accountId) {
      setMessages([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    mailApi
      .messages(accountId, folder)
      .then((data) => {
        setMessages(data.messages);
        setTotal(data.total);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accountId, folder]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { messages, total, loading, error, reload };
}
