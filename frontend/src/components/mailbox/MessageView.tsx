import { useEffect, useState } from "react";
import { aiApi } from "../../api/ai";
import { mailApi } from "../../api/mail";
import { useAccountContext } from "../../context/AccountContext";
import type { MessageDetail, PriorityLevel } from "../../types";
import { PriorityIndicator } from "../ai/PriorityIndicator";
import { SmartTagList } from "../ai/SmartTagBadge";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { Icon } from "../../icons/IconRegistry";
import { Spinner } from "../common/Spinner";
import styles from "./MessageView.module.css";

export function MessageView({ uid, onOpenAssistant }: { uid: string | null; onOpenAssistant: () => void }) {
  const { selectedAccountId, selectedFolder } = useAccountContext();
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [aiPriority, setAiPriority] = useState<PriorityLevel | null>(null);

  useEffect(() => {
    if (!selectedAccountId || !uid) {
      setMessage(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAiTags([]);
    setAiPriority(null);

    mailApi
      .message(selectedAccountId, selectedFolder, uid)
      .then(async (detail) => {
        if (cancelled) return;
        setMessage(detail);

        if (!detail.is_read) {
          void mailApi.setFlags(selectedAccountId, selectedFolder, uid, { is_read: true });
        }

        // Smart tagging + prioritization are placeholder AI features today
        // (see backend/app/services/ai/). Requested on-demand per message
        // rather than pre-computed for every message in the list.
        const bodyText = detail.body_text ?? detail.snippet;
        void aiApi
          .tag({ subject: detail.subject, body_text: bodyText, sender_address: detail.sender_address })
          .then((res) => !cancelled && setAiTags(res.tags))
          .catch(() => undefined);
        void aiApi
          .prioritize({ subject: detail.subject, body_text: bodyText, sender_address: detail.sender_address })
          .then((res) => !cancelled && setAiPriority(res.priority))
          .catch(() => undefined);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load message");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAccountId, selectedFolder, uid]);

  if (!uid) {
    return (
      <div className={styles.wrap}>
        <EmptyState title="Select a message" description="Choose a message from the list to read it here." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <Spinner label="Loading message..." />
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className={styles.wrap}>
        <EmptyState title="Couldn't load message" description={error ?? undefined} />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.subject}>{message.subject}</h2>
        <div className={styles.meta}>
          <span>
            <strong>{message.sender_name || message.sender_address}</strong> &lt;{message.sender_address}&gt;
          </span>
          {message.date && <span>{new Date(message.date).toLocaleString()}</span>}
        </div>
        <div className={styles.aiRow}>
          <PriorityIndicator priority={aiPriority} />
          <SmartTagList tags={aiTags} />
        </div>
      </div>

      <div className={styles.body}>
        {message.body_text ? (
          <pre className={styles.bodyText}>{message.body_text}</pre>
        ) : (
          <EmptyState
            title="HTML-only message"
            description="This message has no plain-text part. Rendering raw HTML is disabled until an HTML sanitizer (e.g. DOMPurify) is wired in, to avoid executing untrusted content."
          />
        )}
        {message.attachments.length > 0 && (
          <div className={styles.attachments}>
            <span className={styles.attachmentsLabel}>Attachments</span>
            <ul>
              {message.attachments.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Button variant="secondary" onClick={onOpenAssistant} className={styles.assistantButton}>
        <Icon name="sparkles" size={15} />
        Open AI Assistant for quick replies
      </Button>
    </div>
  );
}
