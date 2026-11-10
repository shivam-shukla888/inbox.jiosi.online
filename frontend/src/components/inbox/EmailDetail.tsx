import React, { useState, useEffect } from 'react';
import { EmailThread, AiTone, ThreadSummaryData, ActionItemData, ThreadAiTriageData } from '../../types/email';
import { Button } from '../ui/Button';
import { Kbd } from '../ui/Kbd';
import { apiClient } from '../../api/client';
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
  FileSpreadsheet,
  Inbox,
  HelpCircle,
  Calendar,
  Languages,
  RotateCcw,
  Tag
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

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-600 text-white',
  'from-blue-500 to-indigo-600 text-white',
  'from-violet-500 to-purple-600 text-white',
  'from-emerald-500 to-teal-600 text-white',
  'from-amber-500 to-orange-600 text-white',
  'from-rose-500 to-pink-600 text-white',
  'from-sky-500 to-blue-600 text-white',
];

function getAvatarStyle(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  const [selectedLanguage, setSelectedLanguage] = useState<'match_thread' | 'en' | 'hi'>('match_thread');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // AI view state panels
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<ThreadSummaryData | null>(
    email?.aiSummary
      ? {
          gist: email.aiSummary,
          keyDecisions: [],
          openQuestion: null,
          explicitDeadline: null,
          suggestedNextAction: 'Review message details.',
        }
      : null
  );
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [showActionItems, setShowActionItems] = useState(false);
  const [actionItemsList, setActionItemsList] = useState<ActionItemData[]>(
    email?.actionItems && email.actionItems.length > 0
      ? email.actionItems.map((item) => ({
          title: item,
          confidence: 0.9,
        }))
      : []
  );
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);

  // Triage state
  const [triageData, setTriageData] = useState<ThreadAiTriageData | null>(email?.triage || null);
  const [isTriaging, setIsTriaging] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  // Snooze dropdown state
  const [isSnoozeMenuOpen, setIsSnoozeMenuOpen] = useState(false);

  // Reset states when email changes
  useEffect(() => {
    setShowSummary(false);
    setSummaryData(
      email?.aiSummary
        ? {
            gist: email.aiSummary,
            keyDecisions: [],
            openQuestion: null,
            explicitDeadline: null,
            suggestedNextAction: 'Review message details.',
          }
        : null
    );
    setSummaryError(null);
    setShowActionItems(false);
    setActionItemsList(
      email?.actionItems && email.actionItems.length > 0
        ? email.actionItems.map((item) => ({
            title: item,
            confidence: 0.9,
          }))
        : []
    );
    setActionsError(null);
    setTriageData(email?.triage || null);
    setIsReplyOpen(false);
    setReplyText('');
  }, [email?.id, email?.aiSummary, email?.actionItems, email?.triage]);

  if (!email) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-8 select-none">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-50 to-violet-100/70 border border-indigo-100 flex items-center justify-center mx-auto text-jiosi-indigo shadow-sm shadow-indigo-100/50">
            <Inbox className="w-7 h-7 text-jiosi-indigo" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-ui font-semibold text-slate-900 tracking-tight">
              Select an email to read
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-light">
              Choose a message from the thread list or use shortcuts to navigate smoothly through your conversations.
            </p>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-left shadow-2xs space-y-2.5">
            <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
              Quick Shortcuts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
                <span className="text-slate-600 font-medium">Next / Prev</span>
                <div className="flex gap-1">
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
                <span className="text-slate-600 font-medium">New Email</span>
                <Kbd>C</Kbd>
              </div>
              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
                <span className="text-slate-600 font-medium">Reply</span>
                <Kbd>R</Kbd>
              </div>
              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
                <span className="text-slate-600 font-medium">Archive</span>
                <Kbd>E</Kbd>
              </div>
              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100 col-span-2">
                <span className="text-slate-600 font-medium">Command Palette</span>
                <Kbd>⌘K</Kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const senderInitials = email.sender.avatar && email.sender.avatar.length <= 3
    ? email.sender.avatar
    : getInitials(email.sender.name || email.sender.email);

  const avatarGradient = getAvatarStyle(email.sender.name || email.sender.email);

  // Real backend call: Summarize thread
  const handleToggleSummary = async () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    setShowSummary(true);
    if (summaryData) return;

    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const summary = await apiClient.summarizeThread(email.id);
      setSummaryData(summary);
      onNotify?.('Thread summary generated by Groq AI.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate AI summary';
      setSummaryError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Real backend call: Extract Action Items
  const handleToggleActionItems = async () => {
    if (showActionItems) {
      setShowActionItems(false);
      return;
    }
    setShowActionItems(true);
    if (actionItemsList.length > 0) return;

    setIsLoadingActions(true);
    setActionsError(null);
    try {
      const items = await apiClient.extractActionItems(email.id);
      setActionItemsList(items);
      onNotify?.(`Identified ${items.length} action item${items.length === 1 ? '' : 's'}.`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to extract action items';
      setActionsError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setIsLoadingActions(false);
    }
  };

  // Real backend call: Generate Reply Draft
  const handleGenerateReplyDraft = async (tone: AiTone = selectedTone, lang: 'match_thread' | 'en' | 'hi' = selectedLanguage) => {
    setIsGeneratingDraft(true);
    try {
      const res = await apiClient.generateReplyDraft(email.id, tone, lang);
      setReplyText(res.draftText);
      setIsReplyOpen(true);
      onNotify?.(`Draft generated in ${tone} tone. Review before sending.`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate draft';
      onNotify?.(msg, 'error');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Real backend call: Fetch Triage on Demand
  const handleAnalyzeTriage = async () => {
    setIsTriaging(true);
    try {
      const triage = await apiClient.getThreadTriage(email.id);
      setTriageData(triage);
      onNotify?.(`Categorized as ${triage.category} (Importance: ${triage.importanceScore}, Urgency: ${triage.urgencyScore}).`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Triage analysis unavailable';
      onNotify?.(msg, 'error');
    } finally {
      setIsTriaging(false);
    }
  };

  // Real backend call: User Triage Correction
  const handleCorrectCategory = async (newCategory: string) => {
    setIsCategoryMenuOpen(false);
    try {
      const updated = await apiClient.correctThreadTriage(email.id, newCategory, 'User corrected category', false);
      setTriageData(updated);
      onNotify?.(`Category corrected to ${newCategory}. Thank you for your feedback!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update category';
      onNotify?.(msg, 'error');
    }
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
    <div className="h-full flex flex-col bg-white overflow-hidden font-sans">
      {/* Top Reading Pane Toolbar */}
      <div className="h-14 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 bg-white shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Back to thread list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <h2 className="text-sm sm:text-base font-ui font-semibold text-slate-900 truncate" title={email.subject}>
            {email.subject || '(No subject)'}
          </h2>

          {email.isNeedsReply && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
              Needs Reply
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsReplyOpen(true)}
            icon={<Reply className="w-3.5 h-3.5 text-slate-600" />}
            title="Reply (R)"
          >
            <span className="hidden sm:inline">Reply</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onArchive(email.id)}
            icon={<Archive className="w-4 h-4 text-slate-500" />}
            title="Archive (E)"
            aria-label="Archive"
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
                icon={<Clock className="w-3.5 h-3.5 text-jiosi-indigo" />}
                className="font-ui text-jiosi-indigo"
              >
                Unsnooze
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSnoozeMenuOpen(!isSnoozeMenuOpen)}
                icon={<Clock className="w-4 h-4 text-slate-500" />}
                title="Snooze (H)"
                aria-label="Snooze"
              >
                <span className="hidden sm:inline">Snooze</span>
              </Button>
            )}

            {isSnoozeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsSnoozeMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs font-ui">
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Snooze Until
                  </div>
                  <button
                    onClick={() => {
                      setIsSnoozeMenuOpen(false);
                      onSnooze?.(email.id, 'Tomorrow, 9:00 AM');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <span>Tomorrow morning</span>
                    <span className="text-[10px] text-slate-400 font-mono">9:00 AM</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsSnoozeMenuOpen(false);
                      onSnooze?.(email.id, 'Friday, 2:00 PM');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <span>Later this week</span>
                    <span className="text-[10px] text-slate-400 font-mono">Fri 2:00 PM</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsSnoozeMenuOpen(false);
                      onSnooze?.(email.id, 'Next Monday, 9:00 AM');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <span>Next week</span>
                    <span className="text-[10px] text-slate-400 font-mono">Mon 9:00 AM</span>
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
            aria-label={email.isStarred ? 'Unstar' : 'Star'}
          />

          {/* Delete action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(email.id)}
            icon={<Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500 transition-colors" />}
            title="Delete message"
            aria-label="Delete message"
          />
        </div>
      </div>

      {/* Main Email Scrollable View */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 bg-white">
        <div className="max-w-3xl w-full mx-auto space-y-6">
          {/* Header Metadata */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center font-ui font-bold text-xs shrink-0 shadow-sm shadow-indigo-100`}>
                {senderInitials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-ui font-semibold text-slate-900">
                    {email.sender.name}
                  </span>
                  {email.sender.role && (
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {email.sender.role}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {email.sender.email}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  To: <span className="text-slate-700 font-medium">{email.recipient.name} ({email.recipient.email})</span>
                  {email.cc && email.cc.length > 0 && (
                    <span> · CC: {email.cc.join(', ')}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-mono text-slate-500 block tabular-nums">
                {email.date} · {email.timestamp}
              </span>
              {email.isSnoozed && email.snoozedUntil && (
                <span className="text-[11px] font-mono text-jiosi-indigo mt-1 block font-medium">
                  Snoozed until {email.snoozedUntil}
                </span>
              )}
            </div>
          </div>

          {/* AI Intelligence & Triage Header Pill Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-50/90 to-indigo-50/60 border border-violet-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-ui font-semibold text-slate-800">
              <Sparkles className="w-4 h-4 text-jiosi-violet" />
              <span>Groq Intelligence</span>

              {/* Triage Badges if available */}
              {triageData && (
                <div className="flex items-center gap-1.5 ml-2">
                  <div className="relative">
                    <button
                      onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                      className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border cursor-pointer ${
                        triageData.category === 'suspicious' || triageData.category === 'spam' || triageData.category === 'gmail_spam'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : triageData.category === 'newsletter' || triageData.category === 'promotional'
                          ? 'bg-sky-50 text-sky-800 border-sky-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                      title="Click to correct classification"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span className="capitalize">{triageData.userOverrideCategory || triageData.category}</span>
                      <span className="text-[9px] opacity-60">▾</span>
                    </button>

                    {isCategoryMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsCategoryMenuOpen(false)} />
                        <div className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs font-ui">
                          <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            Correct Category
                          </div>
                          {(['primary', 'transactional', 'newsletter', 'promotional', 'spam'] as const).map((cat) => (
                            <button
                              key={cat}
                              onClick={() => handleCorrectCategory(cat)}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 capitalize text-slate-700 cursor-pointer"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <span
                    className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200"
                    title={triageData.importanceReason || 'Importance score'}
                  >
                    Imp: {triageData.importanceScore}/100
                  </span>

                  <span
                    className={`inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      triageData.urgencyScore >= 50
                        ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                    title={triageData.urgencyReason || 'Urgency score'}
                  >
                    Urg: {triageData.urgencyScore}/100
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!triageData && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAnalyzeTriage}
                  disabled={isTriaging}
                  icon={<Tag className="w-3.5 h-3.5 text-slate-600" />}
                  className="font-ui font-medium text-xs"
                >
                  {isTriaging ? 'Analyzing...' : 'Triage Mail'}
                </Button>
              )}

              <Button
                variant="ai"
                size="sm"
                onClick={handleToggleSummary}
                disabled={isSummarizing}
                icon={<Sparkles className="w-3.5 h-3.5 text-jiosi-violet" />}
                className="font-ui font-medium text-xs"
              >
                {isSummarizing ? 'Summarizing...' : showSummary ? 'Hide Summary' : '✨ Summarize'}
              </Button>

              <Button
                variant="ai"
                size="sm"
                onClick={() => handleGenerateReplyDraft()}
                disabled={isGeneratingDraft}
                icon={<Reply className="w-3.5 h-3.5 text-jiosi-indigo" />}
                className="font-ui font-medium text-xs"
              >
                {isGeneratingDraft ? 'Drafting...' : 'Draft Reply'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleActionItems}
                disabled={isLoadingActions}
                icon={<ListTodo className="w-3.5 h-3.5" />}
                className="font-ui font-medium text-xs"
              >
                {isLoadingActions ? 'Extracting...' : showActionItems ? 'Hide Actions' : 'Action Items'}
              </Button>
            </div>
          </div>

          {/* AI Summary Card (Expandable) */}
          {showSummary && (
            <div className="p-4.5 rounded-2xl bg-violet-50/80 border border-violet-200 animate-in fade-in space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-violet-100">
                <span className="text-xs font-ui font-bold text-violet-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-jiosi-violet" />
                  AI Key Takeaways
                </span>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  aria-label="Close summary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {isSummarizing && (
                <p className="text-xs text-slate-500 animate-pulse font-light">
                  Analyzing thread messages and generating structured summary via Groq...
                </p>
              )}

              {summaryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
                  <span>{summaryError}</span>
                  <Button variant="ghost" size="xs" onClick={handleToggleSummary} icon={<RotateCcw className="w-3 h-3" />}>
                    Retry
                  </Button>
                </div>
              )}

              {summaryData && (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block mb-0.5">Core Gist:</span>
                    <p className="text-slate-700 font-light leading-relaxed">{summaryData.gist}</p>
                  </div>

                  {summaryData.keyDecisions && summaryData.keyDecisions.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-900 block mb-1">Decisions & Facts:</span>
                      <ul className="space-y-1 pl-2">
                        {summaryData.keyDecisions.map((dec, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-700 font-light">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{dec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summaryData.openQuestion && (
                    <div className="p-2.5 rounded-xl bg-white/80 border border-violet-100 text-slate-700">
                      <span className="font-semibold text-violet-900 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-violet-600" /> Open Question:
                      </span>
                      <p className="font-light mt-0.5">{summaryData.openQuestion}</p>
                    </div>
                  )}

                  {summaryData.explicitDeadline && (
                    <div className="p-2.5 rounded-xl bg-white/80 border border-violet-100 text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span><strong>Deadline:</strong> {summaryData.explicitDeadline}</span>
                    </div>
                  )}

                  {summaryData.suggestedNextAction && (
                    <div className="pt-2 border-t border-violet-100 text-slate-600 font-light">
                      <span className="font-semibold text-slate-900">Suggested Action (Advisory):</span>{' '}
                      {summaryData.suggestedNextAction}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Action Items Card (Expandable) */}
          {showActionItems && (
            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-ui font-bold text-slate-900 flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-jiosi-indigo" />
                  Identified Action Items ({actionItemsList.length})
                </span>
                <button
                  onClick={() => setShowActionItems(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  aria-label="Close action items"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {isLoadingActions && (
                <p className="text-xs text-slate-500 animate-pulse font-light">
                  Extracting grounded action items from conversation...
                </p>
              )}

              {actionsError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
                  <span>{actionsError}</span>
                  <Button variant="ghost" size="xs" onClick={handleToggleActionItems} icon={<RotateCcw className="w-3 h-3" />}>
                    Retry
                  </Button>
                </div>
              )}

              {actionItemsList.length > 0 ? (
                <ul className="space-y-2 text-xs text-slate-700 font-light">
                  {actionItemsList.map((item, idx) => (
                    <li key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="font-medium text-slate-900">{item.title}</span>
                        </div>
                        {item.dueDate && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                            Due: {item.dueDate}
                          </span>
                        )}
                      </div>
                      {item.owner && (
                        <p className="text-[11px] text-slate-500 pl-5">Owner: <span className="font-medium">{item.owner}</span></p>
                      )}
                      {item.evidenceQuote && (
                        <p className="text-[10px] font-mono text-slate-400 pl-5 italic truncate">
                          "{item.evidenceQuote}"
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : !isLoadingActions && (
                <p className="text-xs text-slate-500 italic">No explicit tasks or commitments found in this email.</p>
              )}
            </div>
          )}

          {/* Email Body */}
          <div className="text-[15px] sm:text-base text-slate-800 leading-relaxed sm:leading-8 whitespace-pre-line font-normal tracking-[0.005em]">
            {email.body}
          </div>

          {/* Attachment Cards */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="pt-5 border-t border-slate-100 space-y-2.5">
              <p className="text-xs font-ui font-semibold text-slate-600">
                Attachments ({email.attachments.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {email.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {att.type === 'xlsx' ? (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-jiosi-indigo shrink-0" />
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {att.filename}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{att.size}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNotify?.(`Downloading ${att.filename}...`, 'info')}
                      className="p-1.5 text-slate-400 hover:text-jiosi-indigo rounded-lg transition-colors cursor-pointer"
                      title={`Download ${att.filename}`}
                      aria-label={`Download ${att.filename}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline Reply Composer */}
          <div className="pt-5 border-t border-slate-200">
            {!isReplyOpen ? (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-400 transition-colors">
                <button
                  onClick={() => setIsReplyOpen(true)}
                  className="flex items-center gap-2.5 text-xs font-ui text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <Reply className="w-4 h-4 text-jiosi-indigo" />
                  <span>Click here or press <Kbd>R</Kbd> to reply...</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleGenerateReplyDraft('professional')}
                    disabled={isGeneratingDraft}
                    icon={<Sparkles className="w-3 h-3 text-jiosi-violet" />}
                    className="font-ui"
                  >
                    Draft AI Reply
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-ui font-medium text-slate-700">
                    <Reply className="w-3.5 h-3.5 text-jiosi-indigo" />
                    <span>Replying to <span className="font-semibold text-slate-900">{email.sender.name}</span></span>
                  </div>

                  {/* Tone & Language Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Language selector */}
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <Languages className="w-3 h-3 text-slate-400" />
                      <select
                        value={selectedLanguage}
                        onChange={(e) => {
                          const val = e.target.value as 'match_thread' | 'en' | 'hi';
                          setSelectedLanguage(val);
                          handleGenerateReplyDraft(selectedTone, val);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="match_thread">Match thread</option>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>

                    {/* Tone Selector Chips */}
                    <div className="flex items-center gap-1">
                      {(['professional', 'friendly', 'concise'] as const).map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => {
                            setSelectedTone(tone);
                            handleGenerateReplyDraft(tone, selectedLanguage);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-ui font-medium capitalize transition-all cursor-pointer ${
                            selectedTone === tone
                              ? 'bg-jiosi-indigo text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply or choose an AI tone above... (Press ⌘↵ to send)"
                  className="w-full bg-slate-50/50 text-slate-900 text-sm rounded-xl p-3.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-jiosi-indigo/20 focus:border-jiosi-indigo resize-y font-sans"
                />

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplyOpen(false)}
                    className="font-ui"
                  >
                    Discard
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="violet"
                      size="sm"
                      onClick={handleSend}
                      disabled={!replyText.trim() || isGeneratingDraft}
                      icon={<SendHorizontal className="w-3.5 h-3.5" />}
                      shortcut="⌘↵"
                      className="font-ui font-medium text-white shadow-sm"
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
    </div>
  );
};
