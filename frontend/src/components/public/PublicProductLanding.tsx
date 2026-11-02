import React from 'react';
import { ArrowRight, Shield, Zap, Sparkles, Lock } from 'lucide-react';
import { Button } from '../ui/Button';

interface PublicProductLandingProps {
  onLaunchApp: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenSupport: () => void;
}

export const PublicProductLanding: React.FC<PublicProductLandingProps> = ({
  onLaunchApp,
  onOpenPrivacy,
  onOpenTerms,
  onOpenSupport,
}) => {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-canvas-dark text-slate-900 dark:text-slate-100">
      {/* Top Navigation */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm">
            JI
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
            JIOSI Inbox
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-900/60">
            SaaS v0.1
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSupport}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hidden sm:block"
          >
            Help & Docs
          </button>
          <Button variant="primary" size="sm" onClick={onLaunchApp} icon={<ArrowRight className="w-4 h-4" />}>
            Open Workspace
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-8 py-16 sm:py-24 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 text-xs font-medium text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Intelligent Email Management</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
          Read less. Understand faster. Respond smarter.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          JIOSI Inbox transforms overwhelming message streams into calm, high-velocity workflows. Built on a zero-tracking, multi-tenant architecture designed for professionals and teams.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button variant="primary" size="lg" onClick={onLaunchApp} icon={<ArrowRight className="w-5 h-5" />}>
            Launch Workspace
          </Button>
          <Button variant="secondary" size="lg" onClick={onOpenSupport}>
            View Documentation
          </Button>
        </div>

        <p className="text-xs text-slate-500 font-mono">
          Keyboard-first · Sub-millisecond indexed search · Tenant-isolated PostgreSQL
        </p>
      </section>

      {/* Feature Grid */}
      <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Keyboard-First Velocity</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Navigate with J and K, archive with E, reply with R, and launch commands with ⌘K. Triage hundreds of emails in minutes without touching your mouse.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Strict Workspace Isolation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every query is cryptographically authenticated and double-checked against database tenant memberships. Your emails are never mixed or exposed.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Zero Surveillance Cookies</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No tracking pixels, third-party advertising scripts, or data brokering. Your mailbox is your private domain.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-8 py-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          © 2026 JIOSI AI · <a href="https://jiosi.online" target="_blank" rel="noopener noreferrer" className="hover:underline">jiosi.online</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onOpenPrivacy} className="hover:text-slate-900 dark:hover:text-slate-300 underline">Privacy Policy</button>
          <button onClick={onOpenTerms} className="hover:text-slate-900 dark:hover:text-slate-300 underline">Terms of Service</button>
          <button onClick={onOpenSupport} className="hover:text-slate-900 dark:hover:text-slate-300 underline">Support</button>
        </div>
      </footer>
    </div>
  );
};
