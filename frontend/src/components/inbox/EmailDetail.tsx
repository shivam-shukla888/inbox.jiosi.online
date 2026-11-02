import React, { useState } from 'react';
import { EmailThread } from '../../types/email';
import { Button } from '../ui/Button';
import { Kbd } from '../ui/Kbd';
import { EmptyState } from '../ui/EmptyState';
import {
  Archive,
  Clock,
  Trash2,
  Reply,
  Forward,
  Star,
  Sparkles,
  FileText,
  Download,
  ShieldCheck,
  SendHorizontal,
  Bot
} from 'lucide-react';

interface EmailDetailProps {
  email: EmailThread | null;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  onArchive,
  onDelete,
}) => {
  const [replyText, setReplyText] = useState('');
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center bg-canvas">
        <EmptyState
          title="Select an email to read"
          description="Choose a message from the thread list or use shortcuts (J/K) to navigate."
        />
      </div>
    );
  }

  const handleAiAction = (feature: string) => {
    setAiNotice(`${feature} is planned for Milestone 2. Today is Day 1 foundation.`);
    setTimeout(() => setAiNotice(null), 4000);
  };

  const insertSuggestion = (text: string) => {
    setReplyText((prev) => (prev ? `${prev} ${text}` : text));
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Detail Header Toolbar */}
      <div className="h-14 border-b border-border-subtle px-6 flex items-center justify-between gap-4 bg-canvas-alt shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <h2 className="text-sm font-semibold text-ink-primary truncate">
            {email.subject}
          </h2>
          {email.isImportant && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onArchive(email.id)}
            icon={<Archive className="w-3.5 h-3.5" />}
            title="Archive (E)"
          >
            <Kbd>E</Kbd>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled
            icon={<Clock className="w-3.5 h-3.5" />}
            title="Snooze (H) - Coming Soon"
          >
            <Kbd>H</Kbd>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(email.id)}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            title="Delete"
          />

          <div className="h-4 w-px bg-border-subtle mx-1" />

          <Button
            variant="secondary"
            size="sm"
            icon={<Reply className="w-3.5 h-3.5" />}
            title="Reply (R)"
          >
            Reply <Kbd>R</Kbd>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Forward className="w-3.5 h-3.5" />}
            title="Forward (F)"
          />
        </div>
      </div>

      {/* Main message viewport */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* AI Notification Banner */}
        {aiNotice && (
          <div className="p-2.5 bg-brand-amberLight border border-brand-amber/30 rounded text-brand-amber text-xs flex items-center gap-2 animate-fade-in">
            <Bot className="w-4 h-4 shrink-0" />
            <span className="font-mono text-[11px]">{aiNotice}</span>
          </div>
        )}

        {/* AI Feature Entrypoints Bar */}
        <div className="p-3 bg-canvas-surface rounded-lg border border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium text-ink-muted flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-sage" />
              AI Intelligence
            </span>
            <span className="text-[10px] text-ink-muted">· Planned Day 2+</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAiAction('Summarize Thread')}
              className="px-2.5 py-1 text-xs font-mono rounded bg-white border border-border-subtle hover:border-ink-primary hover:bg-canvas-hover transition-colors text-ink-secondary flex items-center gap-1.5"
            >
              <span>⚡ Summarize</span>
              <span className="text-[9px] text-brand-amber font-semibold">SOON</span>
            </button>

            <button
              onClick={() => handleAiAction('Draft Reply')}
              className="px-2.5 py-1 text-xs font-mono rounded bg-white border border-border-subtle hover:border-ink-primary hover:bg-canvas-hover transition-colors text-ink-secondary flex items-center gap-1.5"
            >
              <span>✦ Draft Reply</span>
              <span className="text-[9px] text-brand-amber font-semibold">SOON</span>
            </button>

            <button
              onClick={() => handleAiAction('Extract Action Items')}
              className="px-2.5 py-1 text-xs font-mono rounded bg-white border border-border-subtle hover:border-ink-primary hover:bg-canvas-hover transition-colors text-ink-secondary flex items-center gap-1.5"
            >
              <span>⚙ Action Items</span>
              <span className="text-[9px] text-brand-amber font-semibold">SOON</span>
            </button>
          </div>
        </div>

        {/* Sender Information Card */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-ink-primary text-canvas flex items-center justify-center font-mono font-medium text-sm shrink-0">
              {email.sender.avatar || email.sender.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink-primary">
                  {email.sender.name}
                </span>
                {email.sender.role && (
                  <span className="text-xs text-ink-muted">
                    ({email.sender.role})
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> TLS Verified
                </span>
              </div>
              <div className="text-xs text-ink-muted mt-0.5">
                <span>{email.sender.email}</span>
                <span className="mx-1.5">to</span>
                <span className="text-ink-secondary">{email.recipient.email}</span>
                {email.cc && email.cc.length > 0 && (
                  <span className="ml-2 text-ink-muted">
                    cc: {email.cc.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="font-mono text-xs text-ink-muted">
              {email.date} · {email.timestamp}
            </span>
          </div>
        </div>

        {/* Message Body */}
        <div className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line font-sans selection:bg-brand-sageLight">
          {email.body}
        </div>

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="pt-4 border-t border-border-subtle space-y-2">
            <p className="text-xs font-mono font-medium text-ink-muted uppercase tracking-wider">
              Attachments ({email.attachments.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {email.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2.5 rounded border border-border-subtle bg-canvas-surface hover:bg-canvas-hover transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-4 h-4 text-ink-muted shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-ink-primary truncate">
                        {att.filename}
                      </p>
                      <p className="text-[10px] font-mono text-ink-muted">
                        {att.size}
                      </p>
                    </div>
                  </div>
                  <button
                    className="p-1 rounded text-ink-muted hover:text-ink-primary transition-colors"
                    title="Download Attachment (Mock)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Reply Box */}
      <div className="p-4 border-t border-border-subtle bg-canvas-alt shrink-0 space-y-2.5">
        {/* Suggestion Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          <span className="text-[10px] font-mono text-ink-subtle uppercase shrink-0">
            Quick Suggestions:
          </span>
          <button
            onClick={() => insertSuggestion('Acknowledge and reviewing now. Will revert shortly.')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-border-subtle hover:bg-canvas-focus text-ink-secondary transition-colors shrink-0"
          >
            + Acknowledge & review
          </button>
          <button
            onClick={() => insertSuggestion('Looks good to me. Let us schedule a sync for tomorrow.')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-border-subtle hover:bg-canvas-focus text-ink-secondary transition-colors shrink-0"
          >
            + Request call tomorrow
          </button>
          <button
            onClick={() => insertSuggestion('Thanks for the update. We have a few questions on the terms.')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-border-subtle hover:bg-canvas-focus text-ink-secondary transition-colors shrink-0"
          >
            + Clarify terms
          </button>
        </div>

        {/* Input & Send Action */}
        <div className="flex items-center gap-2 bg-white rounded border border-border-subtle p-1.5 focus-within:border-ink-primary transition-colors">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder={`Reply to ${email.sender.name}... (Press ⌘↵ to send)`}
            className="w-full resize-none text-xs text-ink-primary placeholder:text-ink-subtle focus:outline-none p-1.5 bg-transparent"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (replyText.trim()) {
                alert(`Reply queued for ${email.sender.email} (Demonstration action)`);
                setReplyText('');
              }
            }}
            disabled={!replyText.trim()}
            icon={<SendHorizontal className="w-3.5 h-3.5" />}
          >
            Send <Kbd className="bg-ink-secondary text-canvas border-ink-primary">⌘↵</Kbd>
          </Button>
        </div>
      </div>
    </div>
  );
};
