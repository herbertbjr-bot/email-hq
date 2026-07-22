import { useState } from "react";
import type { FormEvent } from "react";
import { accountsApi } from "../../api/accounts";
import { useToast } from "../../context/ToastContext";
import { Icon } from "../../icons/IconRegistry";
import type { AccountProfile, EmailAccountFormValues } from "../../types";
import { Button } from "../common/Button";
import styles from "./AccountForm.module.css";

const DEFAULT_VALUES: EmailAccountFormValues = {
  label: "",
  email_address: "",
  profile: "personal",
  color: "#4f46e5",
  is_default: false,
  imap_host: "",
  imap_port: 993,
  imap_use_ssl: true,
  imap_username: "",
  imap_password: "",
  smtp_host: "",
  smtp_port: 587,
  smtp_use_tls: true,
  smtp_username: "",
  smtp_password: "",
};

export function AccountForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> | void }) {
  const { notify } = useToast();
  const [values, setValues] = useState<EmailAccountFormValues>(DEFAULT_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof EmailAccountFormValues>(key: K, value: EmailAccountFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await accountsApi.create(values);
      notify(`Added ${values.label}`, "success");
      await onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save account";
      setError(message);
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Add email account</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Label</span>
              <input
                required
                value={values.label}
                onChange={(e) => update("label", e.target.value)}
                placeholder="Work Gmail"
              />
            </label>
            <label className={styles.field}>
              <span>Profile</span>
              <select
                value={values.profile}
                onChange={(e) => update("profile", e.target.value as AccountProfile)}
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span>Email address</span>
              <input
                required
                type="email"
                value={values.email_address}
                onChange={(e) => update("email_address", e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <div className={styles.sectionLabel}>IMAP (incoming)</div>
            <label className={styles.field}>
              <span>Host</span>
              <input
                required
                value={values.imap_host}
                onChange={(e) => update("imap_host", e.target.value)}
                placeholder="imap.example.com"
              />
            </label>
            <label className={styles.field}>
              <span>Port</span>
              <input
                required
                type="number"
                value={values.imap_port}
                onChange={(e) => update("imap_port", Number(e.target.value))}
              />
            </label>
            <label className={styles.field}>
              <span>Username</span>
              <input
                required
                value={values.imap_username}
                onChange={(e) => update("imap_username", e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Password</span>
              <input
                required
                type="password"
                value={values.imap_password}
                onChange={(e) => update("imap_password", e.target.value)}
              />
            </label>

            <div className={styles.sectionLabel}>SMTP (outgoing)</div>
            <label className={styles.field}>
              <span>Host</span>
              <input
                required
                value={values.smtp_host}
                onChange={(e) => update("smtp_host", e.target.value)}
                placeholder="smtp.example.com"
              />
            </label>
            <label className={styles.field}>
              <span>Port</span>
              <input
                required
                type="number"
                value={values.smtp_port}
                onChange={(e) => update("smtp_port", Number(e.target.value))}
              />
            </label>
            <label className={styles.field}>
              <span>Username</span>
              <input
                required
                value={values.smtp_username}
                onChange={(e) => update("smtp_username", e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Password</span>
              <input
                required
                type="password"
                value={values.smtp_password}
                onChange={(e) => update("smtp_password", e.target.value)}
              />
            </label>

            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={values.is_default}
                onChange={(e) => update("is_default", e.target.checked)}
              />
              <span>Make this my default account</span>
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
