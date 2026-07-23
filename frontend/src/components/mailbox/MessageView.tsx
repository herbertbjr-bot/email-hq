import { useEffect, useMemo, useState } from "react";
import { aiApi } from "../../api/ai";
import { mailApi } from "../../api/mail";
import { useAccountContext } from "../../context/AccountContext";
import { useToast } from "../../context/ToastContext";
import { useFolders } from "../../hooks/useFolders";
import { Icon } from "../../icons/IconRegistry";
import type { MessageDetail, PriorityLevel } from "../../types";
import { PriorityIndicator } from "../ai/PriorityIndicator";
import { SmartTagList } from "../ai/SmartTagBadge";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { Spinner } from "../common/Spinner";
import type { ComposeInitialValues } from "./ComposeModal";
import styles from "./MessageView.module.css";
import { SafeHtmlEmail } from "./SafeHtmlEmail";

/** Strips HTML tags for use in a plain-text quoted reply/forward body - the
 * result is never rendered as HTML, only inserted into a compose textarea,
 * so this doesn't need to be XSS-safe the way SafeHtmlEmail does. */
function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() ?? "";
}

function quoteLines(text: string): string {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export function MessageView({
  uid,
  onOpenAssistant,
  onCompose,
  onMessageRemoved,
}: {
  uid: string | null;
  onOpenAssistant: () => void;
  onCompose: (values: ComposeInitialValues) => void;
  onMessageRemoved: () => void;
}) {
  const { selectedAccountId, selectedFolder, selectedAccount } = useAccountContext();
  const { folders } = useFolders(selectedAccountId);
  const { notify } = useToast();
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [aiPriority, setAiPriority] = useState<PriorityLevel | null>(null);
  const [busy, setBusy] = useState(false);
  const [moveTarget, setMoveTarget] = useState("");

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
    setMoveTarget("");

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

  const quotedBody = useMemo(() => {
    if (!message) return "";
    const original = message.body_text ?? (message.body_html ? htmlToPlainText(message.body_html) : message.snippet);
    const when = message.date ? new Date(message.date).toLocaleString() : "";
    const from = message.sender_name || message.sender_address;
    return `\n\nOn ${when}, ${from} wrote:\n${quoteLines(original)}`;
  }, [message]);

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

  const handleReply = () => {
    onCompose({
      to: message.sender_address,
      subject: message.subject.toLowerCase().startsWith("re:") ? message.subject : `Re: ${message.subject}`,
      body: quotedBody,
      inReplyTo: message.uid,
    });
  };

  const handleReplyAll = () => {
    const selfAddress = selectedAccount?.email_address?.toLowerCase();
    const ccAddresses = message.recipients.filter((addr) => addr.toLowerCase() !== selfAddress);
    onCompose({
      to: message.sender_address,
      cc: ccAddresses.join(", "),
      subject: message.subject.toLowerCase().startsWith("re:") ? message.subject : `Re: ${message.subject}`,
      body: quotedBody,
      inReplyTo: message.uid,
    });
  };

  const handleForward = () => {
    const header = `\n\n---------- Forwarded message ----------\nFrom: ${message.sender_name || message.sender_address} <${message.sender_address}>\nDate: ${message.date ? new Date(message.date).toLocaleString() : ""}\nSubject: ${message.subject}\nTo: ${message.recipients.join(", ")}`;
    const original = message.body_text ?? (message.body_html ? htmlToPlainText(message.body_html) : message.snippet);
    onCompose({
      subject: message.subject.toLowerCase().startsWith("fwd:") ? message.subject : `Fwd: ${message.subject}`,
      body: `${header}\n\n${original}`,
    });
  };

  const toggleFlag = async () => {
    if (!selectedAccountId) return;
    setBusy(true);
    try {
      await mailApi.setFlags(selectedAccountId, selectedFolder, message.uid, { is_flagged: !message.is_flagged });
      setMessage({ ...message, is_flagged: !message.is_flagged });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update message", "error");
    } finally {
      setBusy(false);
    }
  };

  const markUnread = async () => {
    if (!selectedAccountId) return;
    setBusy(true);
    try {
      await mailApi.setFlags(selectedAccountId, selectedFolder, message.uid, { is_read: false });
      notify("Marked as unread", "success");
      onMessageRemoved();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update message", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccountId) return;
    setBusy(true);
    try {
      await mailApi.remove(selectedAccountId, selectedFolder, message.uid);
      notify("Message deleted", "success");
      onMessageRemoved();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete message", "error");
      setBusy(false);
    }
  };

  const handleMove = async (targetFolder: string) => {
    if (!selectedAccountId || !targetFolder) return;
    setBusy(true);
    try {
      await mailApi.move(selectedAccountId, selectedFolder, message.uid, targetFolder);
      notify(`Moved to ${targetFolder}`, "success");
      onMessageRemoved();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to move message", "error");
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Button variant="secondary" onClick={handleReply} disabled={busy}>
          <Icon name="pencil" size={14} />
          Reply
        </Button>
        <Button variant="secondary" onClick={handleReplyAll} disabled={busy}>
          Reply All
        </Button>
        <Button variant="secondary" onClick={handleForward} disabled={busy}>
          <Icon name="send" size={14} />
          Forward
        </Button>
        <span className={styles.toolbarSpacer} />
        <button
          className={`${styles.toolbarIcon} ${message.is_flagged ? styles.toolbarIconActive : ""}`}
          onClick={toggleFlag}
          disabled={busy}
          title={message.is_flagged ? "Remove flag" : "Flag message"}
        >
          <Icon name="star" size={16} />
        </button>
        <button className={styles.toolbarIcon} onClick={markUnread} disabled={busy} title="Mark as unread">
          <Icon name="eyeOff" size={16} />
        </button>
        <select
          className={styles.moveSelect}
          value={moveTarget}
          disabled={busy || folders.length === 0}
          onChange={(e) => {
            setMoveTarget(e.target.value);
            void handleMove(e.target.value);
          }}
        >
          <option value="">Move to...</option>
          {folders
            .filter((f) => f.name !== selectedFolder)
            .map((f) => (
              <option key={f.name} value={f.name}>
                {f.display_name}
              </option>
            ))}
        </select>
        <button className={styles.toolbarIconDanger} onClick={handleDelete} disabled={busy} title="Delete">
          <Icon name="trash" size={16} />
        </button>
      </div>

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
        {message.body_html ? (
          <SafeHtmlEmail html={message.body_html} />
        ) : message.body_text ? (
          <pre className={styles.bodyText}>{message.body_text}</pre>
        ) : (
          <EmptyState title="This message has no readable content" />
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
