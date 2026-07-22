import { useState } from "react";
import type { FormEvent } from "react";
import { mailApi } from "../../api/mail";
import { useAccountContext } from "../../context/AccountContext";
import { useToast } from "../../context/ToastContext";
import { Icon } from "../../icons/IconRegistry";
import { Button } from "../common/Button";
import styles from "./ComposeModal.module.css";

export interface ComposeInitialValues {
  to?: string;
  subject?: string;
  body?: string;
  inReplyTo?: string;
}

export function ComposeModal({
  initialValues,
  onClose,
  onSent,
}: {
  initialValues?: ComposeInitialValues;
  onClose: () => void;
  onSent: () => void;
}) {
  const { selectedAccountId } = useAccountContext();
  const { notify } = useToast();
  const [to, setTo] = useState(initialValues?.to ?? "");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(initialValues?.subject ?? "");
  const [body, setBody] = useState(initialValues?.body ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const splitAddresses = (value: string) =>
    value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedAccountId) return;
    setSending(true);
    setError(null);
    try {
      await mailApi.send(selectedAccountId, {
        to: splitAddresses(to),
        cc: splitAddresses(cc),
        subject,
        body_text: body,
        in_reply_to: initialValues?.inReplyTo,
      });
      notify("Message sent", "success");
      onSent();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
      notify(message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>New message</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span>To</span>
            <input required value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
          </label>
          <label className={styles.field}>
            <span>Cc</span>
            <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="optional" />
          </label>
          <label className={styles.field}>
            <span>Subject</span>
            <input required value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Message</span>
            <textarea required rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending || !selectedAccountId}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
