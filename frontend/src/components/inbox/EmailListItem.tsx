import React from 'react';
import { EmailThread } from '../../types/email';
import { Star, Paperclip, CheckSquare, Square } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface EmailListItemProps {
  email: EmailThread;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onToggleCheck: (e: React.MouseEvent) => void;
}

export const EmailListItem: React.FC<EmailListItemProps> = ({
  email,
  isSelected,
  isChecked,
  onSelect,
  onToggleCheck,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-start gap-3 px-3 py-3 border-b border-border-subtle cursor-pointer transition-colors select-none ${
        isSelected
          ? 'bg-canvas-focus border-l-2 border-l-ink-primary pl-[10px]'
          : 'bg-white hover:bg-canvas-surface'
      }`}
    >
      {/* Checkbox & Unread dot */}
      <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
        <button
          onClick={onToggleCheck}
          className="text-ink-muted hover:text-ink-primary p-0.5 rounded transition-colors"
        >
          {isChecked ? (
            <CheckSquare className="w-3.5 h-3.5 text-ink-primary" />
          ) : (
            <Square className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
          )}
        </button>

        {email.isUnread ? (
          <span className="w-2 h-2 rounded-full bg-ink-primary" />
        ) : (
          <span className="w-2 h-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span
              className={`text-xs truncate ${
                email.isUnread
                  ? 'font-semibold text-ink-primary'
                  : 'font-medium text-ink-secondary'
              }`}
            >
              {email.sender.name}
            </span>
            {email.isImportant && (
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            )}
          </div>
          <span className="font-mono text-[10px] text-ink-muted shrink-0">
            {email.timestamp}
          </span>
        </div>

        <p
          className={`text-xs truncate mb-1 ${
            email.isUnread ? 'font-medium text-ink-primary' : 'text-ink-secondary'
          }`}
        >
          {email.subject}
        </p>

        <p className="text-[11px] text-ink-muted line-clamp-1 leading-relaxed mb-1.5">
          {email.snippet}
        </p>

        {/* Tags & Attachments */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1 overflow-hidden">
            {email.tags.map((tag) => {
              const variant =
                tag === 'VIP' || tag === 'Fundraising'
                  ? 'amber'
                  : tag === 'Design' || tag === 'Feedback'
                  ? 'sage'
                  : tag === 'Finance' || tag === 'Receipts'
                  ? 'slate'
                  : 'default';
              return (
                <Badge key={tag} variant={variant} className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              );
            })}
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <span
              className="flex items-center gap-1 text-[10px] font-mono text-ink-muted shrink-0"
              title={`${email.attachments.length} attachment(s)`}
            >
              <Paperclip className="w-3 h-3" />
              <span>{email.attachments.length}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
