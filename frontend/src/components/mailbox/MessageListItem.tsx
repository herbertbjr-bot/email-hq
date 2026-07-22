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
  onClick,
}: {
  message: MessageSummary;
  active: boolean;
  onClick: () => void;
}) {
  const displayName = message.sender_name || message.sender_address;

  return (
    <li>
      <button
        className={`${styles.item} ${active ? styles.itemActive : ""} ${!message.is_read ? styles.unread : ""}`}
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
          <p className={styles.snippet}>{message.snippet}</p>
          {(message.ai_tags.length > 0 || message.ai_priority) && (
            <div className={styles.aiRow}>
              <PriorityIndicator priority={message.ai_priority} />
              <SmartTagList tags={message.ai_tags} />
            </div>
          )}
        </span>
        {!message.is_read && <span className={styles.unreadDot} />}
      </button>
    </li>
  );
}
