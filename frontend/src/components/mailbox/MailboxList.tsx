import { useState } from "react";
import { useAccountContext } from "../../context/AccountContext";
import { useMailViewPreferences } from "../../hooks/useMailViewPreferences";
import { useMessages } from "../../hooks/useMessages";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { Spinner } from "../common/Spinner";
import { MailToolbar } from "./MailToolbar";
import styles from "./MailboxList.module.css";
import { MessageListItem } from "./MessageListItem";

export function MailboxList({
  selectedUid,
  onSelect,
  refreshToken,
}: {
  selectedUid: string | null;
  onSelect: (uid: string) => void;
  refreshToken: number;
}) {
  const { selectedAccountId, selectedFolder } = useAccountContext();
  const { density, sort, setDensity, setSort } = useMailViewPreferences();
  const [q, setQ] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const { messages, total, loading, loadingMore, error, reload, loadMore, hasMore } = useMessages(
    selectedAccountId,
    selectedFolder,
    { q, unreadOnly, flaggedOnly, sort },
    refreshToken,
  );

  if (!selectedAccountId) {
    return (
      <div className={styles.list}>
        <EmptyState title="No account selected" description="Add or select an email account to get started." />
      </div>
    );
  }

  return (
    <div className={styles.list}>
      <MailToolbar
        q={q}
        onQChange={setQ}
        unreadOnly={unreadOnly}
        onUnreadOnlyChange={setUnreadOnly}
        flaggedOnly={flaggedOnly}
        onFlaggedOnlyChange={setFlaggedOnly}
        sort={sort}
        onSortChange={setSort}
        density={density}
        onDensityChange={setDensity}
        onRefresh={reload}
        refreshing={loading}
      />

      {loading ? (
        <Spinner label="Loading messages..." />
      ) : error ? (
        <EmptyState title="Couldn't load messages" description={error} />
      ) : messages.length === 0 ? (
        <EmptyState
          title={q || unreadOnly || flaggedOnly ? "No matching messages" : "This folder is empty"}
          description={q || unreadOnly || flaggedOnly ? "Try a different search or clear the filters." : undefined}
        />
      ) : (
        <>
          <div className={styles.summary}>
            {total} message{total === 1 ? "" : "s"}
          </div>
          <ul className={styles.items}>
            {messages.map((message) => (
              <MessageListItem
                key={message.uid}
                message={message}
                active={message.uid === selectedUid}
                density={density}
                onClick={() => onSelect(message.uid)}
                onChanged={reload}
              />
            ))}
          </ul>
          {hasMore && (
            <div className={styles.loadMoreRow}>
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
