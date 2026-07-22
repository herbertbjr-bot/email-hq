import { useState } from "react";
import { useAccountContext } from "../../context/AccountContext";
import { DASHBOARD_WIDGETS, useDashboardLayout } from "../../hooks/useDashboardLayout";
import { Icon } from "../../icons/IconRegistry";
import { Button } from "../common/Button";
import { AccountsOverviewWidget } from "./AccountsOverviewWidget";
import { AIStatusWidget } from "./AIStatusWidget";
import styles from "./DashboardView.module.css";
import { PriorityInboxWidget } from "./PriorityInboxWidget";
import { QuickComposeWidget } from "./QuickComposeWidget";
import { SmartTagsWidget } from "./SmartTagsWidget";

export function DashboardView({
  onOpenMail,
  onOpenMessage,
}: {
  onOpenMail: (accountId: string) => void;
  onOpenMessage: (uid: string) => void;
}) {
  const { selectedAccount } = useAccountContext();
  const { orderedWidgets, visibleWidgets, hidden, toggleVisible, move, reset } = useDashboardLayout();
  const [editMode, setEditMode] = useState(false);

  const renderWidget = (id: string) => {
    const index = orderedWidgets.findIndex((w) => w.id === id);
    const shared = {
      editMode,
      canMoveUp: index > 0,
      canMoveDown: index < orderedWidgets.length - 1,
      onMoveUp: () => move(id, -1),
      onMoveDown: () => move(id, 1),
      onHide: () => toggleVisible(id),
    };

    switch (id) {
      case "accounts":
        return <AccountsOverviewWidget key={id} onOpenMail={onOpenMail} {...shared} />;
      case "priority-inbox":
        return <PriorityInboxWidget key={id} onOpenMessage={onOpenMessage} {...shared} />;
      case "smart-tags":
        return <SmartTagsWidget key={id} {...shared} />;
      case "quick-compose":
        return <QuickComposeWidget key={id} {...shared} />;
      case "ai-status":
        return <AIStatusWidget key={id} {...shared} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            {selectedAccount ? `Overview for ${selectedAccount.email_address}` : "Add an account to get started"}
          </p>
        </div>
        <Button variant={editMode ? "primary" : "secondary"} onClick={() => setEditMode(!editMode)}>
          {editMode ? "Done" : "Customize"}
        </Button>
      </div>

      {editMode && (
        <div className={styles.customizePanel}>
          <div className={styles.customizeHeader}>
            <span>Widgets</span>
            <button className={styles.resetButton} onClick={reset}>
              Reset layout
            </button>
          </div>
          <ul className={styles.customizeList}>
            {orderedWidgets.map((widget, index) => {
              const isHidden = hidden.includes(widget.id);
              return (
                <li key={widget.id} className={styles.customizeItem}>
                  <Icon name="grip" size={14} className={styles.customizeGrip} />
                  <span className={isHidden ? styles.customizeLabelHidden : styles.customizeLabel}>
                    {widget.title}
                  </span>
                  <div className={styles.customizeControls}>
                    <button
                      className={styles.iconButton}
                      onClick={() => move(widget.id, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <Icon name="chevronDown" size={14} style={{ transform: "rotate(180deg)" }} />
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => move(widget.id, 1)}
                      disabled={index === orderedWidgets.length - 1}
                      aria-label="Move down"
                    >
                      <Icon name="chevronDown" size={14} />
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => toggleVisible(widget.id)}
                      aria-label={isHidden ? "Show widget" : "Hide widget"}
                    >
                      <Icon name={isHidden ? "eye" : "eyeOff"} size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className={styles.grid}>
        {visibleWidgets.map((w) => renderWidget(w.id))}
        {visibleWidgets.length === 0 && !editMode && (
          <div className={styles.emptyGrid}>
            <p>All widgets are hidden.</p>
            <Button variant="secondary" onClick={() => setEditMode(true)}>
              Customize dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export { DASHBOARD_WIDGETS };
