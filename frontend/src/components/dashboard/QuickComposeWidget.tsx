import { useState } from "react";
import type { FormEvent } from "react";
import { mailApi } from "../../api/mail";
import { useAccountContext } from "../../context/AccountContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { Icon } from "../../icons/IconRegistry";
import styles from "./QuickComposeWidget.module.css";
import { WidgetCard } from "./WidgetCard";

export function QuickComposeWidget({
  editMode,
  ...cardProps
}: {
  editMode: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onHide: () => void;
}) {
  const { selectedAccountId, selectedAccount } = useAccountContext();
  const { notify } = useToast();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedAccountId) return;
    setSending(true);
    try {
      await mailApi.send(selectedAccountId, {
        to: to.split(",").map((v) => v.trim()).filter(Boolean),
        subject,
        body_text: body,
      });
      notify("Message sent", "success");
      setTo("");
      setSubject("");
      setBody("");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <WidgetCard title="Quick compose" icon={<Icon name="pencil" size={16} />} editMode={editMode} {...cardProps}>
      {!selectedAccountId ? (
        <EmptyState title="No account selected" description="Pick an account to compose from." />
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.from}>From {selectedAccount?.email_address}</p>
          <input
            required
            className={styles.input}
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            required
            className={styles.input}
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            required
            className={styles.textarea}
            placeholder="Write a quick message..."
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button type="submit" disabled={sending} className={styles.sendButton}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </form>
      )}
    </WidgetCard>
  );
}
