import { useState } from "react";
import type { FormEvent } from "react";
import type { MailSort } from "../../api/mail";
import { useAccountContext } from "../../context/AccountContext";
import { useFolders } from "../../hooks/useFolders";
import type { SmartWidgetConfig, SmartWidgetFilters } from "../../hooks/useSmartWidgets";
import { Icon } from "../../icons/IconRegistry";
import { Button } from "../common/Button";
import styles from "./SmartWidgetEditor.module.css";

type FormState = {
  title: string;
  accountId: string;
  folder: string;
  filters: SmartWidgetFilters;
  sort: MailSort;
  limit: number;
};

function toFormState(initial: SmartWidgetConfig | undefined, defaultAccountId: string): FormState {
  if (initial) {
    return {
      title: initial.title,
      accountId: initial.accountId,
      folder: initial.folder,
      filters: { ...initial.filters },
      sort: initial.sort,
      limit: initial.limit,
    };
  }
  return {
    title: "",
    accountId: defaultAccountId,
    folder: "INBOX",
    filters: {},
    sort: "date_desc",
    limit: 10,
  };
}

export function SmartWidgetEditor({
  initial,
  onSave,
  onClose,
  onDelete,
}: {
  initial?: SmartWidgetConfig;
  onSave: (config: Omit<SmartWidgetConfig, "id">) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const { accounts } = useAccountContext();
  const [form, setForm] = useState<FormState>(() => toFormState(initial, accounts[0]?.id ?? ""));
  const { folders } = useFolders(form.accountId || null);

  const updateFilters = <K extends keyof SmartWidgetFilters>(key: K, value: SmartWidgetFilters[K]) =>
    setForm((prev) => ({ ...prev, filters: { ...prev.filters, [key]: value } }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.accountId || !form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      accountId: form.accountId,
      folder: form.folder || "INBOX",
      filters: form.filters,
      sort: form.sort,
      limit: form.limit,
    });
  };

  const hasFilters =
    form.filters.q ||
    form.filters.subject ||
    form.filters.fromAddress ||
    form.filters.toAddress ||
    form.filters.dateFrom ||
    form.filters.dateTo ||
    form.filters.unreadOnly ||
    form.filters.flaggedOnly;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{initial ? "Edit smart widget" : "New smart widget"}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span>Widget title</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Invoices from finance"
              />
            </label>

            <label className={styles.field}>
              <span>Account</span>
              <select
                required
                value={form.accountId}
                onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value, folder: "INBOX" }))}
              >
                <option value="" disabled>
                  Select an account
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Folder</span>
              <select value={form.folder} onChange={(e) => setForm((prev) => ({ ...prev, folder: e.target.value }))}>
                {folders.length === 0 && <option value="INBOX">INBOX</option>}
                {folders.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.display_name}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.sectionLabel}>Filters (all combine with AND)</div>

            <label className={styles.field}>
              <span>Subject contains</span>
              <input
                value={form.filters.subject ?? ""}
                onChange={(e) => updateFilters("subject", e.target.value)}
                placeholder="invoice"
              />
            </label>
            <label className={styles.field}>
              <span>From contains</span>
              <input
                value={form.filters.fromAddress ?? ""}
                onChange={(e) => updateFilters("fromAddress", e.target.value)}
                placeholder="billing@"
              />
            </label>
            <label className={styles.field}>
              <span>To contains</span>
              <input
                value={form.filters.toAddress ?? ""}
                onChange={(e) => updateFilters("toAddress", e.target.value)}
                placeholder="me@"
              />
            </label>
            <label className={styles.field}>
              <span>Any text (subject/body/headers)</span>
              <input
                value={form.filters.q ?? ""}
                onChange={(e) => updateFilters("q", e.target.value)}
                placeholder="urgent"
              />
            </label>
            <label className={styles.field}>
              <span>From date</span>
              <input type="date" value={form.filters.dateFrom ?? ""} onChange={(e) => updateFilters("dateFrom", e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>To date</span>
              <input type="date" value={form.filters.dateTo ?? ""} onChange={(e) => updateFilters("dateTo", e.target.value)} />
            </label>

            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={Boolean(form.filters.unreadOnly)}
                onChange={(e) => updateFilters("unreadOnly", e.target.checked)}
              />
              <span>Unread only</span>
            </label>
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={Boolean(form.filters.flaggedOnly)}
                onChange={(e) => updateFilters("flaggedOnly", e.target.checked)}
              />
              <span>Flagged only</span>
            </label>

            {!hasFilters && (
              <p className={`${styles.fieldWide} ${styles.hint}`}>
                No filters set - this widget will show the most recent messages in the folder.
              </p>
            )}

            <div className={styles.sectionLabel}>Display</div>
            <label className={styles.field}>
              <span>Sort</span>
              <select value={form.sort} onChange={(e) => setForm((prev) => ({ ...prev, sort: e.target.value as MailSort }))}>
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Show up to</span>
              <select
                value={form.limit}
                onChange={(e) => setForm((prev) => ({ ...prev, limit: Number(e.target.value) }))}
              >
                <option value={5}>5 messages</option>
                <option value={10}>10 messages</option>
                <option value={20}>20 messages</option>
              </select>
            </label>
          </div>

          <div className={styles.actions}>
            {onDelete && (
              <Button type="button" variant="danger" onClick={onDelete}>
                Delete widget
              </Button>
            )}
            <span className={styles.actionsSpacer} />
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.accountId || !form.title.trim()}>
              {initial ? "Save changes" : "Add widget"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
