export interface ProviderPreset {
  id: string;
  name: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  hint: string;
  helpUrl?: string;
}

/**
 * One-click IMAP/SMTP settings for common providers. All use STARTTLS on
 * port 587 for SMTP to match the single smtp_use_tls flag the backend
 * supports (see backend/app/services/smtp_service.py) - no implicit-SSL
 * (port 465) providers here for that reason.
 */
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "gmail",
    name: "Gmail",
    imapHost: "imap.gmail.com",
    imapPort: 993,
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    hint: "Needs an app password if 2-Step Verification is on - your normal Google password won't work.",
    helpUrl: "https://myaccount.google.com/apppasswords",
  },
  {
    id: "outlook",
    name: "Outlook / Microsoft 365",
    imapHost: "outlook.office365.com",
    imapPort: 993,
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    hint: "Needs an app password if two-factor authentication is on.",
    helpUrl: "https://account.live.com/proofs/AppPassword",
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    imapHost: "imap.mail.yahoo.com",
    imapPort: 993,
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 587,
    hint: "Requires a Yahoo app password - generate one in Account Security.",
    helpUrl: "https://login.yahoo.com/myaccount/security/",
  },
  {
    id: "aol",
    name: "AOL Mail",
    imapHost: "imap.aol.com",
    imapPort: 993,
    smtpHost: "smtp.aol.com",
    smtpPort: 587,
    hint: "Requires an AOL app password - generate one in Account Security.",
    helpUrl: "https://login.aol.com/myaccount/security",
  },
  {
    id: "icloud",
    name: "iCloud Mail",
    imapHost: "imap.mail.me.com",
    imapPort: 993,
    smtpHost: "smtp.mail.me.com",
    smtpPort: 587,
    hint: "Requires an app-specific password from your Apple ID account page.",
    helpUrl: "https://appleid.apple.com/account/manage",
  },
];
