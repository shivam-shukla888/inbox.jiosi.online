import React, { useState } from 'react';
import { EmailThread, AiTone } from '../../types/email';
import { Button } from '../ui/Button';
import { Kbd } from '../ui/Kbd';
import { EmptyState } from '../ui/EmptyState';
import {
  Archive,
  Clock,
  Trash2,
  Reply,
  Star,
  Sparkles,
  FileText,
  Download,
  SendHorizontal,
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface EmailDetailProps {
  email: EmailThread | null;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onSnooze?: (id: string, until: string) => void;
  onUnsnooze?: (id: string) => void;
  onSendReply?: (to: string, subject: string, body: string) => void;
  onBackToList?: () => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  onArchive,
  onDelete,
  onToggleStar,
  onSnooze,
  onUnsnooze,
  onSendReply,
  onBackToList,
  onNotify,
}) => {
  // Inline reply states
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedTone, setSelectedTone] = useState<AiTone>('professional');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // AI view state panels
  const [showSummary, setShowSummary] = useState(false);
  const [showActionItems, setShowActionItems] = useState(false);

  // Snooze dropdown state
  const [isSnoozeMenuOpen, setIsSnoozeMenuOpen] = useState(false);

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-canvas-dark">
        <EmptyState
          title="Select an email to read"
          description="Choose a message from the thread list or use shortcuts (J/K) to navigate."
        />
      </div>
    );
  }

  // Precomputed AI drafts based on tone
  const generateDraftByTone = (tone: AiTone) => {
    setIsGeneratingDraft(true);
    setTimeout(() => {
      let draft: string;
      if (email.id === 'thread-1') {
        if (tone === 'professional') {
          draft = `Hi Sarah,\n\nThank you for the updated term sheet and cap table model. Our legal counsel reviewed the pro-rata allocation updates and everything aligns with our board resolution.\n\nThursday at 2:00 PM PT works well for the closing call. Looking forward to finalizing the round.\n\nBest regards,\nAlex Rivera`;
        } else if (tone === 'friendly') {
          draft = `Hey Sarah,\n\nSuper excited about this! The updated term sheet looks great and the team is completely on board.\n\nLet's lock in Thursday at 2:00 PM PT for the closing call. Talk soon!\n\nCheers,\nAlex`;
        } else {
          draft = `Sarah — Term sheet looks good to proceed. Thursday at 2:00 PM PT confirmed for closing call.\n\nBest,\nAlex`;
        }
      } else if (email.id === 'thread-4') {
        if (tone === 'professional') {
          draft = `Hi Elena,\n\nThank you for confirming the security sign-off. We are finalizing the updated OpenAPI 3.1 specification for the webhooks and will send the schema documentation by Thursday afternoon.\n\nBest regards,\nAlex Rivera`;
        } else if (tone === 'friendly') {
          draft = `Hi Elena,\n\nGreat news on the security review! We'll have the OpenAPI specs ready for your team by Thursday so you can kick off mock testing without delays.\n\nBest,\nAlex`;
        } else {
          draft = `Elena — Noted. We will deliver the updated OpenAPI spec by Thursday for your team's mock sprint.\n\nThanks,\nAlex`;
        }
      } else {
        if (tone === 'professional') {
          draft = `Hello ${email.sender.name.split(' ')[0]},\n\nThank you for your message regarding "${email.subject}". I have reviewed the details and will follow up shortly with our comprehensive notes.\n\nBest regards,\nAlex Rivera`;
        } else if (tone === 'friendly') {
          draft = `Hey ${email.sender.name.split(' ')[0]},\n\nThanks for reaching out! Just saw your note and wanted to let you know I'm on it. Will send over details very soon.\n\nCheers,\nAlex`;
        } else {
          draft = `Received with thanks. Reviewing now and will follow up by end of day.\n\nAlex`;
        }
      }
      setReplyText(draft);
      setIsGeneratingDraft(false);
      setIsReplyOpen(true);
      onNotify?.(`Draft generated in ${tone} tone. Review before sending.`, 'info');
    }, 450);
  };

  const handleSend = () => {
    if (!replyText.trim()) return;
    onSendReply?.(
      email.sender.email,
      `Re: ${email.subject}`,
      replyText
    );
    setReplyText('');
    setIsReplyOpen(false);
    onNotify?.(`Reply sent to ${email.sender.name}.`, 'success');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Top Reading Pane Toolbar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Back button for mobile */}
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Back to thread list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {email.subject || '(No subject)'}
          </h2>

          {email.isNeedsReply && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60 shrink-0">
              Needs Reply
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onArchive(email.id)}
            icon={<Archive className="w-4 h-4" />}
            title="Archive (E)"
          >
            <span className="hidden sm:inline">Archive</span>
          </Button>

          {/* Snooze action */}
          <div className="relative">
            {email.isSnoozed ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onUnsnooze?.(email.id)}
                icon={<Clock className="w-4 h-4 text-brand-500" />}
                title="Unsnooze and return to Inbox"
              >
                <span className="hidden sm:inline">Unsnooze</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSnoozeMenuOpen(!isSnoozeMenuOpen)}
                icon={<Clock className="w-4 h-4" />}
                title="Snooze thread (H)"
              >
                <span className="hidden sm:inline">Snooze</span>
              </Button>
            )}

            {/* Snooze Popover */}
            {isSnoozeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsSnoozeMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-dropdown z-40 py-1.5 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Snooze until...
                  </div>
                  <button
                    onClick={() => {
                      setIsSnoozeMenuOpen(false);
                      onSnooze?.(email.id, 'Tomorrow, 9:00 AM');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <span>Tomorrow morning</span>
                    <span className="text-[10px] text-slate-400">9:00 AM</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsSnoozeMenuOpen(false);
                      onSnooze?.(email.id, 'Friday, 2:00 PM');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <span>Later this week</span>
                    <span className="text-[10px] text-slate-400">Fri 2:00 PM</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsSnoozeMenuOpen(false);
                      onSnooze?.(email.id, 'Next Monday, 9:00 AM');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <span>Next week</span>
                    <span className="text-[10px] text-slate-400">Mon 9:00 AM</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Star toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStar?.(email.id)}
            icon={
              <Star
                className={`w-4 h-4 ${
                  email.isStarred
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-slate-400'
                }`}
              />
            }
            title={email.isStarred ? 'Unstar' : 'Star'}
          />

          {/* Delete action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(email.id)}
            icon={<Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />}
            title="Delete message"
          />
        </div>
      </div>

      {/* Main Email Scrollable View */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Header Metadata */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-mono text-sm font-semibold shrink-0 shadow-xs">
              {email.sender.avatar || email.sender.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {email.sender.name}
                </span>
                {email.sender.role && (
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    · {email.sender.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {email.sender.email}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                To: <span className="text-slate-600 dark:text-slate-300">{email.recipient.name} ({email.recipient.email})</span>
                {email.cc && email.cc.length > 0 && (
                  <span> · CC: {email.cc.join(', ')}</span>
                )}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">
              {email.date} · {email.timestamp}
            </span>
            {email.isSnoozed && email.snoozedUntil && (
              <span className="text-[11px] font-mono text-brand-600 dark:text-brand-400 mt-1 block">
                Snoozed until {email.snoozedUntil}
              </span>
            )}
          </div>
        </div>

        {/* Section 6: Contextual AI Actions Bar */}
        <div className="p-3 rounded-xl bg-brand-50/50 dark:bg-slate-800/60 border border-brand-100 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-brand-900 dark:text-brand-200">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>AI Productivity Tools</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-100/70 text-brand-700 dark:bg-slate-700 dark:text-slate-300 font-normal">Prototype</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ai"
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
              icon={<Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
            >
              {showSummary ? 'Hide Summary' : '✨ Summarize'}
            </Button>

            <Button
              variant="ai"
              size="sm"
              onClick={() => generateDraftByTone(selectedTone)}
              icon={<Reply className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
            >
              Draft Reply
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActionItems(!showActionItems)}
              icon={<ListTodo className="w-3.5 h-3.5" />}
            >
              {showActionItems ? 'Hide Actions' : 'Action Items'}
            </Button>
          </div>
        </div>

        {/* AI Summary Card (Expandable) */}
        {showSummary && email.aiSummary && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50/40 dark:from-slate-800 dark:to-slate-800/80 border border-brand-200 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-brand-900 dark:text-brand-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                AI Key Takeaways
              </span>
              <button
                onClick={() => setShowSummary(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              {email.aiSummary}
            </p>
          </div>
        )}

        {/* AI Action Items Card (Expandable) */}
        {showActionItems && email.actionItems && email.actionItems.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-brand-500" />
                Identified Action Items ({email.actionItems.length})
              </span>
              <button
                onClick={() => setShowActionItems(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {email.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Email Body */}
        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-sans font-normal">
          {email.body}
        </div>

        {/* Attachment Cards */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Attachments ({email.attachments.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {email.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {att.type === 'xlsx' ? (
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-brand-600 shrink-0" />
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {att.filename}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{att.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNotify?.(`Downloading ${att.filename}...`, 'info')}
                    className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-md transition-colors"
                    title={`Download ${att.filename}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Reply Composer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          {!isReplyOpen ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
              <button
                onClick={() => setIsReplyOpen(true)}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
              >
                <Reply className="w-4 h-4" />
                <span>Click here or press <Kbd>R</Kbd> to reply...</span>
              </button>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => generateDraftByTone('professional')}
                  icon={<Sparkles className="w-3 h-3 text-brand-500" />}
                >
                  Draft AI Reply
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Reply className="w-3.5 h-3.5 text-brand-500" />
                  <span>Replying to <span className="font-semibold">{email.sender.name}</span></span>
                </div>

                {/* Tone Selector Chips (Section 6) */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">AI Tone:</span>
                  {(['professional', 'friendly', 'concise'] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => {
                        setSelectedTone(tone);
                        generateDraftByTone(tone);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors cursor-pointer ${
                        selectedTone === tone
                          ? 'bg-brand-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply or choose an AI tone above... (Press ⌘↵ to send)"
                className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs sm:text-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500 resize-y"
              />

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplyOpen(false)}
                >
                  Discard
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={handleSend}
                    disabled={!replyText.trim() || isGeneratingDraft}
                    icon={<SendHorizontal className="w-3.5 h-3.5" />}
                    shortcut="⌘↵"
                  >
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
