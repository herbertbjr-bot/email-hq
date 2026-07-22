import { useAccountContext } from "../../context/AccountContext";
import { useInboxInsights } from "../../hooks/useInboxInsights";
import { PriorityIndicator } from "../ai/PriorityIndicator";
import { EmptyState } from "../common/EmptyState";
import { Icon } from "../../icons/IconRegistry";
import { Spinner } from "../common/Spinner";
import styles from "./PriorityInboxWidget.module.css";
import { WidgetCard } from "./WidgetCard";

const PRIORITY_WEIGHT: Record<string, number> = { urgent: 3, high: 2, normal: 1, low: 0 };

export function PriorityInboxWidget({
  editMode,
  onOpenMessage,
  ...cardProps
}: {
  editMode: boolean;
  onOpenMessage: (uid: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onHide: () => void;
}) {
  const { selectedAccountId, selectedAccount } = useAccountContext();
  const { messages, loading, error } = useInboxInsights(selectedAccountId, 8);

  const ranked = [...messages]
    .sort((a, b) => (PRIORITY_WEIGHT[b.ai_priority ?? "low"] ?? 0) - (PRIORITY_WEIGHT[a.ai_priority ?? "low"] ?? 0))
    .slice(0, 5);

  return (
    <WidgetCard title="Priority inbox" icon={<Icon name="sparkles" size={16} />} editMode={editMode} {...cardProps}>
      {!selectedAccountId ? (
        <EmptyState title="No account selected" description="Pick an account to see AI-ranked messages." />
      ) : loading ? (
        <Spinner label="Scoring recent messages..." />
      ) : error ? (
        <EmptyState title="Couldn't load messages" description={error} />
      ) : ranked.length === 0 ? (
        <EmptyState title="Inbox is empty" description={`No messages in ${selectedAccount?.email_address ?? "this account"}.`} />
      ) : (
        <ul className={styles.list}>
          {ranked.map((message) => (
            <li key={message.uid}>
              <button className={styles.item} onClick={() => onOpenMessage(message.uid)}>
                <div className={styles.row}>
                  <span className={styles.sender}>{message.sender_name || message.sender_address}</span>
                  <PriorityIndicator priority={message.ai_priority} />
                </div>
                <span className={styles.subject}>{message.subject}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
