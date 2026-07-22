import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { accountsApi } from "../api/accounts";
import type { EmailAccount } from "../types";

interface AccountContextValue {
  accounts: EmailAccount[];
  selectedAccount: EmailAccount | null;
  selectedAccountId: string | null;
  selectedFolder: string;
  loading: boolean;
  error: string | null;
  selectAccount: (accountId: string) => void;
  selectFolder: (folder: string) => void;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("INBOX");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountsApi.list();
      setAccounts(data);
      setSelectedAccountId((current) => {
        if (current && data.some((a) => a.id === current)) return current;
        const defaultAccount = data.find((a) => a.is_default) ?? data[0];
        return defaultAccount ? defaultAccount.id : null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAccounts();
  }, [refreshAccounts]);

  const selectAccount = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setSelectedFolder("INBOX");
  }, []);

  const selectFolder = useCallback((folder: string) => {
    setSelectedFolder(folder);
  }, []);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const value: AccountContextValue = {
    accounts,
    selectedAccount,
    selectedAccountId,
    selectedFolder,
    loading,
    error,
    selectAccount,
    selectFolder,
    refreshAccounts,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccountContext(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccountContext must be used within an AccountProvider");
  return ctx;
}
