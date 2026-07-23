import { useState } from "react";
import type { FormEvent } from "react";
import type { ConnectionTestResult } from "../../api/accounts";
import { accountsApi } from "../../api/accounts";
import { useToast } from "../../context/ToastContext";
import { Icon } from "../../icons/IconRegistry";
import type { AccountProfile, EmailAccountFormValues } from "../../types";
import { Button } from "../common/Button";
import styles from "./AccountForm.module.css";
import type { ProviderPreset } from "./providerPresets";
import { PROVIDER_PRESETS } from "./providerPresets";

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
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const update = <K extends keyof EmailAccountFormValues>(key: K, value: EmailAccountFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const applyProvider = (preset: ProviderPreset) => {
    setSelectedProviderId(preset.id);
    setTestResult(null);
    if (preset.unavailable) return;
    setValues((prev) => ({
      ...prev,
      imap_host: preset.imapHost,
      imap_port: preset.imapPort,
      imap_use_ssl: true,
      imap_username: prev.imap_username || prev.email_address,
      smtp_host: preset.smtpHost,
      smtp_port: preset.smtpPort,
      smtp_use_tls: true,
      smtp_username: prev.smtp_username || prev.email_address,
    }));
  };

  const selectedProvider = PROVIDER_PRESETS.find((p) => p.id === selectedProviderId) ?? null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await accountsApi.testConnectionFields({
        imap_host: values.imap_host,
        imap_port: values.imap_port,
        imap_use_ssl: values.imap_use_ssl,
        imap_username: values.imap_username,
        imap_password: values.imap_password,
        smtp_host: values.smtp_host,
        smtp_port: values.smtp_port,
        smtp_use_tls: values.smtp_use_tls,
        smtp_username: values.smtp_username,
        smtp_password: values.smtp_password,
      });
      setTestResult(result);
    } catch (err) {
      setTestResult({
        imap_ok: false,
        smtp_ok: false,
        imap_error: err instanceof Error ? err.message : "Test failed",
        smtp_error: null,
      });
    } finally {
      setTesting(false);
    }
  };

  const canTest =
    values.imap_host && values.imap_username && values.imap_password && values.smtp_host && values.smtp_username && values.smtp_password;

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
                onChange={(e) => {
                  const email = e.target.value;
                  setValues((prev) => ({
                    ...prev,
                    email_address: email,
                    imap_username: prev.imap_username === prev.email_address ? email : prev.imap_username,
                    smtp_username: prev.smtp_username === prev.email_address ? email : prev.smtp_username,
                  }));
                }}
                placeholder="you@example.com"
              />
            </label>

            <div className={`${styles.fieldWide} ${styles.providerRow}`}>
              <span className={styles.providerLabel}>Quick connect</span>
              <div className={styles.providerButtons}>
                {PROVIDER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.providerButton} ${selectedProviderId === preset.id ? styles.providerButtonActive : ""} ${preset.unavailable ? styles.providerButtonUnavailable : ""}`}
                    onClick={() => applyProvider(preset)}
                    title={preset.unavailable ? "Not supported - click for details" : undefined}
                  >
                    {preset.name}
                    {preset.unavailable && <Icon name="alert" size={11} />}
                  </button>
                ))}
              </div>
              {selectedProvider && (
                <p className={`${styles.providerHint} ${selectedProvider.unavailable ? styles.providerHintWarning : ""}`}>
                  {selectedProvider.hint}
                  {selectedProvider.helpUrl && (
                    <>
                      {" "}
                      <a href={selectedProvider.helpUrl} target="_blank" rel="noopener noreferrer">
                        {selectedProvider.helpLabel ?? "Learn more"}
                      </a>
                      .
                    </>
                  )}
                </p>
              )}
            </div>

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

            <div className={`${styles.fieldWide} ${styles.testRow}`}>
              <Button type="button" variant="secondary" onClick={handleTestConnection} disabled={!canTest || testing}>
                {testing ? "Testing..." : "Test connection"}
              </Button>
              {testResult && (
                <div className={styles.testResult}>
                  <span className={`${styles.testLine} ${testResult.imap_ok ? styles.testOk : styles.testFail}`}>
                    <Icon name={testResult.imap_ok ? "check" : "alert"} size={13} />
                    IMAP {testResult.imap_ok ? "connected" : testResult.imap_error}
                  </span>
                  <span className={`${styles.testLine} ${testResult.smtp_ok ? styles.testOk : styles.testFail}`}>
                    <Icon name={testResult.smtp_ok ? "check" : "alert"} size={13} />
                    SMTP {testResult.smtp_ok ? "connected" : testResult.smtp_error}
                  </span>
                </div>
              )}
            </div>

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
