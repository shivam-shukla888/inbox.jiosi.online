import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  AlertCircle,
  Clock,
  Send,
  CheckCircle2,
  Bookmark,
  ShieldAlert,
  Newspaper,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DailyBriefResponseData, DailyBriefItemData } from '../../types/email';
import { apiClient } from '../../api/client';

interface DailyBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectThread: (threadId: string) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DailyBriefModal: React.FC<DailyBriefModalProps> = ({
  isOpen,
  onClose,
  onSelectThread,
  onNotify,
}) => {
  const [brief, setBrief] = useState<DailyBriefResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBrief(false);
    }
  }, [isOpen]);

  const loadBrief = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDailyBrief(forceRefresh);
      setBrief(data);
      if (forceRefresh && onNotify) {
        onNotify('Daily brief updated with latest mailbox data');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to compile daily brief';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const profileLabels: Record<string, string> = {
    generic: 'Small Business',
    freelancer_agency: 'Freelancer / Agency',
    local_service: 'Local Service',
    retail_ecommerce: 'Retail / E-commerce',
    professional_services: 'Professional Services',
    small_saas: 'Small SaaS',
  };

  const renderItemCard = (item: DailyBriefItemData, accentColor: 'danger' | 'amber' | 'indigo' | 'blue' | 'muted') => {
    const borderClasses = {
      danger: 'border-l-4 border-l-red-500 hover:border-red-400',
      amber: 'border-l-4 border-l-amber-500 hover:border-amber-400',
      indigo: 'border-l-4 border-l-indigo-500 hover:border-indigo-400',
      blue: 'border-l-4 border-l-blue-500 hover:border-blue-400',
      muted: 'border-l-4 border-l-slate-300 hover:border-slate-400',
    };

    return (
      <div
        key={item.threadId}
        onClick={() => {
          onSelectThread(item.threadId);
          onClose();
        }}
        className={`group p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer transition-all hover:shadow-sm ${borderClasses[accentColor]}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {item.senderName}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                &lt;{item.senderEmail}&gt;
              </span>
            </div>
            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {item.subject || '(No Subject)'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {item.briefReason}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {item.explicitDeadline && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3" />
                {item.explicitDeadline}
              </span>
            )}
            <div className="flex items-center gap-1 text-[10.5px]">
              <span className="text-slate-400 font-mono">Urg:{item.urgencyScore}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 font-mono">Imp:{item.importanceScore}</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
            → {item.suggestedNextAction}
          </span>
          <span className="text-slate-400 text-[11px] flex items-center gap-0.5 group-hover:text-indigo-500">
            View Thread <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Daily Business Email Brief
                </h3>
                {brief && (
                  <Badge variant="outline" className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                    {profileLabels[brief.businessProfile] || 'Small Business'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {brief?.summaryMessage || 'Compiling actionable overview of your business inbox...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadBrief(true)}
              disabled={isLoading}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && !brief && (
            <div className="py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
              <p className="text-sm font-medium">Analyzing threads, commitments, and deadlines with Groq...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {brief && (
            <>
              {/* Section 1: Needs You Today */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Needs You Today ({brief.needsYouToday.length})
                  </div>
                  <span className="text-[11px] text-slate-400">Due today or urgent action required</span>
                </div>

                {brief.needsYouToday.length === 0 ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>All clear for today!</strong> No urgent deadlines or blocking deliverables due immediately.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {brief.needsYouToday.map((item) => renderItemCard(item, 'danger'))}
                  </div>
                )}
              </section>

              {/* Section 2: Waiting on Someone Else */}
              {brief.waitingOnSomeoneElse.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      Waiting on Someone Else ({brief.waitingOnSomeoneElse.length})
                    </div>
                    <span className="text-[11px] text-slate-400">Pending response or deliverable from counterpart</span>
                  </div>
                  <div className="space-y-2.5">
                    {brief.waitingOnSomeoneElse.map((item) => renderItemCard(item, 'amber'))}
                  </div>
                </section>
              )}

              {/* Section 3: Promises You Made */}
              {brief.promisesYouMade.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      <Send className="w-3.5 h-3.5" />
                      Promises You Made ({brief.promisesYouMade.length})
                    </div>
                    <span className="text-[11px] text-slate-400">Active commitments you agreed to deliver</span>
                  </div>
                  <div className="space-y-2.5">
                    {brief.promisesYouMade.map((item) => renderItemCard(item, 'indigo'))}
                  </div>
                </section>
              )}

              {/* Section 4: Important, but Not Urgent */}
              {brief.importantNotUrgent.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      <Bookmark className="w-3.5 h-3.5" />
                      Important, but Not Urgent ({brief.importantNotUrgent.length})
                    </div>
                    <span className="text-[11px] text-slate-400">High-value context to review when time permits</span>
                  </div>
                  <div className="space-y-2.5">
                    {brief.importantNotUrgent.map((item) => renderItemCard(item, 'blue'))}
                  </div>
                </section>
              )}

              {/* Section 5: Newsletters / Bulk */}
              {brief.newslettersBulk.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Newspaper className="w-3.5 h-3.5" />
                      Newsletters & Bulk ({brief.newslettersBulk.length})
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {brief.newslettersBulk.map((item) => renderItemCard(item, 'muted'))}
                  </div>
                </section>
              )}

              {/* Section 6: Possible Spam or Suspicious */}
              {brief.possibleSpamOrSuspicious.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      Possible Spam / Suspicious Candidates ({brief.possibleSpamOrSuspicious.length})
                    </div>
                    <span className="text-[11px] text-slate-400">Kept visible for your safe review; never auto-deleted</span>
                  </div>
                  <div className="space-y-2.5">
                    {brief.possibleSpamOrSuspicious.map((item) => renderItemCard(item, 'muted'))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>AI suggestions are advisory. All email actions remain user-confirmed.</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
