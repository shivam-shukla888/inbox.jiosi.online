import React, { useState } from 'react';
import { HelpCircle, ArrowLeft, Mail, MessageSquare, Terminal, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Kbd } from '../ui/Kbd';

interface SupportViewProps {
  onBack: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ onBack }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I use keyboard shortcuts for high-velocity triage?',
      a: 'Press J or K to navigate through threads, E to archive, R to start an inline reply, H to snooze, and S to toggle star. Press C anywhere to open the compose modal, and ⌘K to trigger the command palette.'
    },
    {
      q: 'What is the difference between Live Mode and Demo Mode?',
      a: 'Live Mode connects directly to the JIOSI backend service and persists changes to the PostgreSQL database. Demo Mode uses local synthetic threads for evaluation without modifying real mailbox data.'
    },
    {
      q: 'How does workspace isolation protect my mailbox?',
      a: 'Every request requires an authenticated Bearer token and verifies workspace membership via database constraints. Users cannot view, modify, or search threads in workspaces where they are not authorized members.'
    },
    {
      q: 'How do I connect external email providers like Gmail or Outlook?',
      a: 'Navigate to Settings → Connected Accounts. When OAuth provider credentials are fully provisioned, you can authenticate directly with Google Workspace or Microsoft 365.'
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-canvas-dark text-slate-800 dark:text-slate-200 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Inbox
          </Button>
          <span className="text-xs font-mono text-slate-400">JIOSI Support Center</span>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Help & Support
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Assistance, guides, and diagnostic tools for JIOSI Inbox.
          </p>
        </div>

        {/* Contact Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold text-sm">
              <Mail className="w-4 h-4" />
              <span>Email Support</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Reach our support team directly for account or workspace questions.
            </p>
            <p className="text-xs font-mono font-medium text-slate-900 dark:text-slate-200">
              support@jiosi.online
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>Community & Updates</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Feature roadmaps, changelogs, and technical announcements.
            </p>
            <a
              href="https://jiosi.online"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono font-medium text-brand-600 dark:text-brand-400 hover:underline block"
            >
              https://jiosi.online ↗
            </a>
          </div>
        </div>

        {/* Keyboard Quick Reference */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span>Essential Keyboard Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Compose</span>
              <Kbd>C</Kbd>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Archive</span>
              <Kbd>E</Kbd>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Reply</span>
              <Kbd>R</Kbd>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Palette</span>
              <Kbd>⌘K</Kbd>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          JIOSI Inbox · Version 0.1.0-alpha · Powered by Spring Boot & React
        </div>
      </div>
    </div>
  );
};
