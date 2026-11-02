export type EmailFolder =
  | 'inbox'
  | 'needs-reply'
  | 'starred'
  | 'snoozed'
  | 'sent'
  | 'drafts';

export type AppView = 'mail' | 'settings' | 'connected-accounts' | 'landing' | 'privacy' | 'terms' | 'support';

export type SettingsTab =
  | 'general'
  | 'accounts'
  | 'notifications'
  | 'appearance'
  | 'shortcuts'
  | 'privacy'
  | 'billing';

export type CategoryFilter = 'all' | 'unread' | 'vip' | 'needs-reply';

export type AiTone = 'professional' | 'friendly' | 'concise';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface EmailAttachment {
  id: string;
  filename: string;
  size: string;
  type: string;
}

export interface EmailThread {
  id: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  recipient: {
    name: string;
    email: string;
  };
  cc?: string[];
  bcc?: string[];
  subject: string;
  snippet: string;
  body: string;
  timestamp: string;
  date: string;
  isUnread: boolean;
  isStarred: boolean;
  isNeedsReply: boolean;
  isSnoozed?: boolean;
  snoozedUntil?: string;
  isDraft?: boolean;
  isSent?: boolean;
  lastEdited?: string;
  tags: string[];
  attachments?: EmailAttachment[];
  aiSummary?: string;
  actionItems?: string[];
}

export interface ConnectedAccountItem {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  status: 'connected' | 'syncing' | 'available' | 'disconnected';
  lastSync?: string;
  isPrimary?: boolean;
}
