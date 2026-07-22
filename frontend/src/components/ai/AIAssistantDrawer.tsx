import { useEffect, useState } from "react";
import { aiApi } from "../../api/ai";
import type { AIStatus } from "../../api/ai";
import { mailApi } from "../../api/mail";
import { useAccountContext } from "../../context/AccountContext";
import { Icon } from "../../icons/IconRegistry";
import type { MessageDetail, PriorityLevel } from "../../types";
import { EmptyState } from "../common/EmptyState";
import { Spinner } from "../common/Spinner";
import { PriorityIndicator } from "./PriorityIndicator";
import { QuickReplyPanel } from "./QuickReplyPanel";
import { SmartTagList } from "./SmartTagBadge";
import styles from "./AIAssistantDrawer.module.css";

/**
 * Global slide-out panel for AI features: live status (real model vs
 * heuristic - see backend/app/services/ai/), plus contextual tags,
 * priority, and quick-reply drafts for whichever message is open in Mail.
 * Toggled from the Topbar so it's reachable from any view.
 */
export function AIAssistantDrawer({
  open,
  onClose,
  selectedMessageUid,
  onReply,
}: {
  open: boolean;
  onClose: () => void;
  selectedMessageUid: string | null;
  onReply: (message: MessageDetail, body: string) => void;
}) {
  const { selectedAccountId, selectedFolder } = useAccountContext();
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<PriorityLevel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    aiApi
      .status()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [open]);

  useEffect(() => {
    if (!open || !selectedAccountId || !selectedMessageUid) {
      setMessage(null);
      setTags([]);
      setPriority(null);
      return;
    }
    let cancelled = false;
    setLoading(true);

    mailApi
      .message(selectedAccountId, selectedFolder, selectedMessageUid)
      .then(async (detail) => {
        if (cancelled) return;
        setMessage(detail);
        const bodyText = detail.body_text ?? detail.snippet;
        const [tagRes, priorityRes] = await Promise.allSettled([
          aiApi.tag({ subject: detail.subject, body_text: bodyText, sender_address: detail.sender_address }),
          aiApi.prioritize({ subject: detail.subject, body_text: bodyText, sender_address: detail.sender_address }),
        ]);
        if (cancelled) return;
        if (tagRes.status === "fulfilled") setTags(tagRes.value.tags);
        if (priorityRes.status === "fulfilled") setPriority(priorityRes.value.priority);
      })
      .catch(() => {
        if (!cancelled) setMessage(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, selectedAccountId, selectedFolder, selectedMessageUid]);

  return (
    <>
      {open && <div className={styles.scrim} onClick={onClose} />}
      <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`} aria-hidden={!open}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            <Icon name="sparkles" size={16} />
            AI Assistant
          </span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close AI Assistant">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className={styles.statusRow}>
          <span className={`${styles.statusDot} ${status?.enabled ? styles.statusLive : ""}`} />
          {status ? (
            <span>{status.enabled ? `Live via ${status.model}` : "Running on built-in heuristics"}</span>
          ) : (
            <span>Checking AI status...</span>
          )}
        </div>

        <div className={styles.content}>
          {!selectedMessageUid ? (
            <EmptyState
              title="No message open"
              description="Open a message in Mail to get AI-suggested tags, a priority score, and quick-reply drafts here."
            />
          ) : loading ? (
            <Spinner label="Analyzing message..." />
          ) : message ? (
            <>
              <div className={styles.messageContext}>
                <span className={styles.contextLabel}>For</span>
                <span className={styles.contextSubject}>{message.subject}</span>
              </div>
              <div className={styles.insightsRow}>
                <PriorityIndicator priority={priority} />
                <SmartTagList tags={tags} />
              </div>
              <QuickReplyPanel message={message} onPick={(body) => onReply(message, body)} />
            </>
          ) : (
            <EmptyState title="Couldn't load message" />
          )}
        </div>
      </aside>
    </>
  );
}
