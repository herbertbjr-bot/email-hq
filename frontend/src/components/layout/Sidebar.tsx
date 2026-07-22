import { useAccountContext } from "../../context/AccountContext";
import { useFolders } from "../../hooks/useFolders";
import { Icon } from "../../icons/IconRegistry";
import { AccountSwitcher } from "../accounts/AccountSwitcher";
import styles from "./Sidebar.module.css";

export type View = "dashboard" | "mail";

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

      <button className={styles.settingsButton} onClick={onOpenSettings}>
        <Icon name="settings" size={16} />
        <span>Customize appearance</span>
      </button>
    </aside>
  );
}
