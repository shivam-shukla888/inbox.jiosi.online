export type EmailFolder = 'inbox' | 'important' | 'needs-reply' | 'follow-ups' | 'search';

export type CategoryFilter = 'all' | 'unread' | 'vip' | 'mentions';

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
  subject: string;
  snippet: string;
  body: string;
  timestamp: string;
  date: string;
  isUnread: boolean;
  isImportant: boolean;
  isNeedsReply: boolean;
  isFollowUp: boolean;
  tags: string[];
  attachments?: EmailAttachment[];
}
