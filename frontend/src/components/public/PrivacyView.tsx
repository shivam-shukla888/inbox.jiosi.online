import React from 'react';
import { Shield, ArrowLeft, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Button } from '../ui/Button';

interface PrivacyViewProps {
  onBack: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBack }) => {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-canvas-dark text-slate-800 dark:text-slate-200 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Inbox
          </Button>
          <span className="text-xs font-mono text-slate-400">Effective Date: November 2, 2026</span>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            JIOSI Inbox by Shivsastra is designed with privacy-first principles. This document outlines how your data is handled, stored, and protected.
          </p>
        </div>

        {/* Legal / Owner Confirmation Notice */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Product Owner & Legal Verification Notice</span>
          </div>
          <p>
            The disclosures below reflect verified technical behavior implemented in this repository. Items marked with <strong>[OWNER CONFIRMATION REQUIRED]</strong> represent business policies, corporate registration entities, or subprocessor lists that must be formally ratified by the product owner and legal counsel prior to public commercial launch.
          </p>
        </div>

        {/* Section 1: Data We Collect */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            1. Information Processed by JIOSI Inbox
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              When using the application in connected or demonstration mode, the following data points are processed:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Workspace & User Identifiers</strong>: User UUID, full name, email address, and workspace membership role.</li>
              <li><strong>Email Metadata & Message Content</strong>: Sender names, email addresses, subject lines, snippet text, message bodies, timestamps, and attachment filenames.</li>
              <li><strong>Workflow State</strong>: Read status, starred flags, snooze schedule timestamps, archive indicators, and user-authored drafts.</li>
              <li><strong>Client-Side Preferences</strong>: Dark/light theme choices and local UI toggles stored in your browser's <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">localStorage</code>.</li>
            </ul>
          </div>
        </div>

        {/* Section 2: Cookies & Tracking */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-500" />
            2. Cookies & Tracking Technology
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              JIOSI Inbox does <strong>not</strong> use third-party tracking cookies, behavioral ad pixels, or surveillance scripts. Only standard HTML5 <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">localStorage</code> is utilized for theme retention and temporary UI state.
            </p>
          </div>
        </div>

        {/* Section 3: Data Storage & Multi-Tenant Isolation */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            3. Multi-Tenant Storage & Isolation
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              All email data is stored in isolated relational databases governed by strict foreign keys and multi-tenant authorization filters. API requests verify identity tokens and workspace memberships; access to another workspace's records without explicit membership is prohibited and rejected with HTTP 403 Forbidden.
            </p>
          </div>
        </div>

        {/* Section 4: Email Provider Access & Tokens */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            4. Email Provider Access & Credentials
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              In current production and demonstration builds, no plaintext mailbox passwords or unsecured OAuth tokens are stored in database tables. The <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">connected_accounts</code> schema retains only provider identifiers and account addresses.
            </p>
          </div>
        </div>

        {/* Section 5: Groq AI Email Intelligence */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-jiosi-violet" />
            5. Groq AI Email Intelligence & Privacy Controls
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              When user-initiated or configured AI features are activated, sanitized email thread content is transmitted over TLS to Groq Cloud inference infrastructure (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">https://api.groq.com/openai/v1</code>).
            </p>
            <div className="bg-slate-100/70 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <p className="font-semibold text-slate-900 dark:text-white">AI-Powered Features Covered:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li><strong>Thread Summaries & Gist</strong>: Concise 1-sentence summaries, key decisions, and open questions (<code className="font-mono text-[11px]">llama-3.3-70b-versatile</code>).</li>
                <li><strong>Commitment & Promise Extraction</strong>: Detecting promises made by you or counterparts, validated by exact evidence quotes (<code className="font-mono text-[11px]">llama-3.3-70b-versatile</code>).</li>
                <li><strong>Triage & Urgency Scoring</strong>: Multi-dimensional urgency/importance scoring and spam/suspicious classification suggestions.</li>
                <li><strong>Contextual Reply Drafts & Compose Assist</strong>: Reviewable reply drafts with tone and language (English/Hindi) controls (<code className="font-mono text-[11px]">llama-3.1-8b-instant</code>).</li>
                <li><strong>Daily Business Brief & Chrome Companion</strong>: Action triage presented in the web workspace and Chrome side panel companion.</li>
              </ul>
            </div>
            <p className="font-semibold text-xs text-slate-900 dark:text-white pt-1">Data Transmission & Privacy Safeguards:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Zero Public Model Training</strong>: Customer email text is never utilized to train, retrain, or fine-tune public, open-source, or third-party foundational models.</li>
              <li><strong>Zero Credential Transmission</strong>: OAuth tokens, passwords, and private authentication keys are never transmitted to AI providers. Only the active email thread subject and body are evaluated.</li>
              <li><strong>Inference Data Retention</strong>: Groq states inference data is not retained by default; temporary retention is strictly for operational infrastructure reliability. Refer directly to <a href="https://console.groq.com/docs/your-data" target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 underline font-mono text-xs">Groq’s Customer Data Policy</a>.</li>
              <li><strong>Strict User Consent & Instant Opt-Out</strong>: AI processing is governed strictly by user consent. You can disable AI processing at any time in <em>Settings &gt; Privacy &amp; Security &gt; AI Processing Consent</em>. When consent is disabled, the backend rejects AI requests immediately with an <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">AI_CONSENT_REQUIRED</code> error before any HTTP request leaves our servers—guaranteeing that zero email content reaches Groq.</li>
            </ul>
          </div>
        </div>

        {/* Section 6: Retention & Deletion */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            6. Retention, Export & Deletion
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              Users may delete drafts, remove connected accounts, and request account deletion.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              [OWNER CONFIRMATION REQUIRED: Formulate formal SLA for automated database backup retention cycles and account purge timelines].
            </p>
          </div>
        </div>

        {/* Section 7: Contact */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
          <p>Product: JIOSI Inbox · Brand Attribution: by Shivsastra · Publisher: Shivsastra · <span className="font-mono text-brand-600 dark:text-brand-400">privacy@jiosi.online</span></p>
        </div>
      </div>
    </div>
  );
};

