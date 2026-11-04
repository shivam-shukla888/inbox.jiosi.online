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
      className={`group relative flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 cursor-pointer transition-all select-none ${
        isSelected
          ? 'bg-jiosi-selected border-l-[3px] border-l-jiosi-indigo pl-[13px]'
          : 'bg-white hover:bg-slate-50/90'
      }`}
    >
      {/* Action / State Indicators (Left Column) */}
      <div className="flex flex-col items-center gap-2 pt-0.5 shrink-0">
        <button
          onClick={onToggleCheck}
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
          aria-label={isChecked ? 'Deselect thread' : 'Select thread'}
        >
          {isChecked ? (
            <CheckSquare className="w-3.5 h-3.5 text-jiosi-indigo" />
          ) : (
            <Square className="w-3.5 h-3.5 opacity-30 group-hover:opacity-80 transition-opacity" />
          )}
        </button>

        {/* Action Status Indicator */}
        {email.isNeedsReply ? (
          <span
            className="w-2 h-2 rounded-full bg-action-urgent ring-2 ring-red-100 shrink-0"
            title="Needs Reply (Actionable)"
          />
        ) : email.isUnread ? (
          <span
            className="w-2 h-2 rounded-full bg-action-unread ring-2 ring-blue-100 shrink-0"
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
              className={`text-xs sm:text-[13px] font-ui truncate ${
                email.isUnread
                  ? 'font-bold text-slate-900'
                  : 'font-medium text-slate-700'
              }`}
            >
              {email.isDraft ? `Draft: ${email.recipient.email}` : email.isSent ? `To: ${email.recipient.name}` : email.sender.name}
            </span>

            {/* Star Icon */}
            <button
              onClick={onToggleStar}
              className="p-0.5 rounded text-slate-300 hover:text-amber-500 transition-colors shrink-0 cursor-pointer"
              aria-label={email.isStarred ? 'Unstar' : 'Star'}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  email.isStarred
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-slate-300 opacity-40 group-hover:opacity-100'
                }`}
              />
            </button>
          </div>

          <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
            {email.timestamp}
          </span>
        </div>

        {/* Subject */}
        <p
          className={`text-xs sm:text-[13px] truncate my-0.5 leading-snug ${
            email.isUnread
              ? 'font-semibold text-slate-900'
              : 'font-normal text-slate-600'
          }`}
        >
          {email.subject || '(No subject)'}
        </p>

        {/* Clean one-line preview */}
        <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed font-light">
          {email.snippet}
        </p>

        {/* Context Badges */}
        <div className="flex items-center justify-between gap-2 mt-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {email.isNeedsReply && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Needs Reply
              </span>
            )}

            {email.isSnoozed && email.snoozedUntil && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-600 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                <Clock className="w-2.5 h-2.5 text-slate-400" />
                Until {email.snoozedUntil}
              </span>
            )}

            {email.isDraft && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-jiosi-indigo px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                <FileEdit className="w-2.5 h-2.5" />
                Draft · {email.lastEdited}
              </span>
            )}
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
              <Paperclip className="w-3 h-3" />
              <span className="font-mono text-[10px]">{email.attachments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
