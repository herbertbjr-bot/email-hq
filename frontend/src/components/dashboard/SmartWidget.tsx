import { useEffect, useState } from "react";
import { mailApi } from "../../api/mail";
import { useAccountContext } from "../../context/AccountContext";
import type { SmartWidgetConfig } from "../../hooks/useSmartWidgets";
import { Icon } from "../../icons/IconRegistry";
import type { MessageSummary } from "../../types";
import { EmptyState } from "../common/EmptyState";
import { Spinner } from "../common/Spinner";
import styles from "./SmartWidget.module.css";

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function filterSummary(config: SmartWidgetConfig): string {
  const parts: string[] = [];
  if (config.filters.q) parts.push(`"${config.filters.q}"`);
  if (config.filters.subject) parts.push(`subject: ${config.filters.subject}`);
  if (config.filters.fromAddress) parts.push(`from: ${config.filters.fromAddress}`);
  if (config.filters.toAddress) parts.push(`to: ${config.filters.toAddress}`);
  if (config.filters.unreadOnly) parts.push("unread");
  if (config.filters.flaggedOnly) parts.push("flagged");
  if (config.filters.dateFrom) parts.push(`since ${config.filters.dateFrom}`);
  if (config.filters.dateTo) parts.push(`before ${config.filters.dateTo}`);
  return parts.length > 0 ? parts.join(" · ") : "All messages";
}

/**
 * Renders a live, user-configured saved search - see useSmartWidgets.ts for
 * the persisted shape and SmartWidgetEditor.tsx for how it's built. Every
 * filter maps directly to an IMAP SEARCH criterion on the backend
 * (backend/app/services/imap_service.py's MessageQuery), so this is a real
 * server-side query, not a client-side filter over a fixed message set.
 */
export function SmartWidget({
  config,
  onOpenMessage,
  onEdit,
}: {
  config: SmartWidgetConfig;
  onOpenMessage: (uid: string, accountId: string, folder: string) => void;
  onEdit: () => void;
}) {
  const { accounts } = useAccountContext();
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const account = accounts.find((a) => a.id === config.accountId);

  useEffect(() => {
    if (!account) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    mailApi
      .messages(config.accountId, config.folder, {
        limit: config.limit,
        offset: 0,
        q: config.filters.q,
        subject: config.filters.subject,
        fromAddress: config.filters.fromAddress,
        toAddress: config.filters.toAddress,
        dateFrom: config.filters.dateFrom,
        dateTo: config.filters.dateTo,
        unreadOnly: config.filters.unreadOnly,
        flaggedOnly: config.filters.flaggedOnly,
        sort: config.sort,
      })
      .then((res) => {
        if (cancelled) return;
        setMessages(res.messages);
        setTotal(res.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load messages");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // config is a plain object recreated each render from localStorage-backed
    // state; re-running on every field individually keeps this from
    // re-fetching on unrelated dashboard re-renders while still reacting to
    // real edits (the editor always produces a new config object on save).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.accountId,
    config.folder,
    config.limit,
    config.sort,
    config.filters.q,
    config.filters.subject,
    config.filters.fromAddress,
    config.filters.toAddress,
    config.filters.dateFrom,
    config.filters.dateTo,
    config.filters.unreadOnly,
    config.filters.flaggedOnly,
  ]);

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Icon name="search" size={16} />
          <div>
            <h3 className={styles.title}>{config.title}</h3>
            <p className={styles.subtitle}>
              {account ? account.label : "Unknown account"} · {config.folder} · {filterSummary(config)}
            </p>
          </div>
        </div>
        <button className={styles.editButton} onClick={onEdit} aria-label="Edit widget">
          <Icon name="settings" size={14} />
        </button>
      </header>
      <div className={styles.body}>
        {!account ? (
          <EmptyState title="Account no longer exists" description="Edit this widget to point it at a current account." />
        ) : loading ? (
          <Spinner label="Searching..." />
        ) : error ? (
          <EmptyState title="Couldn't load messages" description={error} />
        ) : messages.length === 0 ? (
          <EmptyState title="No matching messages" />
        ) : (
          <>
            <ul className={styles.list}>
              {messages.map((message) => (
                <li key={message.uid}>
                  <button
                    className={styles.item}
                    onClick={() => onOpenMessage(message.uid, config.accountId, config.folder)}
                  >
                    <div className={styles.row}>
                      <span className={`${styles.sender} ${!message.is_read ? styles.unread : ""}`}>
                        {message.sender_name || message.sender_address}
                      </span>
                      <span className={styles.date}>{formatDate(message.date)}</span>
                    </div>
                    <span className={`${styles.subject} ${!message.is_read ? styles.unread : ""}`}>
                      {message.is_flagged && <Icon name="star" size={11} className={styles.flag} />}
                      {message.subject}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {total > messages.length && (
              <p className={styles.moreHint}>+{total - messages.length} more match this search</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
