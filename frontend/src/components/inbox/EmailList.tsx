import React from 'react';
import { EmailThread, CategoryFilter, EmailFolder } from '../../types/email';
import { EmailListItem } from './EmailListItem';
import { EmailFilters } from './EmailFilters';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CheckCircle2, Clock, Send, Star, FileEdit, SendHorizontal } from 'lucide-react';

interface EmailListProps {
  emails: EmailThread[];
  currentFolder: EmailFolder;
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  currentFilter: CategoryFilter;
  onSelectFilter: (filter: CategoryFilter) => void;
  filterCounts: Record<CategoryFilter, number>;
  selectedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onToggleSelectAll: () => void;
  onMarkSelectedAsRead: () => void;
  onArchiveSelected?: () => void;
  onToggleStar?: (id: string) => void;
  isLoading?: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  currentFolder,
  selectedEmailId,
  onSelectEmail,
  currentFilter,
  onSelectFilter,
  filterCounts,
  selectedIds,
  onToggleCheck,
  onToggleSelectAll,
  onMarkSelectedAsRead,
  onArchiveSelected,
  onToggleStar,
  isLoading,
}) => {
  // Empty state contextual info
  const emptyStateConfig: Record<EmailFolder, { title: string; description: string; icon: React.ReactNode }> = {
    inbox: {
      title: 'Inbox Zero',
      description: 'You have cleared all active conversations. Time for deep work.',
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
    },
    'needs-reply': {
      title: 'No pending replies',
      description: 'All urgent responses have been handled.',
      icon: <Send className="w-8 h-8 text-brand-500" />,
    },
    starred: {
      title: 'No starred emails',
      description: 'Star messages you want to keep easily accessible.',
      icon: <Star className="w-8 h-8 text-amber-500" />,
    },
    snoozed: {
      title: 'No snoozed emails',
      description: 'Snoozed emails will reappear here at their scheduled time.',
      icon: <Clock className="w-8 h-8 text-slate-400" />,
    },
    sent: {
      title: 'No sent messages yet',
      description: 'Emails you send from JIOSI will appear here.',
      icon: <SendHorizontal className="w-8 h-8 text-slate-400" />,
    },
    drafts: {
      title: 'No saved drafts',
      description: 'Unsent drafts are automatically saved here.',
      icon: <FileEdit className="w-8 h-8 text-slate-400" />,
    },
  };

  const empty = emptyStateConfig[currentFolder] || emptyStateConfig.inbox;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Category filters shown primarily in inbox */}
      {currentFolder === 'inbox' && (
        <EmailFilters
          currentFilter={currentFilter}
          onSelectFilter={onSelectFilter}
          counts={filterCounts}
          allSelected={emails.length > 0 && selectedIds.size === emails.length}
          onToggleSelectAll={onToggleSelectAll}
          onMarkSelectedAsRead={onMarkSelectedAsRead}
          onArchiveSelected={onArchiveSelected}
          hasSelection={selectedIds.size > 0}
        />
      )}

      {/* Email Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {isLoading ? (
          <LoadingSpinner label="Fetching inbox threads..." />
        ) : emails.length === 0 ? (
          <EmptyState
            title={empty.title}
            description={empty.description}
            icon={empty.icon}
          />
        ) : (
          emails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={selectedEmailId === email.id}
              isChecked={selectedIds.has(email.id)}
              onSelect={() => onSelectEmail(email.id)}
              onToggleCheck={(e) => {
                e.stopPropagation();
                onToggleCheck(email.id);
              }}
              onToggleStar={(e) => {
                e.stopPropagation();
                onToggleStar?.(email.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
