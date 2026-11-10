import React, { useState, useEffect } from 'react';
import { X, SendHorizontal, Paperclip, Sparkles, Undo2, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { apiClient } from '../../api/client';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => void;
  onSaveDraft?: (to: string, subject: string, body: string) => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSend,
  onSaveDraft,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
}) => {
  const [to, setTo] = useState(initialTo);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [history, setHistory] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string>('Saved just now');

  // AI Assist States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    text: string;
    explanation: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo);
      setSubject(initialSubject);
      setBody(initialBody);
      setHistory([]);
      setPendingSuggestion(null);
    }
  }, [isOpen, initialTo, initialSubject, initialBody]);

  // Simulate auto-save draft timer
  useEffect(() => {
    if (!isOpen || (!to && !subject && !body)) return;
    const timer = setTimeout(() => {
      setLastSaved('Draft saved');
      onSaveDraft?.(to, subject, body);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isOpen, to, subject, body, onSaveDraft]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      setValidationError('Please specify a recipient email address.');
      return;
    }
    if (!to.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (!subject.trim()) {
      setValidationError('Please provide a subject line.');
      return;
    }

    setValidationError(null);
    onSend(to, subject, body);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAiAssist = async (action: string, targetLanguage?: string) => {
    if (!body.trim()) {
      // If body is empty, insert a quick prompt template
      const template = action === 'tone_friendly'
        ? 'Hey everyone,\n\nQuick heads up on our progress! Looking forward to your thoughts.\n\nCheers,\nAlex'
        : 'Dear team,\n\nI am writing to share our latest project milestone update for your review.\n\nBest regards,\nAlex';
      setHistory((prev) => [...prev, body]);
      setBody(template);
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await apiClient.assistCompose(body, action, targetLanguage);
      setPendingSuggestion({
        text: res.suggestedText,
        explanation: res.explanation || 'Refined text generated.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI assistance unavailable';
      setValidationError(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (!pendingSuggestion) return;
    setHistory((prev) => [...prev, body]);
    setBody(pendingSuggestion.text);
    setPendingSuggestion(null);
  };

  const handleDeclineSuggestion = () => {
    setPendingSuggestion(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, h.length - 1));
    setBody(prev);
  };

  const handleAttachMockFile = () => {
    setAttachments((prev) => [...prev, `Project_Summary_${prev.length + 1}.pdf`]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-ui font-bold text-slate-900">
              New Message
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              · {lastSaved}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className="flex items-center gap-1 text-[11px] font-ui text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Undo last change"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close composer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
            <span>{validationError}</span>
            <button onClick={() => setValidationError(null)} className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer">×</button>
          </div>
        )}

        {/* Pending Suggestion Review Box */}
        {pendingSuggestion && (
          <div className="px-5 py-3 bg-violet-50 border-b border-violet-200 space-y-2 animate-in fade-in text-xs font-ui">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-violet-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-jiosi-violet" />
                AI Suggestion Review: <span className="font-normal text-violet-800">{pendingSuggestion.explanation}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAcceptSuggestion}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-jiosi-indigo text-white font-medium text-xs hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
                >
                  <Check className="w-3 h-3" />
                  <span>Apply</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeclineSuggestion}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Decline
                </button>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-violet-100 text-slate-800 whitespace-pre-wrap max-h-36 overflow-y-auto font-light leading-relaxed">
              {pendingSuggestion.text}
            </div>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* To field */}
          <div className="border-b border-slate-100 px-5 py-2.5 flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-16 shrink-0">To:</span>
            <input
              type="text"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="name@company.com"
              className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none font-sans"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showCcBcc ? 'Hide CC/BCC' : 'Cc / Bcc'}
            </button>
          </div>

          {/* Optional CC/BCC */}
          {showCcBcc && (
            <>
              <div className="border-b border-slate-100 px-5 py-2 flex items-center gap-3 bg-slate-50/40">
                <span className="text-xs font-mono text-slate-400 w-16 shrink-0">Cc:</span>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="teammate@company.com"
                  className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none font-sans"
                />
              </div>
              <div className="border-b border-slate-100 px-5 py-2 flex items-center gap-3 bg-slate-50/40">
                <span className="text-xs font-mono text-slate-400 w-16 shrink-0">Bcc:</span>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="archive@company.com"
                  className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none font-sans"
                />
              </div>
            </>
          )}

          {/* Subject field */}
          <div className="border-b border-slate-100 px-5 py-2.5 flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-16 shrink-0">Subject:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Subject line"
              className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none font-sans"
            />
          </div>

          {/* Body Textarea */}
          <div className="flex-1 p-5 min-h-[180px] overflow-y-auto">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here... Use ⌘↵ to send."
              className="w-full h-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm leading-relaxed focus:outline-none resize-none font-light"
            />
          </div>

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="px-5 py-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-700 border border-slate-200"
                >
                  <Paperclip className="w-3 h-3 text-slate-400" />
                  <span>{file}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                    className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Toolbar & Actions */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="violet"
                size="sm"
                icon={<SendHorizontal className="w-3.5 h-3.5" />}
                shortcut="⌘↵"
                className="font-ui font-medium text-white shadow-sm"
              >
                Send Message
              </Button>

              <button
                type="button"
                onClick={handleAttachMockFile}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Attach file"
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {/* Groq AI Composition Assistance Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-jiosi-violet" /> AI Assist:
              </span>
              <button
                type="button"
                disabled={isAiLoading}
                onClick={() => handleAiAssist('rewrite')}
                className="px-2 py-1 text-[11px] font-ui font-medium rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAiLoading ? 'Working...' : 'Polish'}
              </button>
              <button
                type="button"
                disabled={isAiLoading}
                onClick={() => handleAiAssist('shorten')}
                className="px-2 py-1 text-[11px] font-ui font-medium rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Shorten
              </button>
              <button
                type="button"
                disabled={isAiLoading}
                onClick={() => handleAiAssist('tone_professional')}
                className="px-2 py-1 text-[11px] font-ui font-medium rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer hidden sm:inline-block disabled:opacity-50"
              >
                Professional
              </button>
              <button
                type="button"
                disabled={isAiLoading}
                onClick={() => handleAiAssist('fix_grammar')}
                className="px-2 py-1 text-[11px] font-ui font-medium rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer hidden sm:inline-block disabled:opacity-50"
              >
                Grammar
              </button>
              <button
                type="button"
                disabled={isAiLoading}
                onClick={() => handleAiAssist('translate', 'hi')}
                className="px-2 py-1 text-[11px] font-ui font-medium rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer hidden md:inline-block disabled:opacity-50"
              >
                Hindi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
