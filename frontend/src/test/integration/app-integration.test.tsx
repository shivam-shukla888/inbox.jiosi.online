import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../../App';

describe('JIOSI Inbox Application Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders the complete 3-panel workspace on initial load', () => {
    render(<App />);

    // 1. Sidebar Brand
    expect(screen.getByText('JIOSI Inbox')).toBeInTheDocument();
    const newMsgButtons = screen.getAllByRole('button', { name: /new message/i });
    expect(newMsgButtons.length).toBeGreaterThan(0);

    // 2. Navigation items
    expect(screen.getAllByRole('button', { name: /needs reply/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /starred/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /snoozed/i }).length).toBeGreaterThan(0);

    // 3. Email detail pane & list populated with initial email
    const subjectMatches = screen.getAllByText(/Q3 Seed Extension Term Sheet/i);
    expect(subjectMatches.length).toBeGreaterThan(0);
  });

  it('switches between folders and updates the displayed threads', () => {
    render(<App />);

    // Click Needs Reply folder in sidebar
    const needsReplyNav = screen.getAllByRole('button', { name: /needs reply/i })[0];
    fireEvent.click(needsReplyNav);

    // Threads in Needs Reply should be present
    expect(screen.getAllByText('Sarah Jenkins').length).toBeGreaterThan(0);
    expect(screen.getAllByText('David Vance').length).toBeGreaterThan(0);

    // Click Starred folder in sidebar
    const starredNav = screen.getAllByRole('button', { name: /starred/i })[0];
    fireEvent.click(starredNav);

    // Starred email present
    expect(screen.getAllByText('Sarah Jenkins').length).toBeGreaterThan(0);
  });

  it('filters emails in real-time when typing in search input', () => {
    render(<App />);

    const searchInput = screen.getByPlaceholderText(/search emails, subjects, or commands/i);
    fireEvent.change(searchInput, { target: { value: 'David Vance' } });

    // David Vance should be displayed, others filtered out
    expect(screen.getAllByText('David Vance').length).toBeGreaterThan(0);
    expect(screen.queryByText('Stripe Billing')).not.toBeInTheDocument();
  });

  it('toggles dark theme and updates documentElement and localStorage', () => {
    render(<App />);

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

  it('navigates to Settings and switches between settings tabs', () => {
    render(<App />);

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
});
