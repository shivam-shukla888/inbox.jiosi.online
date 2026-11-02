import React, { useState } from 'react';
import { RefreshCw, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ConnectedAccountItem } from '../../types/email';

interface ConnectedAccountsViewProps {
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ConnectedAccountsView: React.FC<ConnectedAccountsViewProps> = ({ onNotify }) => {
  const [accounts, setAccounts] = useState<ConnectedAccountItem[]>([
    {
      id: 'acc-1',
      provider: 'gmail',
      email: 'alex@jiosi.online',
      status: 'connected',
      lastSync: '2 mins ago',
      isPrimary: true,
    },
    {
      id: 'acc-2',
      provider: 'outlook',
      email: 'alex.rivera@enterprisepartners.com',
      status: 'available',
      isPrimary: false,
    },
  ]);

  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const handleSync = (id: string) => {
    setIsSyncing(id);
    setTimeout(() => {
      setIsSyncing(null);
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, lastSync: 'Just now' } : acc))
      );
      onNotify?.('Mailbox synchronized successfully.', 'success');
    }, 1200);
  };

  const handleToggleDisconnect = (id: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          const newStatus = acc.status === 'connected' ? 'disconnected' : 'connected';
          const msg =
            newStatus === 'connected'
              ? `Reconnected ${acc.email}`
              : `Disconnected ${acc.email}`;
          onNotify?.(msg, 'info');
          return { ...acc, status: newStatus };
        }
        return acc;
      })
    );
  };

  const handleConnectNew = (provider: 'gmail' | 'outlook') => {
    onNotify?.(
      `Initiating secure OAuth 2.0 flow for ${provider === 'gmail' ? 'Google Workspace' : 'Microsoft 365'}...`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Connected Email Accounts
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Connect your Google Workspace or Microsoft Outlook accounts to power JIOSI's intelligent triage and AI reply drafting.
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-900/60">
        <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-brand-900 dark:text-brand-200">
            Zero-Token Exposure Architecture:
          </span>{' '}
          All OAuth tokens and refresh keys are encrypted server-side using AES-256-GCM. JIOSI client interfaces never store or expose credentials.
        </div>
      </div>

      {/* Account Cards */}
      <div className="space-y-3">
        {accounts.map((acc) => {
          const isGmail = acc.provider === 'gmail';
          return (
            <div
              key={acc.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    isGmail
                      ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
                      : 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60'
                  }`}
                >
                  {isGmail ? 'G' : 'M'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {isGmail ? 'Google Workspace / Gmail' : 'Microsoft 365 / Outlook'}
                    </span>
                    {acc.isPrimary && (
                      <Badge variant="brand">Primary</Badge>
                    )}
                    {acc.status === 'connected' ? (
                      <Badge variant="success" dot>
                        Connected
                      </Badge>
                    ) : acc.status === 'available' ? (
                      <Badge variant="outline">Available</Badge>
                    ) : (
                      <Badge variant="default">Disconnected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {acc.email}
                  </p>
                  {acc.lastSync && acc.status === 'connected' && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <span>Last synchronized:</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        {acc.lastSync}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {acc.status === 'connected' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSync(acc.id)}
                    isLoading={isSyncing === acc.id}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Sync Now
                  </Button>
                )}

                {acc.status === 'available' ? (
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={() => handleConnectNew('outlook')}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Connect
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleDisconnect(acc.id)}
                    className={
                      acc.status === 'connected'
                        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'text-brand-600 dark:text-brand-400'
                    }
                  >
                    {acc.status === 'connected' ? 'Disconnect' : 'Reconnect'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect additional account action */}
      <div className="pt-2">
        <Button
          variant="secondary"
          size="md"
          onClick={() => handleConnectNew('gmail')}
          icon={<Plus className="w-4 h-4" />}
        >
          Connect Another Account (Google or Microsoft)
        </Button>
      </div>
    </div>
  );
};
