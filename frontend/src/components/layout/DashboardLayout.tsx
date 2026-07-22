import type { ReactNode } from "react";
import type { View } from "./Sidebar";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./DashboardLayout.module.css";

export function DashboardLayout({
  view,
  onChangeView,
  onCompose,
  onOpenSettings,
  onOpenAssistant,
  children,
}: {
  view: View;
  onChangeView: (view: View) => void;
  onCompose: () => void;
  onOpenSettings: () => void;
  onOpenAssistant: () => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Sidebar view={view} onChangeView={onChangeView} onOpenSettings={onOpenSettings} />
      <div className={styles.main}>
        <Topbar view={view} onCompose={onCompose} onOpenAssistant={onOpenAssistant} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
