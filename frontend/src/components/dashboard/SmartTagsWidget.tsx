import { useAccountContext } from "../../context/AccountContext";
import { useInboxInsights } from "../../hooks/useInboxInsights";
import { EmptyState } from "../common/EmptyState";
import { Icon } from "../../icons/IconRegistry";
import { Spinner } from "../common/Spinner";
import styles from "./SmartTagsWidget.module.css";
import { WidgetCard } from "./WidgetCard";

export function SmartTagsWidget({
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
  const { selectedAccountId } = useAccountContext();
  const { messages, loading, error } = useInboxInsights(selectedAccountId, 8);

  const counts = new Map<string, number>();
  for (const message of messages) {
    for (const tag of message.ai_tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = entries[0]?.[1] ?? 1;

  return (
    <WidgetCard title="Smart tags" icon={<Icon name="sparkles" size={16} />} editMode={editMode} {...cardProps}>
      {!selectedAccountId ? (
        <EmptyState title="No account selected" />
      ) : loading ? (
        <Spinner label="Tagging recent messages..." />
      ) : error ? (
        <EmptyState title="Couldn't load tags" description={error} />
      ) : entries.length === 0 ? (
        <EmptyState title="No tags yet" description="AI tags for recent messages will appear here." />
      ) : (
        <div className={styles.cloud}>
          {entries.map(([tag, count]) => {
            const weight = 0.75 + (count / maxCount) * 0.6;
            return (
              <span key={tag} className={styles.tag} style={{ fontSize: `${weight * 12}px` }}>
                {tag}
                <span className={styles.count}>{count}</span>
              </span>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
