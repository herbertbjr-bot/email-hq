import { useState } from "react";
import { accountsApi } from "../../api/accounts";
import { useAccountContext } from "../../context/AccountContext";
import { useToast } from "../../context/ToastContext";
import { Icon } from "../../icons/IconRegistry";
import type { EmailAccount } from "../../types";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { AccountForm } from "./AccountForm";
import styles from "./AccountSwitcher.module.css";

const PROFILE_LABEL: Record<string, string> = {
  personal: "Personal",
  business: "Business",
  other: "Other",
};

export function AccountSwitcher() {
  const { accounts, selectedAccountId, selectAccount, refreshAccounts } = useAccountContext();
  const { notify } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EmailAccount | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await accountsApi.remove(pendingDelete.id);
    notify(`Removed ${pendingDelete.label}`, "success");
    setPendingDelete(null);
    await refreshAccounts();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <span className={styles.heading}>Accounts</span>
        <button className={styles.addButton} onClick={() => setShowForm(true)} aria-label="Add account">
          <Icon name="plus" size={13} />
        </button>
      </div>

      <ul className={styles.list}>
        {accounts.map((account) => (
          <li key={account.id}>
            <div className={`${styles.item} ${account.id === selectedAccountId ? styles.itemActive : ""}`}>
              <button className={styles.itemMain} onClick={() => selectAccount(account.id)}>
                <span className={styles.dot} style={{ background: account.color }} />
                <span className={styles.itemText}>
                  <span className={styles.itemLabel}>{account.label}</span>
                  <span className={styles.itemMeta}>
                    {PROFILE_LABEL[account.profile] ?? account.profile} · {account.email_address}
                  </span>
                </span>
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => setPendingDelete(account)}
                aria-label={`Delete ${account.label}`}
                title="Delete account"
              >
                <Icon name="trash" size={13} />
              </button>
            </div>
          </li>
        ))}
        {accounts.length === 0 && <li className={styles.empty}>No accounts yet</li>}
      </ul>

      {showForm && (
        <AccountForm
          onClose={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            await refreshAccounts();
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete ${pendingDelete.label}?`}
          description={`This removes ${pendingDelete.email_address} and its saved IMAP/SMTP credentials from Email HQ. This can't be undone.`}
          confirmLabel="Delete account"
          danger
          onConfirm={handleDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
