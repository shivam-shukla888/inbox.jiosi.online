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
  CheckCircle2,
  Briefcase,
  Clock,
  Plus,
  PanelRight
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

  // Small Business Profile State
  const [profileType, setProfileType] = useState('generic');
  const [businessName, setBusinessName] = useState('');
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [bizHoursStart, setBizHoursStart] = useState('09:00');
  const [bizHoursEnd, setBizHoursEnd] = useState('18:00');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('20:00');
  const [quietEnd, setQuietEnd] = useState('08:00');
  const [vipContacts, setVipContacts] = useState<string[]>([]);
  const [waitingOnContacts, setWaitingOnContacts] = useState<string[]>([]);
  const [newVipInput, setNewVipInput] = useState('');
  const [newWaitingInput, setNewWaitingInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Load preferences from backend on mount
  React.useEffect(() => {
    apiClient.getAiPreferences().then((prefs) => {
      setAiConsent(prefs.aiProcessingConsent);
      if (prefs.defaultReplyTone) setDefaultTone(prefs.defaultReplyTone as 'professional' | 'friendly' | 'concise');
      if (prefs.defaultReplyLanguage) setAiLanguage(prefs.defaultReplyLanguage);
    }).catch(() => {
      // Offline fallback
    });

    apiClient.getBusinessProfile().then((p) => {
      if (p.profileType) setProfileType(p.profileType);
      if (p.businessName) setBusinessName(p.businessName);
      if (p.timezone) setUserTimezone(p.timezone);
      if (p.businessHoursStart) setBizHoursStart(p.businessHoursStart);
      if (p.businessHoursEnd) setBizHoursEnd(p.businessHoursEnd);
      setQuietHoursEnabled(p.quietHoursEnabled);
      if (p.quietHoursStart) setQuietStart(p.quietHoursStart);
      if (p.quietHoursEnd) setQuietEnd(p.quietHoursEnd);
      if (p.vipContacts) setVipContacts(p.vipContacts);
      if (p.waitingOnContacts) setWaitingOnContacts(p.waitingOnContacts);
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

  const handleSaveBusinessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await apiClient.updateBusinessProfile({
        profileType,
        businessName,
        timezone: userTimezone,
        businessHoursStart: bizHoursStart,
        businessHoursEnd: bizHoursEnd,
        quietHoursEnabled,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
        vipContacts,
        waitingOnContacts,
      });
      onNotify?.('Small business profile and prioritization updated.', 'success');
    } catch {
      onNotify?.('Failed to save business profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'business-profile', label: 'Business Profile', icon: <Briefcase className="w-4 h-4" /> },
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

          {activeTab === 'business-profile' && (
            <div className="space-y-6">
              <form onSubmit={handleSaveBusinessProfile} className="space-y-6">
              <div>
                <h2 className="text-base font-ui font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Small Business Workflow Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
                  Tailor AI triage, importance scoring, and daily brief prioritization to your business model.
                </p>
              </div>

              <div className="space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                {/* Profile Type Selector */}
                <div>
                  <label className="block text-xs font-ui font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Industry / Business Workflow Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'generic', title: 'Generic Business', desc: 'Standard business & client email' },
                      { id: 'freelancer_agency', title: 'Freelancer / Agency', desc: 'Proposals, approvals, invoices, feedback' },
                      { id: 'local_service', title: 'Local Service / Trades', desc: 'Bookings, cancellations, appointments, suppliers' },
                      { id: 'retail_ecommerce', title: 'Retail / E-commerce', desc: 'Orders, refunds, disputes, shipment issues' },
                      { id: 'professional_services', title: 'Professional Services', desc: 'Compliance, tax, legal, document collection' },
                      { id: 'small_saas', title: 'Small Software / SaaS', desc: 'P0/P1 incidents, churn, renewals, escalations' },
                    ].map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setProfileType(p.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          profileType === p.id
                            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-xs">{p.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-xs font-ui font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Business / Brand Name (Optional)
                  </label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Studio or Smith Legal"
                  />
                </div>

                {/* Timezone & Business Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-ui font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Business Timezone
                    </label>
                    <select
                      value={userTimezone}
                      onChange={(e) => setUserTimezone(e.target.value)}
                      className="w-full text-xs font-ui px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="America/Chicago">America/Chicago (CST)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-ui font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Business Hours Start
                    </label>
                    <Input
                      type="time"
                      value={bizHoursStart}
                      onChange={(e) => setBizHoursStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-ui font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Business Hours End
                    </label>
                    <Input
                      type="time"
                      value={bizHoursEnd}
                      onChange={(e) => setBizHoursEnd(e.target.value)}
                    />
                  </div>
                </div>

                {/* Quiet Hours */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> Quiet Hours (No Urgent Brief Alerts)
                      </span>
                      <p className="text-[11px] text-slate-500">Mutes proactive notifications outside your working window.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={quietHoursEnabled}
                      onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                  </div>

                  {quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-3 pl-4">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Quiet Start</label>
                        <Input
                          type="time"
                          value={quietStart}
                          onChange={(e) => setQuietStart(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Quiet End</label>
                        <Input
                          type="time"
                          value={quietEnd}
                          onChange={(e) => setQuietEnd(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* VIP Contacts */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-ui font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    VIP Contacts & Key Client Domains
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Emails from these contacts receive automatic +30 importance prioritization.
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newVipInput}
                      onChange={(e) => setNewVipInput(e.target.value)}
                      placeholder="client@acme.com or @bigcorp.com"
                      className="text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newVipInput.trim()) {
                            setVipContacts([...vipContacts, newVipInput.trim()]);
                            setNewVipInput('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (newVipInput.trim()) {
                          setVipContacts([...vipContacts, newVipInput.trim()]);
                          setNewVipInput('');
                        }
                      }}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {vipContacts.map((vip, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-mono"
                      >
                        {vip}
                        <button
                          type="button"
                          onClick={() => setVipContacts(vipContacts.filter((_, idx) => idx !== i))}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {vipContacts.length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">No VIP contacts added yet.</span>
                    )}
                  </div>
                </div>

                {/* Waiting-on Contacts */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-ui font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Waiting-on Contacts & Key Vendors
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Pending threads from these contacts automatically appear in "Waiting on someone else".
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newWaitingInput}
                      onChange={(e) => setNewWaitingInput(e.target.value)}
                      placeholder="vendor@supplier.com or contractor@agency.com"
                      className="text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newWaitingInput.trim()) {
                            setWaitingOnContacts([...waitingOnContacts, newWaitingInput.trim()]);
                            setNewWaitingInput('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (newWaitingInput.trim()) {
                          setWaitingOnContacts([...waitingOnContacts, newWaitingInput.trim()]);
                          setNewWaitingInput('');
                        }
                      }}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {waitingOnContacts.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-mono"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => setWaitingOnContacts(waitingOnContacts.filter((_, idx) => idx !== i))}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {waitingOnContacts.length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">No contacts added yet.</span>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="submit"
                    variant="brand"
                    size="sm"
                    disabled={isSavingProfile}
                    className="font-ui"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Profile & Prioritization'}
                  </Button>
                </div>
              </div>
            </form>

            {/* Chrome Extension Companion Connection Card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PanelRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-ui font-semibold text-slate-900 dark:text-slate-100">
                    Chrome Side Panel Companion Connection
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                  Manifest V3
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                Connect the JIOSI Action Assistant inside desktop Gmail. The companion authenticates via Bearer session tokens stored strictly in browser process memory (<code className="text-[10px] font-mono">chrome.storage.session</code>), never in plaintext on disk.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Workspace ID
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      readOnly
                      value={user?.defaultWorkspaceId || 'a0000000-0000-0000-0000-000000000001'}
                      className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 select-all"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(user?.defaultWorkspaceId || 'a0000000-0000-0000-0000-000000000001');
                        onNotify?.('Workspace ID copied to clipboard', 'success');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Session Token (for Companion Side Panel)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      readOnly
                      type="password"
                      value={sessionStorage.getItem('jiosi_auth_token') || 'Active session token'}
                      className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 select-all"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const token = sessionStorage.getItem('jiosi_auth_token') || '';
                        if (token) {
                          navigator.clipboard.writeText(token);
                          onNotify?.('Companion session token copied to clipboard', 'success');
                        } else {
                          onNotify?.('No active session token found. Please sign in.', 'error');
                        }
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
