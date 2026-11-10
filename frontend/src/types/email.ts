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
  | 'business-profile'
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
  triage?: ThreadAiTriageData;
}

export interface ThreadAiTriageData {
  category: 'primary' | 'transactional' | 'newsletter' | 'promotional' | 'social' | 'suspicious' | 'spam' | 'gmail_spam' | 'unknown' | string;
  importanceScore: number;
  importanceReason?: string;
  urgencyScore: number;
  urgencyReason?: string;
  needsReply: boolean;
  deadline?: string | null;
  evidence: string[];
  confidence: number;
  userOverrideCategory?: string | null;
}

export interface ThreadSummaryData {
  gist: string;
  keyDecisions: string[];
  openQuestion?: string | null;
  explicitDeadline?: string | null;
  suggestedNextAction: string;
}

export interface ActionItemData {
  title: string;
  owner?: string | null;
  dueDate?: string | null;
  evidenceQuote?: string | null;
  confidence: number;
}

export interface ReplyDraftResponseData {
  draftText: string;
  tone: string;
  language: string;
}

export interface ComposeAssistResponseData {
  originalText: string;
  suggestedText: string;
  action: string;
  explanation: string;
}

export interface UserAiPreferencesData {
  aiProcessingConsent: boolean;
  defaultReplyTone: string;
  defaultReplyLanguage: string;
  serviceConfigured: boolean;
}

export interface UserBusinessProfileData {
  profileType: string;
  businessName?: string | null;
  timezone: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  vipContacts: string[];
  waitingOnContacts: string[];
  dailyBriefTime: string;
  summaryLanguage: string;
}

export interface EmailCommitmentData {
  id: string;
  threadId: string;
  threadSubject?: string;
  sourceMessageId?: string;
  actor: 'user' | 'other' | 'unknown';
  action: string;
  target?: string | null;
  dueDate?: string | null;
  evidenceQuote?: string | null;
  status: string;
  userStatusOverride?: string | null;
  effectiveStatus: string;
  auditNote?: string | null;
  confidence: number;
  createdAt?: string;
}

export interface DailyBriefItemData {
  threadId: string;
  externalThreadId?: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  briefReason: string;
  explicitDeadline?: string | null;
  suggestedNextAction: string;
  category: string;
  importanceScore: number;
  urgencyScore: number;
  whoOwesNext: 'user' | 'other' | 'none';
  lastMessageAt?: string | null;
}

export interface DailyBriefResponseData {
  briefDate: string;
  generatedAt: string;
  businessProfile: string;
  summaryMessage: string;
  needsYouToday: DailyBriefItemData[];
  waitingOnSomeoneElse: DailyBriefItemData[];
  promisesYouMade: DailyBriefItemData[];
  importantNotUrgent: DailyBriefItemData[];
  newslettersBulk: DailyBriefItemData[];
  possibleSpamOrSuspicious: DailyBriefItemData[];
  hasHighConfidenceItems: boolean;
}

export interface ConnectedAccountItem {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  status: 'connected' | 'syncing' | 'available' | 'disconnected';
  lastSync?: string;
  isPrimary?: boolean;
}

export interface GmailStatusData {
  connected: boolean;
  accountId?: string | null;
  email?: string | null;
  provider: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'REVOKED' | string;
  lastSyncAt?: string | null;
  tokenExpiresAt?: string | null;
  scope?: string | null;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  snippet: string;
  receivedAt: string;
  isUnread: boolean;
  isStarred: boolean;
  labelIds: string[];
}

export interface GmailMessagesPageData {
  messages: GmailMessageSummary[];
  nextPageToken?: string | null;
  resultSizeEstimate: number;
}

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  cc?: string | null;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: string;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labelIds: string[];
}
