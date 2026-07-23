import { useState } from "react";
import { Icon } from "../../icons/IconRegistry";
import { Button } from "./Button";
import styles from "./ConfirmDialog.module.css";

/**
 * Generic two-step confirmation modal: the triggering button (step 1) opens
 * this dialog, and the user must explicitly click the confirm action
 * (step 2) before anything destructive happens. Used for account deletion.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay} role="alertdialog" aria-modal="true" aria-label={title}>
      <div className={styles.modal}>
        {danger && (
          <span className={styles.dangerIcon}>
            <Icon name="alert" size={20} />
          </span>
        )}
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "dangerSolid" : "primary"} onClick={handleConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
