import { useCallback, useEffect, useState } from "react";
import type { MailSort } from "../api/mail";
import { mailApi } from "../api/mail";
import type { MessageSummary } from "../types";

const PAGE_SIZE = 30;

export interface MessageFilterParams {
  q?: string;
  unreadOnly?: boolean;
  flaggedOnly?: boolean;
  sort?: MailSort;
}

/**
 * Fetches a paginated, filtered/sorted message list. `refreshToken` is a
 * plain counter - bump it (e.g. after a delete/move/flag change elsewhere in
 * the UI) to force a refetch of the current page without changing filters.
 */
export function useMessages(
  accountId: string | null,
  folder: string,
  params: MessageFilterParams = {},
  refreshToken = 0,
) {
  const { q, unreadOnly, flaggedOnly, sort } = params;
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchPage = useCallback(
    (nextOffset: number, append: boolean) => {
      if (!accountId) {
        setMessages([]);
        setTotal(0);
        return;
      }
      const setLoadingState = append ? setLoadingMore : setLoading;
      setLoadingState(true);
      setError(null);
      mailApi
        .messages(accountId, folder, { limit: PAGE_SIZE, offset: nextOffset, q, unreadOnly, flaggedOnly, sort })
        .then((data) => {
          setMessages((prev) => (append ? [...prev, ...data.messages] : data.messages));
          setTotal(data.total);
          setOffset(nextOffset);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load messages");
        })
        .finally(() => {
          setLoadingState(false);
        });
    },
    [accountId, folder, q, unreadOnly, flaggedOnly, sort],
  );

  useEffect(() => {
    fetchPage(0, false);
    // fetchPage already depends on every value below except refreshToken;
    // it's omitted here deliberately since including it would just restate
    // the same primitives and defeat the point of a manual refresh trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, folder, q, unreadOnly, flaggedOnly, sort, refreshToken]);

  const reload = useCallback(() => fetchPage(0, false), [fetchPage]);
  const loadMore = useCallback(() => fetchPage(offset + PAGE_SIZE, true), [fetchPage, offset]);

  return {
    messages,
    total,
    loading,
    loadingMore,
    error,
    reload,
    loadMore,
    hasMore: messages.length < total,
  };
}
