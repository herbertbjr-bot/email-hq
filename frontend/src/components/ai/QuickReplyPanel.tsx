import { useState } from "react";
import { aiApi } from "../../api/ai";
import type { MessageDetail, QuickReplySuggestion } from "../../types";
import { Button } from "../common/Button";
import { Spinner } from "../common/Spinner";
import styles from "./QuickReplyPanel.module.css";

/**
 * Fetches quick-reply drafts from backend/app/services/ai/quick_reply.py.
 * That service currently returns templated text; once a real model is
 * wired in behind AI_PROVIDER, suggestions here become model-generated
 * without any frontend changes.
 */
export function QuickReplyPanel({
  message,
  onPick,
}: {
  message: MessageDetail;
  onPick: (body: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<QuickReplySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.quickReply({
        subject: message.subject,
        body_text: message.body_text ?? message.snippet,
        sender_name: message.sender_name,
        tone: "professional",
      });
      setSuggestions(result.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate quick replies");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Quick replies</span>
        <Button variant="ghost" onClick={load} disabled={loading}>
          {suggestions.length > 0 ? "Regenerate" : "Suggest replies"}
        </Button>
      </div>
      {loading && <Spinner label="Generating suggestions..." />}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && suggestions.length > 0 && (
        <ul className={styles.list}>
          {suggestions.map((s) => (
            <li key={s.label}>
              <button className={styles.suggestion} onClick={() => onPick(s.body)}>
                <span className={styles.label}>{s.label}</span>
                <span className={styles.preview}>{s.body}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
