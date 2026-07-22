import { useEffect, useState } from "react";
import { mailApi } from "../../api/mail";
import { useAccountContext } from "../../context/AccountContext";
import type { EmailAccount } from "../../types";
import { EmptyState } from "../common/EmptyState";
import { Icon } from "../../icons/IconRegistry";
import styles from "./AccountsOverviewWidget.module.css";
import { WidgetCard } from "./WidgetCard";

function initials(label: string): string {
  return label
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AccountRow({ account, onOpen }: { account: EmailAccount; onOpen: () => void }) {
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    mailApi
      .folders(account.id)
      .then((folders) => {
        if (cancelled) return;
        const inbox = folders.find((f) => f.name.toUpperCase() === "INBOX");
        setUnread(inbox ? inbox.unread_count : 0);
      })
      .catch(() => {
        if (!cancelled) setUnread(null);
      });
    return () => {
      cancelled = true;
    };
  }, [account.id]);

  return (
    <button className={styles.row} onClick={onOpen}>
      <span className={styles.avatar} style={{ background: account.color }}>
        {initials(account.label)}
      </span>
      <span className={styles.info}>
        <span className={styles.label}>{account.label}</span>
        <span className={styles.email}>{account.email_address}</span>
      </span>
      {unread === null ? (
        <span className={styles.status}>--</span>
      ) : unread > 0 ? (
        <span className={styles.unreadBadge}>{unread} unread</span>
      ) : (
        <span className={styles.caughtUp}>Caught up</span>
      )}
    </button>
  );
}

export function AccountsOverviewWidget({
  editMode,
  onOpenMail,
  ...cardProps
}: {
  editMode: boolean;
  onOpenMail: (accountId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onHide: () => void;
}) {
  const { accounts, selectAccount } = useAccountContext();

  return (
    <WidgetCard title="Accounts overview" icon={<Icon name="inbox" size={16} />} editMode={editMode} {...cardProps}>
      {accounts.length === 0 ? (
        <EmptyState title="No accounts yet" description="Add an account to see it here." />
      ) : (
        <div className={styles.list}>
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onOpen={() => {
                selectAccount(account.id);
                onOpenMail(account.id);
              }}
            />
          ))}
        </div>
      )}
    </WidgetCard>
  );
}
