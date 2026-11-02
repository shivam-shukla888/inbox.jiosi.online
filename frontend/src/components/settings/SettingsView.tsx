import React, { useState } from 'react';
import {
  Settings,
  Link2,
  Bell,
  Sun,
  Moon,
  Keyboard,
  Shield,
  CreditCard,
  ArrowLeft,
  Download
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Kbd } from '../ui/Kbd';
import { ConnectedAccountsView } from './ConnectedAccountsView';
import { SettingsTab } from '../../types/email';

interface SettingsViewProps {
  initialTab?: SettingsTab;
  onBackToMail: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialTab = 'general',
  onBackToMail,
  isDark,
  onToggleTheme,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Form states
  const [displayName, setDisplayName] = useState('Alex Rivera');
  const [workspaceName, setWorkspaceName] = useState('JIOSI AI');
  const [emailSignature, setEmailSignature] = useState(
    'Best regards,\nAlex Rivera\nFounder & CEO, JIOSI AI\nhttps://jiosi.online'
  );
  const [defaultTone, setDefaultTone] = useState<'professional' | 'friendly' | 'concise'>(
    'professional'
  );

  // Notifications
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [desktopPush, setDesktopPush] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  // Privacy
  const [zeroRetention, setZeroRetention] = useState(true);
  const [optOutTraining, setOptOutTraining] = useState(true);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'accounts', label: 'Connected Accounts', icon: <Link2 className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Sun className="w-4 h-4" /> },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing & Plan', icon: <CreditCard className="w-4 h-4" /> },
  ];

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onNotify?.('Preferences updated successfully.', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-canvas-dark overflow-hidden">
      {/* Settings Top Header */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToMail}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Inbox
          </Button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Settings & Workspace
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand">Workspace Admin</Badge>
        </div>
      </div>

      {/* Main Settings Split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Secondary Navigation */}
        <div className="w-full md:w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 shrink-0 overflow-y-auto">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-3xl">
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  General Preferences
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure your workspace identity, author signature, and AI response style.
                </p>
              </div>

              <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Workspace Organization
                  </label>
                  <Input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Company or organization"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Preferred AI Reply Tone
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['professional', 'friendly', 'concise'] as const).map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setDefaultTone(tone)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border capitalize transition-all cursor-pointer ${
                          defaultTone === tone
                            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-600'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Signature
                  </label>
                  <textarea
                    rows={4}
                    value={emailSignature}
                    onChange={(e) => setEmailSignature(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs rounded-lg border border-slate-200 dark:border-slate-700/80 focus:border-brand-500 focus:outline-none p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="brand" size="md" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'accounts' && <ConnectedAccountsView onNotify={onNotify} />}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Notification & Urgency Alerts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage how JIOSI notifies you of incoming high-priority and actionable emails.
                </p>
              </div>

              <div className="space-y-3 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Red Action Indicator for "Needs Reply"
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Show an urgent red dot badge when incoming mail requires your explicit reply.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={urgentAlerts}
                    onChange={(e) => setUrgentAlerts(e.target.checked)}
                    className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Desktop Push Notifications
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Receive instant browser notifications for VIP and important senders.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={desktopPush}
                    onChange={(e) => setDesktopPush(e.target.checked)}
                    className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Sound Effects
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Play a subtle chime upon successfully archiving or sending an email.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Appearance & Theme
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Customize the look and feel of your JIOSI Inbox workspace. Both light and dark modes are tailored for high focus.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Theme Card */}
                <button
                  type="button"
                  onClick={() => {
                    if (isDark) onToggleTheme();
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    !isDark
                      ? 'border-brand-500 ring-2 ring-brand-500/20 bg-white shadow-card'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      <Sun className="w-4 h-4 text-amber-500" /> Light Theme
                    </span>
                    {!isDark && (
                      <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="h-20 rounded-lg bg-slate-100 border border-slate-200 p-2 space-y-1.5">
                    <div className="w-2/3 h-2 rounded bg-slate-300" />
                    <div className="w-full h-2 rounded bg-slate-200" />
                    <div className="w-4/5 h-2 rounded bg-slate-200" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2.5">
                    Crisp white primary surfaces with subtle slate dividers and deep charcoal typography.
                  </p>
                </button>

                {/* Dark Theme Card */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isDark) onToggleTheme();
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isDark
                      ? 'border-brand-500 ring-2 ring-brand-500/20 bg-slate-900 shadow-card'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      <Moon className="w-4 h-4 text-indigo-400" /> Dark Theme
                    </span>
                    {isDark && (
                      <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="h-20 rounded-lg bg-slate-950 border border-slate-800 p-2 space-y-1.5">
                    <div className="w-2/3 h-2 rounded bg-slate-700" />
                    <div className="w-full h-2 rounded bg-slate-800" />
                    <div className="w-4/5 h-2 rounded bg-slate-800" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2.5">
                    Deep charcoal background (#0B0F17) with lighter panel surfaces and indigo accents.
                  </p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Keyboard Shortcuts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Speed through your inbox with keyboard-first navigation inspired by Superhuman & Linear.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Action</th>
                      <th className="px-4 py-2.5 font-medium text-right">Shortcut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                    <tr>
                      <td className="px-4 py-2.5">Next Email / Move Down</td>
                      <td className="px-4 py-2.5 text-right"><Kbd>J</Kbd> or <Kbd>↓</Kbd></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Previous Email / Move Up</td>
                      <td className="px-4 py-2.5 text-right"><Kbd>K</Kbd> or <Kbd>↑</Kbd></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Compose New Message</td>
                      <td className="px-4 py-2.5 text-right"><Kbd>C</Kbd></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Global Search & Command Palette</td>
                      <td className="px-4 py-2.5 text-right"><Kbd>⌘K</Kbd> or <Kbd>Ctrl+K</Kbd></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Archive Selected Email</td>
                      <td className="px-4 py-2.5 text-right"><Kbd>E</Kbd></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Reply to Thread</td>
                      <td className="px-4 py-2.5 text-right"><Kbd>R</Kbd></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Send Draft Immediately</td>
                      <td className="px-4 py-2.5 text-right"><Kbd>⌘↵</Kbd> or <Kbd>Ctrl+Enter</Kbd></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Snooze Thread</td>
                      <td className="px-4 py-2.5 text-right"><Kbd>H</Kbd></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Close / Dismiss Active Modal</td>
                      <td className="px-4 py-2.5 text-right"><Kbd>ESC</Kbd></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Privacy & Data Security
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  JIOSI is built with strict zero-retention principles. Your private communications remain confidential.
                </p>
              </div>

              <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Zero-Retention AI Processing
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Summaries and drafts are computed in transient memory; raw emails are never retained by third-party model providers.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={zeroRetention}
                    onChange={(e) => setZeroRetention(e.target.checked)}
                    className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      AI Model Training Opt-Out
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Explicitly prohibit the use of your email metadata and tone patterns for model retraining.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={optOutTraining}
                    onChange={(e) => setOptOutTraining(e.target.checked)}
                    className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Compliance & Encryption
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    SOC 2 Type II compliant controls, TLS 1.3 transport encryption, and client-isolated Postgres row-level security.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Subscription & Billing
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage your plan, payment methods, and download official invoices.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Current Plan
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      Team Enterprise Scale
                    </h3>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    $1,420
                  </span>
                  <span className="text-xs text-slate-500">/ billed annually</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Next renewal date: <span className="font-semibold">December 1, 2026</span> via Mastercard ending in <span className="font-mono">4242</span>.
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNotify?.('Opening Stripe Customer Portal...', 'info')}
                  >
                    Manage Payment Method
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNotify?.('Downloading latest tax invoice (PDF)...', 'success')}
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download Invoice
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
