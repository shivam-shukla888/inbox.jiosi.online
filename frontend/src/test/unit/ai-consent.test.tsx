import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsView } from '../../components/settings/SettingsView';
import { apiClient } from '../../api/client';

describe('AI Processing Consent & Explicit Opt-In Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults AI consent toggle to false for new users with explicit opt-in policy', async () => {
    vi.spyOn(apiClient, 'getAiPreferences').mockResolvedValue({
      aiProcessingConsent: false,
      defaultReplyTone: 'professional',
      defaultReplyLanguage: 'match_thread',
      serviceConfigured: true,
    });
    vi.spyOn(apiClient, 'getBusinessProfile').mockResolvedValue({
      profileType: 'generic',
      businessName: '',
      timezone: 'UTC',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      quietHoursEnabled: true,
      quietHoursStart: '20:00',
      quietHoursEnd: '08:00',
      vipContacts: [],
      waitingOnContacts: [],
      dailyBriefTime: '08:00',
      summaryLanguage: 'en',
    });

    render(
      <SettingsView
        initialTab="privacy"
        onBackToMail={vi.fn()}
        isDark={false}
        onToggleTheme={vi.fn()}
      />
    );

    const toggle = screen.getByLabelText(/Toggle Groq AI Processing/i) as HTMLInputElement;
    await waitFor(() => {
      expect(toggle.checked).toBe(false);
    });

    expect(screen.getByText(/Groq AI Email Intelligence Processing/i)).toBeInTheDocument();
    expect(screen.getByText(/Strict explicit opt-in required \(disabled by default\)/i)).toBeInTheDocument();
  });

  it('reflects checked state when user has previously given explicit consent', async () => {
    vi.spyOn(apiClient, 'getAiPreferences').mockResolvedValue({
      aiProcessingConsent: true,
      defaultReplyTone: 'friendly',
      defaultReplyLanguage: 'en',
      serviceConfigured: true,
    });
    vi.spyOn(apiClient, 'getBusinessProfile').mockResolvedValue({
      profileType: 'generic',
      businessName: '',
      timezone: 'UTC',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      quietHoursEnabled: true,
      quietHoursStart: '20:00',
      quietHoursEnd: '08:00',
      vipContacts: [],
      waitingOnContacts: [],
      dailyBriefTime: '08:00',
      summaryLanguage: 'en',
    });

    render(
      <SettingsView
        initialTab="privacy"
        onBackToMail={vi.fn()}
        isDark={false}
        onToggleTheme={vi.fn()}
      />
    );

    const toggle = screen.getByLabelText(/Toggle Groq AI Processing/i) as HTMLInputElement;
    await waitFor(() => {
      expect(toggle.checked).toBe(true);
    });
  });

  it('enabling consent invokes apiClient.updateAiPreferences with true and notifies user', async () => {
    vi.spyOn(apiClient, 'getAiPreferences').mockResolvedValue({
      aiProcessingConsent: false,
      defaultReplyTone: 'professional',
      defaultReplyLanguage: 'match_thread',
      serviceConfigured: true,
    });
    vi.spyOn(apiClient, 'getBusinessProfile').mockResolvedValue({
      profileType: 'generic',
      businessName: '',
      timezone: 'UTC',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      quietHoursEnabled: true,
      quietHoursStart: '20:00',
      quietHoursEnd: '08:00',
      vipContacts: [],
      waitingOnContacts: [],
      dailyBriefTime: '08:00',
      summaryLanguage: 'en',
    });
    const updateSpy = vi.spyOn(apiClient, 'updateAiPreferences').mockResolvedValue({
      aiProcessingConsent: true,
      defaultReplyTone: 'professional',
      defaultReplyLanguage: 'match_thread',
      serviceConfigured: true,
    });
    const notifySpy = vi.fn();

    render(
      <SettingsView
        initialTab="privacy"
        onBackToMail={vi.fn()}
        isDark={false}
        onToggleTheme={vi.fn()}
        onNotify={notifySpy}
      />
    );

    const toggle = screen.getByLabelText(/Toggle Groq AI Processing/i) as HTMLInputElement;
    await waitFor(() => {
      expect(toggle.checked).toBe(false);
    });

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(true, 'professional', 'match_thread');
      expect(notifySpy).toHaveBeenCalledWith('Groq AI processing enabled.', 'info');
      expect(toggle.checked).toBe(true);
    });
  });

  it('disabling consent invokes apiClient.updateAiPreferences with false and notifies user that AI is paused', async () => {
    vi.spyOn(apiClient, 'getAiPreferences').mockResolvedValue({
      aiProcessingConsent: true,
      defaultReplyTone: 'professional',
      defaultReplyLanguage: 'match_thread',
      serviceConfigured: true,
    });
    vi.spyOn(apiClient, 'getBusinessProfile').mockResolvedValue({
      profileType: 'generic',
      businessName: '',
      timezone: 'UTC',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      quietHoursEnabled: true,
      quietHoursStart: '20:00',
      quietHoursEnd: '08:00',
      vipContacts: [],
      waitingOnContacts: [],
      dailyBriefTime: '08:00',
      summaryLanguage: 'en',
    });
    const updateSpy = vi.spyOn(apiClient, 'updateAiPreferences').mockResolvedValue({
      aiProcessingConsent: false,
      defaultReplyTone: 'professional',
      defaultReplyLanguage: 'match_thread',
      serviceConfigured: true,
    });
    const notifySpy = vi.fn();

    render(
      <SettingsView
        initialTab="privacy"
        onBackToMail={vi.fn()}
        isDark={false}
        onToggleTheme={vi.fn()}
        onNotify={notifySpy}
      />
    );

    const toggle = screen.getByLabelText(/Toggle Groq AI Processing/i) as HTMLInputElement;
    await waitFor(() => {
      expect(toggle.checked).toBe(true);
    });

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(false, 'professional', 'match_thread');
      expect(notifySpy).toHaveBeenCalledWith(
        'Groq AI processing disabled. AI features paused.',
        'info'
      );
      expect(toggle.checked).toBe(false);
    });
  });
});
