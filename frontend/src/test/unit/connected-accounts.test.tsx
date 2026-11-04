import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectedAccountsView } from '../../components/settings/ConnectedAccountsView';
import { apiClient, AuthSessionData } from '../../api/client';
import { GmailStatusData, GmailMessagesPageData } from '../../types/email';

describe('ConnectedAccountsView Component & Gmail Flow Tests', () => {
  const mockUser: AuthSessionData = {
    token: 'jwt-mock-token',
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'alex@jiosi.online',
    fullName: 'Alex Rivera',
    avatarUrl: 'https://example.com/avatar.png',
    defaultWorkspaceId: '22222222-2222-2222-2222-222222222222',
    defaultWorkspaceName: "Alex's Workspace",
    role: 'OWNER',
  };

  let assignedHref = '';

  beforeEach(() => {
    vi.restoreAllMocks();
    assignedHref = '';
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        get href() {
          return assignedHref;
        },
        set href(val: string) {
          assignedHref = val;
        },
      },
    });
  });

  it('renders "Not Connected" when Gmail status is not connected', async () => {
    const disconnectedStatus: GmailStatusData = {
      connected: false,
      provider: 'gmail',
      status: 'DISCONNECTED',
      email: null,
      lastSyncAt: null,
    };
    vi.spyOn(apiClient, 'getGmailStatus').mockResolvedValue(disconnectedStatus);

    render(<ConnectedAccountsView user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Not Connected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Connect Gmail/i })).toBeInTheDocument();
    });
  });

  it('renders "Connected" and account email when Gmail status is connected', async () => {
    const connectedStatus: GmailStatusData = {
      connected: true,
      provider: 'gmail',
      status: 'CONNECTED',
      email: 'work.email@gmail.com',
      lastSyncAt: new Date().toISOString(),
    };
    vi.spyOn(apiClient, 'getGmailStatus').mockResolvedValue(connectedStatus);

    render(<ConnectedAccountsView user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('work.email@gmail.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sync Now/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
    });
  });

  it('initiates Gmail OAuth connection and navigates to returned connectUrl', async () => {
    const disconnectedStatus: GmailStatusData = {
      connected: false,
      provider: 'gmail',
      status: 'DISCONNECTED',
    };
    vi.spyOn(apiClient, 'getGmailStatus').mockResolvedValue(disconnectedStatus);
    const mockConnectUrl = 'https://inbox.jiosi.online/oauth2/authorization/google?action=connect_gmail';
    vi.spyOn(apiClient, 'getGmailConnectUrl').mockResolvedValue({ connectUrl: mockConnectUrl });

    const onNotify = vi.fn();
    render(<ConnectedAccountsView onNotify={onNotify} user={mockUser} />);

    const connectButton = await screen.findByRole('button', { name: /Connect Gmail/i });
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(window.location.href).toBe(mockConnectUrl);
      expect(onNotify).toHaveBeenCalledWith(
        'Requesting secure Google OAuth authorization for Gmail...',
        'info'
      );
    });
  });

  it('handles empty connectUrl from backend and displays user-friendly error', async () => {
    vi.spyOn(apiClient, 'getGmailStatus').mockResolvedValue({ connected: false, provider: 'gmail', status: 'DISCONNECTED' });
    vi.spyOn(apiClient, 'getGmailConnectUrl').mockResolvedValue({ connectUrl: '' });

    const onNotify = vi.fn();
    render(<ConnectedAccountsView onNotify={onNotify} user={mockUser} />);

    const connectButton = await screen.findByRole('button', { name: /Connect Gmail/i });
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(onNotify).toHaveBeenCalledWith('No authorization URL returned by server', 'error');
      expect(window.location.href).toBe('');
    });
  });

  it('handles backend error during connectUrl request', async () => {
    vi.spyOn(apiClient, 'getGmailStatus').mockResolvedValue({ connected: false, provider: 'gmail', status: 'DISCONNECTED' });
    vi.spyOn(apiClient, 'getGmailConnectUrl').mockRejectedValue(new Error('Workspace access denied'));

    const onNotify = vi.fn();
    render(<ConnectedAccountsView onNotify={onNotify} user={mockUser} />);

    const connectButton = await screen.findByRole('button', { name: /Connect Gmail/i });
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(onNotify).toHaveBeenCalledWith('Workspace access denied', 'error');
    });
  });

  it('binds user defaultWorkspaceId if apiClient workspaceId is unset', async () => {
    vi.spyOn(apiClient, 'getGmailStatus').mockResolvedValue({ connected: false, provider: 'gmail', status: 'DISCONNECTED' });
    apiClient.setWorkspaceId('');
    expect(apiClient.getWorkspaceId()).toBe('');

    vi.spyOn(apiClient, 'getGmailConnectUrl').mockResolvedValue({
      connectUrl: 'https://inbox.jiosi.online/oauth2/authorization/google?action=connect_gmail',
    });

    render(<ConnectedAccountsView user={mockUser} />);
    const connectButton = await screen.findByRole('button', { name: /Connect Gmail/i });
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(apiClient.getWorkspaceId()).toBe(mockUser.defaultWorkspaceId);
    });
  });

  it('disconnects Gmail account upon user confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(apiClient, 'getGmailStatus').mockResolvedValue({
      connected: true,
      provider: 'gmail',
      status: 'CONNECTED',
      email: 'work@gmail.com',
    });
    const disconnectSpy = vi.spyOn(apiClient, 'disconnectGmail').mockResolvedValue({
      success: true,
      status: 'DISCONNECTED',
    });

    const onNotify = vi.fn();
    render(<ConnectedAccountsView onNotify={onNotify} user={mockUser} />);

    const disconnectButton = await screen.findByRole('button', { name: /Disconnect/i });
    fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(disconnectSpy).toHaveBeenCalled();
      expect(onNotify).toHaveBeenCalledWith('Gmail account disconnected and tokens securely revoked.', 'info');
      expect(screen.getByText('Not Connected')).toBeInTheDocument();
    });
  });

  it('synchronizes Gmail inbox messages when connected', async () => {
    vi.spyOn(apiClient, 'getGmailStatus').mockResolvedValue({
      connected: true,
      provider: 'gmail',
      status: 'CONNECTED',
      email: 'work@gmail.com',
    });
    const mockMessages: GmailMessagesPageData = {
      messages: [
        {
          id: 'msg-1',
          threadId: 'th-1',
          subject: 'Test Subject',
          senderName: 'Sender',
          senderEmail: 'sender@example.com',
          recipientEmail: 'work@gmail.com',
          snippet: 'Snippet...',
          receivedAt: new Date().toISOString(),
          isUnread: true,
          isStarred: false,
          labelIds: ['INBOX'],
        },
      ],
      resultSizeEstimate: 1,
    };
    const syncSpy = vi.spyOn(apiClient, 'getGmailMessages').mockResolvedValue(mockMessages);

    const onNotify = vi.fn();
    render(<ConnectedAccountsView onNotify={onNotify} user={mockUser} />);

    const syncButton = await screen.findByRole('button', { name: /Sync Now/i });
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledWith(15);
      expect(onNotify).toHaveBeenCalledWith('Successfully synchronized 1 messages from Gmail Inbox.', 'success');
    });
  });
});
