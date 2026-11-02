import React from 'react';
import { EmailThread } from '../../types/email';
import { Star, Paperclip, CheckSquare, Square, Clock, FileEdit } from 'lucide-react';

interface EmailListItemProps {
  email: EmailThread;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onToggleCheck: (e: React.MouseEvent) => void;
  onToggleStar?: (e: React.MouseEvent) => void;
}

export const EmailListItem: React.FC<EmailListItemProps> = ({
  email,
  isSelected,
  isChecked,
  onSelect,
  onToggleCheck,
  onToggleStar,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-start gap-3 px-3.5 py-3 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer transition-all select-none ${
        isSelected
          ? 'bg-brand-50/70 dark:bg-slate-800/90 border-l-3 border-l-brand-600 dark:border-l-brand-400 pl-[11px]'
          : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
      }`}
    >
      {/* Action / State Indicators (Left Column) */}
      <div className="flex flex-col items-center gap-2 pt-0.5 shrink-0">
        <button
          onClick={onToggleCheck}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
          aria-label={isChecked ? 'Deselect thread' : 'Select thread'}
        >
          {isChecked ? (
            <CheckSquare className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          ) : (
            <Square className="w-3.5 h-3.5 opacity-30 group-hover:opacity-80 transition-opacity" />
          )}
        </button>

        {/* Action Status Indicator:
            - RED DOT: Urgent / Needs Reply
            - BLUE DOT: Normal Unread (without urgent needs-reply)
            - Blank: Read
        */}
        {email.isNeedsReply ? (
          <span
            className="w-2 h-2 rounded-full bg-action-urgent ring-2 ring-red-100 dark:ring-red-950/80 shrink-0"
            title="Needs Reply (Actionable)"
          />
        ) : email.isUnread ? (
          <span
            className="w-2 h-2 rounded-full bg-action-unread ring-2 ring-blue-100 dark:ring-blue-950/80 shrink-0"
            title="Unread"
          />
        ) : (
          <span className="w-2 h-2 shrink-0" />
        )}
      </div>

      {/* Row Content */}
      <div className="flex-1 min-w-0">
        {/* Top: Sender, Star & Time */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span
              className={`text-xs truncate ${
                email.isUnread
                  ? 'font-semibold text-slate-900 dark:text-slate-100'
                  : 'font-medium text-slate-700 dark:text-slate-300'
              }`}
            >
              {email.isDraft ? `Draft: ${email.recipient.email}` : email.isSent ? `To: ${email.recipient.name}` : email.sender.name}
            </span>

            {/* Restrained Star Icon */}
            <button
              onClick={onToggleStar}
              className="p-0.5 rounded text-slate-300 hover:text-amber-500 transition-colors shrink-0"
              aria-label={email.isStarred ? 'Unstar' : 'Star'}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  email.isStarred
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-slate-300 dark:text-slate-600 opacity-40 group-hover:opacity-100'
                }`}
              />
            </button>
          </div>

          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
            {email.timestamp}
          </span>
        </div>

        {/* Subject */}
        <p
          className={`text-xs truncate mb-1 ${
            email.isUnread
              ? 'font-semibold text-slate-900 dark:text-slate-100'
              : 'font-normal text-slate-700 dark:text-slate-300'
          }`}
        >
          {email.subject || '(No subject)'}
        </p>

        {/* Clean one-line preview */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
          {email.snippet}
        </p>

        {/* Context Badges (Restrained) */}
        <div className="flex items-center justify-between gap-2 mt-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {email.isNeedsReply && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                Needs Reply
              </span>
            )}

            {email.isSnoozed && email.snoozedUntil && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Clock className="w-2.5 h-2.5 text-slate-400" />
                Until {email.snoozedUntil}
              </span>
            )}

            {email.isDraft && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-brand-600 dark:text-brand-400 px-1.5 py-0.2 rounded bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800">
                <FileEdit className="w-2.5 h-2.5" />
                Draft · {email.lastEdited}
              </span>
            )}
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <div className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500 shrink-0">
              <Paperclip className="w-3 h-3" />
              <span className="font-mono text-[10px]">{email.attachments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
