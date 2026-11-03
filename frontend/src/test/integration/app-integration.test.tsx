import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../../App';
import { apiClient, PagedThreadsData } from '../../api/client';
import { DEMO_EMAILS } from '../../data/mockEmails';
import { EmailThread } from '../../types/email';

const createMockPagedData = (threads: EmailThread[] = DEMO_EMAILS): PagedThreadsData => ({
  threads,
  pageNumber: 0,
  pageSize: 25,
  totalElements: threads.length,
  totalPages: 1,
  isFirst: true,
  isLast: true,
  folderCounts: {
    inbox: { total: threads.length, unread: 2 },
    needsReply: { total: 2, unread: 2 },
    starred: 1,
    snoozed: 0,
    sent: 0,
    drafts: 0,
    filterAll: threads.length,
    filterUnread: 2,
    filterNeedsReply: 2,
    filterVip: 1,
  },
});

describe('JIOSI Inbox Application Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();

    // Default mock setup: authenticated & server returns DEMO_EMAILS
    const mockUser = {
      token: 'mock-token',
      userId: 'mock-user-1',
      email: 'alex@jiosi.online',
      fullName: 'Alex Rivera',
      avatarUrl: '',
      defaultWorkspaceId: 'a0000000-0000-0000-0000-000000000001',
      defaultWorkspaceName: 'Primary Workspace',
      role: 'OWNER',
    };
    vi.spyOn(apiClient, 'getMe').mockResolvedValue(mockUser);
    vi.spyOn(apiClient, 'initAuth').mockResolvedValue(mockUser);
    vi.spyOn(apiClient, 'fetchCsrf').mockResolvedValue(undefined);
    vi.spyOn(apiClient, 'fetchThreads').mockResolvedValue(createMockPagedData(DEMO_EMAILS));
  });

  it('renders the complete 3-panel workspace on initial load with real data', async () => {
    render(<App />);

    // 1. Email detail pane & list populated with server threads (waits for session resolution)
    const subjectMatches = await screen.findAllByText(/Q3 Seed Extension Term Sheet/i);
    expect(subjectMatches.length).toBeGreaterThan(0);

    // 2. Sidebar Brand & Attribution
    expect(screen.getAllByText('JIOSI Inbox').length).toBeGreaterThan(0);
    expect(screen.getAllByText('by Shivsastra').length).toBeGreaterThan(0);
    const newMsgButtons = screen.getAllByRole('button', { name: /new message/i });
    expect(newMsgButtons.length).toBeGreaterThan(0);

    // 3. Navigation items
    expect(screen.getAllByRole('button', { name: /needs reply/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /starred/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /snoozed/i }).length).toBeGreaterThan(0);
  });

  it('switches between folders and updates the displayed threads', async () => {
    render(<App />);

    // Wait for initial render
    await screen.findAllByText(/Q3 Seed Extension Term Sheet/i);

    // Click Needs Reply folder in sidebar
    const needsReplyNav = screen.getAllByRole('button', { name: /needs reply/i })[0];
    fireEvent.click(needsReplyNav);

    // Threads in Needs Reply should be present
    expect(await screen.findByText('Sarah Jenkins')).toBeInTheDocument();
    expect(await screen.findByText('David Vance')).toBeInTheDocument();

    // Click Starred folder in sidebar
    const starredNav = screen.getAllByRole('button', { name: /starred/i })[0];
    fireEvent.click(starredNav);

    // Starred email present
    expect(await screen.findByText('Sarah Jenkins')).toBeInTheDocument();
  });

  it('filters emails in real-time when typing in search input', async () => {
    render(<App />);

    await screen.findAllByText(/Q3 Seed Extension Term Sheet/i);

    const searchInput = screen.getByPlaceholderText(/search emails, subjects, or commands/i);
    fireEvent.change(searchInput, { target: { value: 'David Vance' } });

    // David Vance should be displayed, others filtered out
    expect(screen.getAllByText('David Vance').length).toBeGreaterThan(0);
    expect(screen.queryByText('Stripe Billing')).not.toBeInTheDocument();
  });

  it('toggles dark theme and updates documentElement and localStorage', async () => {
    render(<App />);

    await screen.findAllByText(/Q3 Seed Extension Term Sheet/i);

    const themeToggleBtn = screen.getByRole('button', { name: /switch to dark theme/i });
    fireEvent.click(themeToggleBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('jiosi_theme')).toBe('dark');

    // Toggle back to light
    const lightToggleBtn = screen.getByRole('button', { name: /switch to light theme/i });
    fireEvent.click(lightToggleBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('jiosi_theme')).toBe('light');
  });

  it('navigates to Settings and switches between settings tabs', async () => {
    render(<App />);

    await screen.findAllByText(/Q3 Seed Extension Term Sheet/i);

    // Open settings from sidebar
    const settingsBtns = screen.getAllByRole('button', { name: /^settings$/i });
    fireEvent.click(settingsBtns[0]);

    // Verify settings header
    expect(screen.getByText('Settings & Workspace')).toBeInTheDocument();
    expect(screen.getByText('General Preferences')).toBeInTheDocument();

    // Switch to Connected Accounts tab in settings secondary nav
    const accountsButtons = screen.getAllByRole('button', { name: /connected accounts/i });
    const settingsTab = accountsButtons[accountsButtons.length - 1];
    fireEvent.click(settingsTab);

    expect(screen.getByText('Connected Email Accounts')).toBeInTheDocument();
    expect(screen.getByText('Google Workspace / Gmail')).toBeInTheDocument();
    expect(screen.getByText('Zero-Token Exposure Architecture:')).toBeInTheDocument();

    // Click Back to Inbox
    const backBtn = screen.getByRole('button', { name: /back to inbox/i });
    fireEvent.click(backBtn);

    // Returned to inbox
    expect(screen.getAllByRole('button', { name: /new message/i }).length).toBeGreaterThan(0);
  });

  it('renders loaded-empty state when server returns an empty list without showing stale demo data', async () => {
    vi.spyOn(apiClient, 'fetchThreads').mockResolvedValue(createMockPagedData([]));

    render(<App />);

    // Should render the empty state honestly
    expect(await screen.findByText('Inbox Zero')).toBeInTheDocument();

    // Should NOT show any demo emails
    expect(screen.queryByText(/Q3 Seed Extension Term Sheet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/David Vance/i)).not.toBeInTheDocument();
  });

  it('displays honest offline alert when backend API fails and allows entering Demo Preview', async () => {
    vi.spyOn(apiClient, 'fetchThreads').mockRejectedValue(new Error('Network error'));

    render(<App />);

    // Offline alert banner appears
    expect(await screen.findByText(/Unable to reach backend API/i)).toBeInTheDocument();

    // Click "View Demo Mode"
    const demoBtn = screen.getByRole('button', { name: /view demo mode/i });
    fireEvent.click(demoBtn);

    // Demo Mode badge/banner is now visible and demo emails appear
    expect((await screen.findAllByText(/Simulation Preview/i)).length).toBeGreaterThanOrEqual(1);
    expect((await screen.findAllByText(/Q3 Seed Extension Term Sheet/i)).length).toBeGreaterThan(0);
  });

  it('renders full-screen AuthPage when unauthenticated and enters simulation preview from auth screen', async () => {
    vi.spyOn(apiClient, 'getMe').mockRejectedValue(new Error('Unauthenticated'));

    render(<App />);

    // Renders full-screen AuthPage
    expect(await screen.findByText('Your inbox,')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.queryByText(/Q3 Seed Extension Term Sheet/i)).not.toBeInTheDocument();

    // Click "Explore in Simulation Preview"
    const simBtn = screen.getByRole('button', { name: /explore in simulation preview/i });
    fireEvent.click(simBtn);

    // Now enters preview and shows inbox with demo emails
    expect((await screen.findAllByText(/Simulation Preview/i)).length).toBeGreaterThanOrEqual(1);
    expect((await screen.findAllByText(/Q3 Seed Extension Term Sheet/i)).length).toBeGreaterThan(0);
  });

  it('exits Simulation Preview when clicking Exit Preview & Sign In and returns to AuthPage', async () => {
    vi.spyOn(apiClient, 'getMe').mockRejectedValue(new Error('Unauthenticated'));
    vi.spyOn(apiClient, 'logout').mockResolvedValue(undefined);

    render(<App />);

    // Enter simulation preview
    const simBtn = await screen.findByRole('button', { name: /explore in simulation preview/i });
    fireEvent.click(simBtn);

    // Verify simulation banner is visible
    expect((await screen.findAllByText(/Simulation Preview/i)).length).toBeGreaterThanOrEqual(1);

    // Click Exit Preview & Sign In
    const exitBtn = screen.getByRole('button', { name: /exit preview & sign in/i });
    fireEvent.click(exitBtn);

    // Returns to AuthPage
    expect(await screen.findByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.queryByText(/Q3 Seed Extension Term Sheet/i)).not.toBeInTheDocument();
  });
});
