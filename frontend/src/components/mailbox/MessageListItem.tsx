import type { MouseEvent } from "react";
import { mailApi } from "../../api/mail";
import { useAccountContext } from "../../context/AccountContext";
import { useToast } from "../../context/ToastContext";
import type { MailDensity } from "../../hooks/useMailViewPreferences";
import { Icon } from "../../icons/IconRegistry";
import type { MessageSummary } from "../../types";
import { PriorityIndicator } from "../ai/PriorityIndicator";
import { SmartTagList } from "../ai/SmartTagBadge";
import styles from "./MessageListItem.module.css";

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : trimmed.slice(0, 2).toUpperCase();
}

export function MessageListItem({
  message,
  active,
  density,
  onClick,
  onChanged,
}: {
  message: MessageSummary;
  active: boolean;
  density: MailDensity;
  onClick: () => void;
  onChanged: () => void;
}) {
  const { selectedAccountId, selectedFolder } = useAccountContext();
  const { notify } = useToast();
  const displayName = message.sender_name || message.sender_address;
  const compact = density === "compact";

  const stop = (event: MouseEvent) => event.stopPropagation();

  const toggleRead = async (event: MouseEvent) => {
    stop(event);
    if (!selectedAccountId) return;
    try {
      await mailApi.setFlags(selectedAccountId, selectedFolder, message.uid, { is_read: !message.is_read });
      onChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update message", "error");
    }
  };

  const toggleFlag = async (event: MouseEvent) => {
    stop(event);
    if (!selectedAccountId) return;
    try {
      await mailApi.setFlags(selectedAccountId, selectedFolder, message.uid, { is_flagged: !message.is_flagged });
      onChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update message", "error");
    }
  };

  const handleDelete = async (event: MouseEvent) => {
    stop(event);
    if (!selectedAccountId) return;
    try {
      await mailApi.remove(selectedAccountId, selectedFolder, message.uid);
      notify("Message deleted", "success");
      onChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete message", "error");
    }
  };

  return (
    <li>
      <button
        className={`${styles.item} ${active ? styles.itemActive : ""} ${!message.is_read ? styles.unread : ""} ${compact ? styles.compact : ""}`}
        onClick={onClick}
      >
        <span className={styles.avatar}>{initials(displayName)}</span>
        <span className={styles.content}>
          <div className={styles.row}>
            <span className={styles.sender}>{displayName}</span>
            <span className={styles.date}>{formatDate(message.date)}</span>
          </div>
          <div className={styles.subjectRow}>
            {message.is_flagged && <Icon name="star" size={12} className={styles.flag} />}
            <span className={styles.subject}>{message.subject}</span>
            {message.has_attachments && <Icon name="paperclip" size={12} className={styles.attachment} />}
          </div>
          {!compact && <p className={styles.snippet}>{message.snippet}</p>}
          {!compact && (message.ai_tags.length > 0 || message.ai_priority) && (
            <div className={styles.aiRow}>
              <PriorityIndicator priority={message.ai_priority} />
              <SmartTagList tags={message.ai_tags} />
            </div>
          )}
        </span>
        {!message.is_read && <span className={styles.unreadDot} />}

        <span className={styles.quickActions}>
          <span
            className={`${styles.quickAction} ${message.is_flagged ? styles.quickActionActive : ""}`}
            role="button"
            tabIndex={0}
            onClick={toggleFlag}
            title={message.is_flagged ? "Remove flag" : "Flag message"}
          >
            <Icon name="star" size={13} />
          </span>
          <span
            className={`${styles.quickAction} ${message.is_read ? "" : styles.quickActionActive}`}
            role="button"
            tabIndex={0}
            onClick={toggleRead}
            title={message.is_read ? "Mark as unread" : "Mark as read"}
          >
            <Icon name="check" size={13} />
          </span>
          <span
            className={styles.quickAction}
            role="button"
            tabIndex={0}
            onClick={handleDelete}
            title="Delete"
          >
            <Icon name="trash" size={13} />
          </span>
        </span>
      </button>
    </li>
  );
}
