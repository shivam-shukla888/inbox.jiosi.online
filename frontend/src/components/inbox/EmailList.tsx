import React from 'react';
import { EmailThread, CategoryFilter } from '../../types/email';
import { EmailListItem } from './EmailListItem';
import { EmailFilters } from './EmailFilters';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface EmailListProps {
  emails: EmailThread[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  currentFilter: CategoryFilter;
  onSelectFilter: (filter: CategoryFilter) => void;
  filterCounts: Record<CategoryFilter, number>;
  selectedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onToggleSelectAll: () => void;
  onMarkSelectedAsRead: () => void;
  isLoading?: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  currentFilter,
  onSelectFilter,
  filterCounts,
  selectedIds,
  onToggleCheck,
  onToggleSelectAll,
  onMarkSelectedAsRead,
  isLoading,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-border-subtle overflow-hidden">
      <EmailFilters
        currentFilter={currentFilter}
        onSelectFilter={onSelectFilter}
        counts={filterCounts}
        allSelected={emails.length > 0 && selectedIds.size === emails.length}
        onToggleSelectAll={onToggleSelectAll}
        onMarkSelectedAsRead={onMarkSelectedAsRead}
        hasSelection={selectedIds.size > 0}
      />

      {/* Email Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
        {isLoading ? (
          <LoadingSpinner label="Fetching inbox threads..." />
        ) : emails.length === 0 ? (
          <EmptyState
            title="No emails in this view"
            description="You're all caught up with your messages."
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
            />
          ))
        )}
      </div>
    </div>
  );
};
