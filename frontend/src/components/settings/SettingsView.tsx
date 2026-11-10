import React, { useState } from 'react';
import {
  Settings,
  Link2,
  Bell,
  Sun,
  Keyboard,
  Shield,
  CreditCard,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Kbd } from '../ui/Kbd';
import { ConnectedAccountsView } from './ConnectedAccountsView';
import { SettingsTab } from '../../types/email';
import { AuthSessionData, apiClient } from '../../api/client';

interface SettingsViewProps {
  initialTab?: SettingsTab;
  onBackToMail: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  user?: AuthSessionData | null;
  onSyncSuccess?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialTab = 'general',
  onBackToMail,
  isDark,
  onToggleTheme,
  onNotify,
  user,
  onSyncSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Form states
  const [displayName, setDisplayName] = useState(user?.fullName || 'Authenticated User');
  const [workspaceName, setWorkspaceName] = useState(user?.defaultWorkspaceName || 'Primary Workspace');
  const [emailSignature, setEmailSignature] = useState(
    `Best regards,\n${user?.fullName || 'User'}\nJIOSI Inbox by Shivsastra\nhttps://jiosi.online`
  );
  const [defaultTone, setDefaultTone] = useState<'professional' | 'friendly' | 'concise'>(
    'professional'
  );

  // Notifications
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [desktopPush, setDesktopPush] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  // Privacy & AI
  const [zeroRetention, setZeroRetention] = useState(true);
  const [optOutTraining, setOptOutTraining] = useState(true);
  const [aiConsent, setAiConsent] = useState(true);
  const [aiLanguage, setAiLanguage] = useState('match_thread');

  // Load preferences from backend on mount
  React.useEffect(() => {
    apiClient.getAiPreferences().then((prefs) => {
      setAiConsent(prefs.aiProcessingConsent);
      if (prefs.defaultReplyTone) setDefaultTone(prefs.defaultReplyTone as 'professional' | 'friendly' | 'concise');
      if (prefs.defaultReplyLanguage) setAiLanguage(prefs.defaultReplyLanguage);
    }).catch(() => {
      // Offline fallback
    });
  }, []);

  const handleToggleAiConsent = async (enabled: boolean) => {
    setAiConsent(enabled);
    try {
      await apiClient.updateAiPreferences(enabled, defaultTone, aiLanguage);
      onNotify?.(enabled ? 'Groq AI processing enabled.' : 'Groq AI processing disabled. AI features paused.', 'info');
    } catch {
      onNotify?.('Failed to update AI preferences on server.', 'error');
    }
  };

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
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-canvas-dark overflow-hidden font-sans">
      {/* Settings Top Header */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToMail}
            icon={<ArrowLeft className="w-4 h-4" />}
            className="font-ui"
          >
            Back to Inbox
          </Button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="text-sm font-ui font-bold text-slate-900 dark:text-slate-100">
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-ui font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-jiosi-selected text-jiosi-indigo dark:bg-slate-800 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-jiosi-indigo dark:text-indigo-400' : 'text-slate-400'}>
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
                <h2 className="text-base font-ui font-bold text-slate-900 dark:text-slate-100">
                  General Preferences
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
                  Configure your workspace identity, author signature, and AI response style.
                </p>
              </div>

              <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <label className="block text-xs font-ui font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-ui font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Workspace Name
                  </label>
                  <Input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Workspace name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-ui font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Signature
                  </label>
                  <textarea
                    rows={4}
                    value={emailSignature}
                    onChange={(e) => setEmailSignature(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm rounded-xl p-3 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-jiosi-indigo/20 focus:border-jiosi-indigo font-light"
                  />
                </div>

                <div>
                  <label className="block text-xs font-ui font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Default AI Tone
                  </label>
                  <div className="flex gap-2">
                    {(['professional', 'friendly', 'concise'] as const).map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setDefaultTone(tone)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-ui capitalize transition-colors cursor-pointer ${
                          defaultTone === tone
                            ? 'bg-jiosi-indigo text-white font-medium'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="brand" size="sm" className="font-ui">
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-ui font-bold text-slate-900 dark:text-slate-100">
                  Connected Accounts & Integrations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
                  Manage external email inboxes synced to your JIOSI Inbox workspace.
                </p>
              </div>

              <ConnectedAccountsView onNotify={onNotify} user={user} onSyncSuccess={onSyncSuccess} />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-ui font-bold text-slate-900 dark:text-slate-100">
                  Notification Controls
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
                  Choose when and how JIOSI notifies you of incoming threads and urgent replies.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                      Needs Reply urgent alerts
                    </p>
                    <p className="text-[11px] text-slate-500 font-light">
                      Visual highlight and instant notification for emails detected as actionable.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={urgentAlerts}
                    onChange={(e) => setUrgentAlerts(e.target.checked)}
                    className="w-4 h-4 text-jiosi-indigo rounded focus:ring-jiosi-indigo cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                      Desktop Push Notifications
                    </p>
                    <p className="text-[11px] text-slate-500 font-light">
                      Show OS banners when important messages arrive.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={desktopPush}
                    onChange={(e) => setDesktopPush(e.target.checked)}
                    className="w-4 h-4 text-jiosi-indigo rounded focus:ring-jiosi-indigo cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                      Audio Chimes
                    </p>
                    <p className="text-[11px] text-slate-500 font-light">
                      Subtle sound effect on successful mail send and archive.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="w-4 h-4 text-jiosi-indigo rounded focus:ring-jiosi-indigo cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-ui font-bold text-slate-900 dark:text-slate-100">
                  Interface Appearance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
                  Tailor the theme and visual density to your preferences.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                      Theme Selection
                    </p>
                    <p className="text-[11px] text-slate-500 font-light">
                      Currently using {isDark ? 'Dark Theme' : 'Light Theme'}.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onToggleTheme}
                    icon={isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Sun className="w-3.5 h-3.5 text-slate-600" />}
                    className="font-ui"
                  >
                    Switch to {isDark ? 'Light Theme' : 'Dark Theme'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-ui font-bold text-slate-900 dark:text-slate-100">
                  Keyboard Shortcuts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
                  Master high-velocity navigation with Superhuman and Vim shortcut parity.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Navigate down</span>
                    <Kbd>J</Kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Navigate up</span>
                    <Kbd>K</Kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Archive message</span>
                    <Kbd>E</Kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Reply to message</span>
                    <Kbd>R</Kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Compose new message</span>
                    <Kbd>C</Kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Snooze message</span>
                    <Kbd>H</Kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Command Palette</span>
                    <Kbd>⌘K</Kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">Send message</span>
                    <Kbd>⌘↵</Kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-ui font-bold text-slate-900 dark:text-slate-100">
                  Privacy, AI Governance & Cryptographic Security
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
                  Strict multi-tenant guarantees, explicit Groq AI consent, and zero surveillance commitments.
                </p>
              </div>

              {/* Groq AI Consent Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-jiosi-violet shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                        Groq AI Email Intelligence Processing
                      </p>
                      <p className="text-[11px] text-slate-500 font-light leading-relaxed max-w-xl">
                        When enabled, selected thread messages are transmitted over TLS to Groq’s high-velocity inference engine for summarization, action item extraction, triage scoring, and draft composition.
                      </p>
                      <p className="text-[11px] text-slate-400 font-light">
                        Provider Policy: Groq states inference data is not retained by default, while limited temporary retention may occur for reliability or abuse investigation.{' '}
                        <a
                          href="https://console.groq.com/docs/your-data"
                          target="_blank"
                          rel="noreferrer"
                          className="text-jiosi-indigo hover:underline font-mono text-[10px]"
                        >
                          Review Groq Data Policy ↗
                        </a>
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiConsent}
                    onChange={(e) => handleToggleAiConsent(e.target.checked)}
                    className="w-4 h-4 text-jiosi-indigo rounded focus:ring-jiosi-indigo cursor-pointer ml-3 mt-1"
                    aria-label="Toggle Groq AI Processing"
                  />
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                        Zero AI Model Training
                      </p>
                      <p className="text-[11px] text-slate-500 font-light mt-0.5 leading-relaxed">
                        Your emails, summaries, and drafts are never used to train public or foundational AI models.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={optOutTraining}
                    onChange={(e) => setOptOutTraining(e.target.checked)}
                    className="w-4 h-4 text-jiosi-indigo rounded focus:ring-jiosi-indigo cursor-pointer ml-3"
                  />
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                        Zero-Retention Query Mode
                      </p>
                      <p className="text-[11px] text-slate-500 font-light mt-0.5 leading-relaxed">
                        Discard ephemeral query vectors immediately following completion.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={zeroRetention}
                    onChange={(e) => setZeroRetention(e.target.checked)}
                    className="w-4 h-4 text-jiosi-indigo rounded focus:ring-jiosi-indigo cursor-pointer ml-3"
                  />
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                      Tenant-Isolated PostgreSQL
                    </p>
                    <p className="text-[11px] text-slate-500 font-light mt-0.5 leading-relaxed">
                      Every database query executes with cryptographic workspace isolation enforced by server interceptors.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                      AES-256-GCM Encrypted OAuth Tokens
                    </p>
                    <p className="text-[11px] text-slate-500 font-light mt-0.5 leading-relaxed">
                      Google OAuth refresh tokens are encrypted at rest and never exposed to the client browser.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-ui font-bold text-slate-900 dark:text-slate-100">
                  Billing & Workspace Plan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
                  Free and open SaaS tier for individual developers and teams.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                      Current Plan: Community Edition
                    </span>
                    <p className="text-[11px] text-slate-500 font-light mt-0.5">
                      Includes unified thread triaging, Google OIDC authentication, and AI summarization.
                    </p>
                  </div>
                  <Badge variant="brand">Free Tier</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Workspace ID: <code className="font-mono text-[10px] text-slate-700 dark:text-slate-300">{user?.defaultWorkspaceId || 'Local Sandbox'}</code></span>
                  <span>Hosted by Shivsastra</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
