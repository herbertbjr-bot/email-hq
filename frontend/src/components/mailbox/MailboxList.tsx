import { useAccountContext } from "../../context/AccountContext";
import { useMessages } from "../../hooks/useMessages";
import { EmptyState } from "../common/EmptyState";
import { Spinner } from "../common/Spinner";
import { MessageListItem } from "./MessageListItem";
import styles from "./MailboxList.module.css";

export function MailboxList({
  selectedUid,
  onSelect,
}: {
  selectedUid: string | null;
  onSelect: (uid: string) => void;
}) {
  const { selectedAccountId, selectedFolder } = useAccountContext();
  const { messages, total, loading, error } = useMessages(selectedAccountId, selectedFolder);

  if (!selectedAccountId) {
    return (
      <div className={styles.list}>
        <EmptyState title="No account selected" description="Add or select an email account to get started." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.list}>
        <Spinner label="Loading messages..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.list}>
        <EmptyState title="Couldn't load messages" description={error} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={styles.list}>
        <EmptyState title="This folder is empty" />
      </div>
    );
  }

  return (
    <div className={styles.list}>
      <div className={styles.summary}>
        {total} message{total === 1 ? "" : "s"}
      </div>
      <ul className={styles.items}>
        {messages.map((message) => (
          <MessageListItem
            key={message.uid}
            message={message}
            active={message.uid === selectedUid}
            onClick={() => onSelect(message.uid)}
          />
        ))}
      </ul>
    </div>
  );
}
