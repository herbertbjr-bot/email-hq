import { useState } from "react";
import { AIAssistantDrawer } from "./components/ai/AIAssistantDrawer";
import { DashboardView } from "./components/dashboard/DashboardView";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import type { View } from "./components/layout/Sidebar";
import { ComposeModal } from "./components/mailbox/ComposeModal";
import type { ComposeInitialValues } from "./components/mailbox/ComposeModal";
import { MailboxList } from "./components/mailbox/MailboxList";
import { MessageView } from "./components/mailbox/MessageView";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { AccountProvider, useAccountContext } from "./context/AccountContext";
import { ToastProvider } from "./context/ToastContext";
import { IconPackProvider } from "./icons/IconRegistry";
import { ThemeProvider } from "./theme/ThemeProvider";
import type { MessageDetail } from "./types";

function AppShell() {
  const { selectedFolder, selectAccount, selectFolder } = useAccountContext();
  const [view, setView] = useState<View>("dashboard");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [composeValues, setComposeValues] = useState<ComposeInitialValues | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [mailRefreshToken, setMailRefreshToken] = useState(0);

  const bumpMailRefresh = () => setMailRefreshToken((t) => t + 1);

  const openCompose = (values?: ComposeInitialValues) => {
    setComposeValues(values ?? null);
    setShowCompose(true);
  };

  const handleReply = (message: MessageDetail, body: string) => {
    openCompose({
      to: message.sender_address,
      subject: message.subject.toLowerCase().startsWith("re:") ? message.subject : `Re: ${message.subject}`,
      body,
      inReplyTo: message.uid,
    });
    setShowAssistant(false);
  };

  const openMailForAccount = (accountId: string) => {
    selectAccount(accountId);
    setView("mail");
  };

  const openMessage = (uid: string, accountId?: string, folder?: string) => {
    if (accountId) selectAccount(accountId);
    selectFolder(folder ?? "INBOX");
    setSelectedUid(uid);
    setView("mail");
  };

  return (
    <>
      <DashboardLayout
        view={view}
        onChangeView={setView}
        onCompose={() => openCompose()}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAssistant={() => setShowAssistant(true)}
      >
        {view === "dashboard" ? (
          <DashboardView onOpenMail={openMailForAccount} onOpenMessage={openMessage} />
        ) : (
          <>
            <MailboxList
              key={selectedFolder}
              selectedUid={selectedUid}
              onSelect={setSelectedUid}
              refreshToken={mailRefreshToken}
            />
            <MessageView
              uid={selectedUid}
              onOpenAssistant={() => setShowAssistant(true)}
              onCompose={openCompose}
              onMessageRemoved={() => {
                setSelectedUid(null);
                bumpMailRefresh();
              }}
            />
          </>
        )}

        {showCompose && (
          <ComposeModal
            initialValues={composeValues ?? undefined}
            onClose={() => setShowCompose(false)}
            onSent={() => {
              setShowCompose(false);
              bumpMailRefresh();
            }}
          />
        )}

        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </DashboardLayout>

      <AIAssistantDrawer
        open={showAssistant}
        onClose={() => setShowAssistant(false)}
        selectedMessageUid={view === "mail" ? selectedUid : null}
        onReply={handleReply}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <IconPackProvider>
        <AccountProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </AccountProvider>
      </IconPackProvider>
    </ThemeProvider>
  );
}
