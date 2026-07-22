import { useState } from "react";
import { useAccountContext } from "../../context/AccountContext";
import { Icon } from "../../icons/IconRegistry";
import { AccountForm } from "./AccountForm";
import styles from "./AccountSwitcher.module.css";

const PROFILE_LABEL: Record<string, string> = {
  personal: "Personal",
  business: "Business",
  other: "Other",
};

export function AccountSwitcher() {
  const { accounts, selectedAccountId, selectAccount, refreshAccounts } = useAccountContext();
  const [showForm, setShowForm] = useState(false);

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
            <button
              className={`${styles.item} ${account.id === selectedAccountId ? styles.itemActive : ""}`}
              onClick={() => selectAccount(account.id)}
            >
              <span className={styles.dot} style={{ background: account.color }} />
              <span className={styles.itemText}>
                <span className={styles.itemLabel}>{account.label}</span>
                <span className={styles.itemMeta}>
                  {PROFILE_LABEL[account.profile] ?? account.profile} · {account.email_address}
                </span>
              </span>
            </button>
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
    </div>
  );
}
