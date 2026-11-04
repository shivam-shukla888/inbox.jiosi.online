import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GmailStatusData } from '../../types/email';
import { AuthSessionData, apiClient } from '../../api/client';

interface ConnectedAccountsViewProps {
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  user?: AuthSessionData | null;
  onSyncSuccess?: () => void;
}

export const ConnectedAccountsView: React.FC<ConnectedAccountsViewProps> = ({ onNotify, user, onSyncSuccess }) => {
  const [gmailStatus, setGmailStatus] = useState<GmailStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    setStatusError(null);
    try {
      const res = await apiClient.getGmailStatus();
      if (res && (res.connected !== undefined || res.status)) {
        setGmailStatus(res);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not check Gmail account status';
      setStatusError(message);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnectGmail = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      if (!apiClient.getWorkspaceId() && user?.defaultWorkspaceId) {
        apiClient.setWorkspaceId(user.defaultWorkspaceId);
      }
      onNotify?.('Requesting secure Google OAuth authorization for Gmail...', 'info');
      const res = await apiClient.getGmailConnectUrl();
      if (res?.connectUrl && res.connectUrl.trim().length > 0) {
        window.location.href = res.connectUrl.trim();
      } else {
        throw new Error('No authorization URL returned by server');
      }
    } catch (err: unknown) {
      setIsConnecting(false);
      const msg = err instanceof Error ? err.message : 'Failed to initiate Gmail connection';
      onNotify?.(msg, 'error');
    }
  };

  const handleDisconnectGmail = async () => {
    if (isDisconnecting) return;
    if (!window.confirm('Disconnect your Gmail account from JIOSI Inbox? Tokens stored on the server will be revoked.')) {
      return;
    }
    setIsDisconnecting(true);
    try {
      await apiClient.disconnectGmail();
      setGmailStatus((prev) => prev ? { ...prev, connected: false, status: 'DISCONNECTED' } : null);
      onNotify?.('Gmail account disconnected and tokens securely revoked.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to disconnect Gmail account';
      onNotify?.(msg, 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncGmail = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await apiClient.syncGmail(25);
      setGmailStatus((prev) => prev ? { ...prev, lastSyncAt: new Date().toISOString() } : null);
      if (res && res.newMessagesCount > 0) {
        onNotify?.(`Successfully synchronized ${res.newMessagesCount} new messages from Gmail Inbox.`, 'success');
      } else {
        const count = res?.existingMessagesCount ?? 0;
        onNotify?.(`Gmail inbox is up to date (${count} messages checked).`, 'info');
      }
      onSyncSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to synchronize Gmail inbox';
      onNotify?.(msg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const isConnected = gmailStatus?.connected && gmailStatus?.status === 'CONNECTED';
  const isRevoked = gmailStatus?.status === 'REVOKED';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-ui font-semibold text-slate-900 dark:text-slate-100">
          Connected Email Accounts
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
          Connect your Google Workspace or Gmail account with strictly read-only access to power JIOSI's intelligent triage and inbox view.
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
        <ShieldCheck className="w-5 h-5 text-jiosi-indigo dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-light">
          <span className="font-ui font-semibold text-indigo-950 dark:text-indigo-200">
            Zero-Token Exposure Architecture:
          </span>{' '}
          Strictly read-only. JIOSI Inbox requests only <code className="px-1.5 py-0.5 rounded bg-indigo-100/70 dark:bg-indigo-900/60 text-[11px] font-mono text-indigo-800 dark:text-indigo-200">gmail.readonly</code>. Tokens are encrypted server-side with AES-256-GCM. Sending, deleting, archiving, or altering mailboxes is strictly disabled.
        </div>
      </div>

      {/* Error alert if status check failed */}
      {statusError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{statusError}</span>
          <Button variant="ghost" size="sm" onClick={fetchStatus} className="ml-auto text-xs font-ui">
            Retry
          </Button>
        </div>
      )}

      {/* Gmail Account Card */}
      <div className="space-y-3">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60">
              <Mail className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-ui font-semibold text-slate-900 dark:text-slate-100">
                  Google Workspace / Gmail
                </span>
                <Badge variant="outline">Read-Only</Badge>
                {isLoadingStatus ? (
                  <Badge variant="default">Checking...</Badge>
                ) : isConnected ? (
                  <Badge variant="success" dot>Connected</Badge>
                ) : isRevoked ? (
                  <Badge variant="urgent" dot>Authorization Revoked</Badge>
                ) : (
                  <Badge variant="default">Not Connected</Badge>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {gmailStatus?.email || user?.email || 'No account linked'}
              </p>

              {gmailStatus?.lastSyncAt && isConnected && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-mono">
                  <span>Last synchronized:</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {new Date(gmailStatus.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {isConnected ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSyncGmail}
                  isLoading={isSyncing}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="font-ui"
                >
                  Sync Now
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectGmail}
                  isLoading={isDisconnecting}
                  className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-ui"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="brand"
                size="sm"
                onClick={handleConnectGmail}
                isLoading={isConnecting}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="font-ui"
              >
                {isRevoked ? 'Reconnect Gmail' : 'Connect Gmail'}
              </Button>
            )}
          </div>
        </div>

        {/* Outlook Account Card (Upcoming) */}
        <div className="p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 opacity-75 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60 font-ui">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-ui font-semibold text-slate-700 dark:text-slate-300">
                  Microsoft 365 / Outlook
                </span>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                Exchange Online integration
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" disabled className="font-ui">
            Notify Me
          </Button>
        </div>
      </div>
    </div>
  );
};
