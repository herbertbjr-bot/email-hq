import { useEffect, useState } from "react";
import { aiApi } from "../../api/ai";
import { useAccountContext } from "../../context/AccountContext";
import { Icon } from "../../icons/IconRegistry";
import { Button } from "../common/Button";
import { ThemeToggle } from "../common/ThemeToggle";
import type { View } from "./Sidebar";
import styles from "./Topbar.module.css";

export function Topbar({
  view,
  onCompose,
  onOpenAssistant,
}: {
  view: View;
  onCompose: () => void;
  onOpenAssistant: () => void;
}) {
  const { selectedAccount, selectedFolder } = useAccountContext();
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    aiApi
      .status()
      .then((s) => setAiEnabled(s.enabled))
      .catch(() => setAiEnabled(null));
  }, []);

  const title = view === "dashboard" ? "Dashboard" : selectedFolder || "Inbox";

  return (
    <header className={styles.topbar}>
      <div>
        <h1 className={styles.folderTitle}>{title}</h1>
        {view === "mail" && selectedAccount && <p className={styles.accountLine}>{selectedAccount.email_address}</p>}
      </div>
      <div className={styles.actions}>
        {aiEnabled !== null && (
          <span className={`${styles.aiBadge} ${aiEnabled ? styles.aiBadgeLive : ""}`}>
            <Icon name="sparkles" size={13} />
            {aiEnabled ? "AI live" : "Heuristic AI"}
          </span>
        )}
        <button className={styles.assistantButton} onClick={onOpenAssistant} title="Open AI Assistant">
          <Icon name="sparkles" size={16} />
        </button>
        <ThemeToggle />
        <Button onClick={onCompose} disabled={!selectedAccount}>
          Compose
        </Button>
      </div>
    </header>
  );
}
