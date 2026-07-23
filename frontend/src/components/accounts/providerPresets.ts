export interface ProviderPreset {
  id: string;
  name: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  hint: string;
  helpUrl?: string;
  helpLabel?: string;
  /** True when the provider no longer accepts username+password IMAP/SMTP
   * login at all (see hint) - selecting it shows the explanation instead of
   * filling in host/port, since there is nothing that would actually work. */
  unavailable?: boolean;
}

/**
 * One-click IMAP/SMTP settings for common providers. All use STARTTLS on
 * port 587 for SMTP to match the single smtp_use_tls flag the backend
 * supports (see backend/app/services/smtp_service.py) - no implicit-SSL
 * (port 465) providers here for that reason.
 *
 * Every helpUrl below points at the provider's own official documentation
 * (not a third-party guide), verified directly against their published
 * support pages - see the "Test connection" button in AccountForm for a
 * live check against whatever you actually enter.
 */
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "gmail",
    name: "Gmail",
    imapHost: "imap.gmail.com",
    imapPort: 993,
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    hint: "Needs a Google app password - your normal Gmail password will not work here, even without 2-Step Verification.",
    helpUrl: "https://myaccount.google.com/apppasswords",
    helpLabel: "Generate a Google app password",
  },
  {
    id: "outlook",
    name: "Outlook / Microsoft 365",
    imapHost: "",
    imapPort: 993,
    smtpHost: "",
    smtpPort: 587,
    unavailable: true,
    hint: "Not supported: Microsoft has fully disabled username/password (and app password) sign-in for IMAP/SMTP on Outlook.com and Microsoft 365 - it now requires OAuth 2.0, which this app doesn't implement yet. There's no app password that will make this work.",
    helpUrl: "https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/deprecation-of-basic-authentication-exchange-online",
    helpLabel: "Read Microsoft's deprecation notice",
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    imapHost: "imap.mail.yahoo.com",
    imapPort: 993,
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 587,
    hint: "Requires a Yahoo app password - your regular Yahoo password will be rejected. Generate one from Account Security, then paste it as the password below.",
    helpUrl: "https://help.yahoo.com/kb/sln15241.html",
    helpLabel: "Generate a Yahoo app password",
  },
  {
    id: "aol",
    name: "AOL Mail",
    imapHost: "imap.aol.com",
    imapPort: 993,
    smtpHost: "smtp.aol.com",
    smtpPort: 587,
    hint: "Requires an AOL app password - your regular AOL password will be rejected. Generate one from Account Security, then paste it as the password below.",
    helpUrl: "https://help.aol.com/articles/Create-and-manage-app-password",
    helpLabel: "Generate an AOL app password",
  },
  {
    id: "icloud",
    name: "iCloud Mail",
    imapHost: "imap.mail.me.com",
    imapPort: 993,
    smtpHost: "smtp.mail.me.com",
    smtpPort: 587,
    hint: "Requires an app-specific password from your Apple ID - your regular Apple ID password will be rejected.",
    helpUrl: "https://appleid.apple.com/account/manage",
    helpLabel: "Generate an Apple app-specific password",
  },
];
