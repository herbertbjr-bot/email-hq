import { useMemo } from "react";
import { useAccountContext } from "../../context/AccountContext";
import { useCalendarContext } from "../../context/CalendarContext";
import { useTaskContext } from "../../context/TaskContext";
import { useFolders } from "../../hooks/useFolders";
import { Icon } from "../../icons/IconRegistry";
import { AccountSwitcher } from "../accounts/AccountSwitcher";
import styles from "./Sidebar.module.css";

export type View = "dashboard" | "mail" | "calendar" | "tasks";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Sidebar({
  view,
  onChangeView,
  onOpenSettings,
}: {
  view: View;
  onChangeView: (view: View) => void;
  onOpenSettings: () => void;
}) {
  const { selectedAccountId, selectedFolder, selectFolder } = useAccountContext();
  const { folders, loading } = useFolders(selectedAccountId);
  const { tasks, loading: tasksLoading } = useTaskContext();
  const openTaskCount = useMemo(() => tasks.filter((t) => !t.is_done).length, [tasks]);
  const doneTaskCount = tasks.length - openTaskCount;

  const { events, loading: eventsLoading } = useCalendarContext();
  const todayKey = useMemo(() => dateKey(new Date()), []);
  const upcomingEventCount = useMemo(
    () => events.filter((e) => dateKey(new Date(e.start_at)) >= todayKey).length,
    [events, todayKey],
  );
  const pastEventCount = events.length - upcomingEventCount;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>HQ</span>
        <span className={styles.brandName}>Email HQ</span>
      </div>

      <nav className={styles.nav}>
        <button
          className={`${styles.navItem} ${view === "dashboard" ? styles.navItemActive : ""}`}
          onClick={() => onChangeView("dashboard")}
        >
          <Icon name="grid" size={16} />
          <span>Dashboard</span>
        </button>
        <button
          className={`${styles.navItem} ${view === "mail" ? styles.navItemActive : ""}`}
          onClick={() => onChangeView("mail")}
        >
          <Icon name="inbox" size={16} />
          <span>Mail</span>
        </button>
        <button
          className={`${styles.navItem} ${view === "calendar" ? styles.navItemActive : ""}`}
          onClick={() => onChangeView("calendar")}
        >
          <Icon name="calendar" size={16} />
          <span>Calendar</span>
        </button>
        <button
          className={`${styles.navItem} ${view === "tasks" ? styles.navItemActive : ""}`}
          onClick={() => onChangeView("tasks")}
        >
          <Icon name="checklist" size={16} />
          <span>Tasks</span>
        </button>
      </nav>

      <AccountSwitcher />

      {view === "mail" && (
        <div className={styles.folderSection}>
          <span className={styles.heading}>Folders</span>
          {loading && <span className={styles.loadingText}>Loading...</span>}
          <ul className={styles.folderList}>
            {folders.map((folder) => (
              <li key={folder.name}>
                <button
                  className={`${styles.folderItem} ${folder.name === selectedFolder ? styles.folderItemActive : ""}`}
                  onClick={() => selectFolder(folder.name)}
                >
                  <span>{folder.display_name}</span>
                  {folder.unread_count > 0 && <span className={styles.unreadBadge}>{folder.unread_count}</span>}
                </button>
              </li>
            ))}
            {!loading && folders.length === 0 && <li className={styles.empty}>No folders</li>}
          </ul>
        </div>
      )}

      {view === "calendar" && (
        <div className={styles.folderSection}>
          <span className={styles.heading}>Calendar</span>
          {eventsLoading && <span className={styles.loadingText}>Loading...</span>}
          <ul className={styles.folderList}>
            {!eventsLoading && events.length === 0 && <li className={styles.empty}>No events yet</li>}
            {!eventsLoading && events.length > 0 && (
              <>
                <li className={styles.summaryRow}>
                  <span>Upcoming</span>
                  <span className={styles.unreadBadge}>{upcomingEventCount}</span>
                </li>
                {pastEventCount > 0 && (
                  <li className={styles.summaryRow}>
                    <span>Past</span>
                    <span>{pastEventCount}</span>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}

      {view === "tasks" && (
        <div className={styles.folderSection}>
          <span className={styles.heading}>Tasks</span>
          {tasksLoading && <span className={styles.loadingText}>Loading...</span>}
          <ul className={styles.folderList}>
            {!tasksLoading && tasks.length === 0 && <li className={styles.empty}>No tasks yet</li>}
            {!tasksLoading && tasks.length > 0 && (
              <>
                <li className={styles.summaryRow}>
                  <span>Open</span>
                  <span className={styles.unreadBadge}>{openTaskCount}</span>
                </li>
                {doneTaskCount > 0 && (
                  <li className={styles.summaryRow}>
                    <span>Completed</span>
                    <span>{doneTaskCount}</span>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}

      <button className={styles.settingsButton} onClick={onOpenSettings}>
        <Icon name="settings" size={16} />
        <span>Customize appearance</span>
      </button>
    </aside>
  );
}
