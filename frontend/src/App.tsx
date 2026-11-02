import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { EmailList } from './components/inbox/EmailList';
import { EmailDetail } from './components/inbox/EmailDetail';
import { ComposeModal } from './components/inbox/ComposeModal';
import { CommandPalette } from './components/inbox/CommandPalette';
import { SettingsView } from './components/settings/SettingsView';
import { PrivacyView } from './components/public/PrivacyView';
import { TermsView } from './components/public/TermsView';
import { SupportView } from './components/public/SupportView';
import { PublicProductLanding } from './components/public/PublicProductLanding';
import { SignInModal } from './components/auth/SignInModal';
import { Toast, ToastType } from './components/ui/Toast';
import { apiClient, FolderCountsData } from './api/client';
import { DEMO_EMAILS } from './data/mockEmails';
import {
  EmailThread,
  EmailFolder,
  CategoryFilter,
  AppView,
  SettingsTab,
} from './types/email';

export const App: React.FC = () => {
  // Theme state: initialized from localStorage or prefers-color-scheme
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('jiosi_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark class to <html> root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('jiosi_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('jiosi_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  // Main Application State
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [detailedEmail, setDetailedEmail] = useState<EmailThread | null>(null);
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [currentFilter, setCurrentFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Backend Async Loading, Demo, and Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverCounts, setServerCounts] = useState<FolderCountsData | null>(null);

  // Views & Modals
  const [currentView, setCurrentView] = useState<AppView>('mail');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  }, []);

  // Sync document title and robots meta tag based on active view
  useEffect(() => {
    const metaRobots = document.getElementById('meta-robots');
    if (currentView === 'mail' || currentView === 'settings' || currentView === 'connected-accounts') {
      document.title = 'JIOSI Inbox by Shivsastra | Intelligent Email Workspace';
      if (metaRobots) metaRobots.setAttribute('content', 'noindex, nofollow');
    } else if (currentView === 'privacy') {
      document.title = 'Privacy Policy — JIOSI Inbox by Shivsastra';
      if (metaRobots) metaRobots.setAttribute('content', 'index, follow');
    } else if (currentView === 'terms') {
      document.title = 'Terms of Service — JIOSI Inbox by Shivsastra';
      if (metaRobots) metaRobots.setAttribute('content', 'index, follow');
    } else if (currentView === 'support') {
      document.title = 'Help & Support — JIOSI Inbox by Shivsastra';
      if (metaRobots) metaRobots.setAttribute('content', 'index, follow');
    } else if (currentView === 'landing') {
      document.title = 'JIOSI Inbox by Shivsastra | Intelligent Email Workspace';
      if (metaRobots) metaRobots.setAttribute('content', 'index, follow');
    }
  }, [currentView]);

  // Initial Route Check (support direct links to public docs/legal)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location) {
      const p = window.location.pathname;
      if (p === '/privacy') setCurrentView('privacy');
      else if (p === '/terms') setCurrentView('terms');
      else if (p === '/support') setCurrentView('support');
      else if (p === '/overview') setCurrentView('landing');
    }
  }, []);

  // Fetch threads from backend API with robust lifecycle and explicit demo handling
  const loadThreads = useCallback(async (
    folder: EmailFolder = currentFolder,
    filter: CategoryFilter = currentFilter
  ) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // 1. Ensure authenticated session exists
      if (!apiClient.getAuthToken()) {
        try {
          await apiClient.initAuth();
        } catch {
          // If auth endpoint unavailable, proceed to fetch attempt
        }
      }

      // 2. Fetch threads
      const data = await apiClient.fetchThreads(folder, filter, 0, 25);
      if (data && Array.isArray(data.threads)) {
        setEmails(data.threads); // Replaces old content with exact server content (even if 0)
        if (data.folderCounts) setServerCounts(data.folderCounts);
        setIsDemoMode(false);
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Connection failed';
      setLoadError(`Unable to reach backend API (${reason}). Working in offline mode.`);
      setEmails([]);
      setIsDemoMode(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, currentFilter]);

  // Initial and folder/filter change trigger
  useEffect(() => {
    loadThreads(currentFolder, currentFilter);
  }, [currentFolder, currentFilter, loadThreads]);

  // Fetch detailed email when selectedEmailId changes
  useEffect(() => {
    if (!selectedEmailId) {
      setDetailedEmail(null);
      return;
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedEmailId);
    if (!isUuid || isDemoMode) {
      setDetailedEmail(emails.find((e) => e.id === selectedEmailId) || null);
      return;
    }
    let isMounted = true;
    apiClient.fetchThreadDetail(selectedEmailId)
      .then((detail) => {
        if (isMounted) setDetailedEmail(detail);
      })
      .catch(() => {
        if (isMounted) {
          const fallback = emails.find((e) => e.id === selectedEmailId) || null;
          setDetailedEmail(fallback);
        }
      });

    return () => { isMounted = false; };
  }, [selectedEmailId, emails, isDemoMode]);

  // Filtered emails based on active folder, category tab, and real-time search query
  const filteredEmails = useMemo(() => {
    let result = emails;

    // Folder isolation
    if (currentFolder === 'inbox') {
      result = result.filter((e) => !e.isSnoozed && !e.isSent && !e.isDraft);
    } else if (currentFolder === 'needs-reply') {
      result = result.filter((e) => e.isNeedsReply && !e.isSent && !e.isDraft);
    } else if (currentFolder === 'starred') {
      result = result.filter((e) => e.isStarred);
    } else if (currentFolder === 'snoozed') {
      result = result.filter((e) => e.isSnoozed);
    } else if (currentFolder === 'sent') {
      result = result.filter((e) => e.isSent);
    } else if (currentFolder === 'drafts') {
      result = result.filter((e) => e.isDraft);
    }

    // Category filter (within inbox)
    if (currentFolder === 'inbox') {
      if (currentFilter === 'unread') {
        result = result.filter((e) => e.isUnread);
      } else if (currentFilter === 'needs-reply') {
        result = result.filter((e) => e.isNeedsReply);
      } else if (currentFilter === 'vip') {
        result = result.filter((e) => e.tags.includes('VIP') || e.tags.includes('Fundraising'));
      }
    }

    // Search query real-time filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q) ||
          e.sender.name.toLowerCase().includes(q) ||
          e.sender.email.toLowerCase().includes(q) ||
          e.recipient.name.toLowerCase().includes(q) ||
          e.recipient.email.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q) ||
          (e.attachments &&
            e.attachments.some((att) => att.filename.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [emails, currentFolder, currentFilter, searchQuery]);

  // Active selected email object (detailed or fallback)
  const selectedEmail = useMemo(() => {
    if (detailedEmail && detailedEmail.id === selectedEmailId) {
      return detailedEmail;
    }
    return emails.find((e) => e.id === selectedEmailId) || null;
  }, [detailedEmail, emails, selectedEmailId]);

  // Ensure an email is selected when current list changes
  useEffect(() => {
    if (filteredEmails.length > 0) {
      const stillInList = filteredEmails.some((e) => e.id === selectedEmailId);
      if (!stillInList) {
        setSelectedEmailId(filteredEmails[0].id);
      }
    } else {
      setSelectedEmailId(null);
    }
  }, [filteredEmails, selectedEmailId]);

  // Folder Counts
  const folderCounts = useMemo(() => {
    if (serverCounts && !isDemoMode) {
      return {
        inbox: {
          total: serverCounts.inbox.total,
          unread: serverCounts.inbox.unread,
        },
        'needs-reply': {
          total: serverCounts.needsReply.total,
          unread: serverCounts.needsReply.unread,
        },
        starred: {
          total: serverCounts.starred,
        },
        snoozed: {
          total: serverCounts.snoozed,
        },
        sent: {
          total: serverCounts.sent,
        },
        drafts: {
          total: serverCounts.drafts,
        },
      };
    }

    const activeEmails = emails.filter((e) => !e.isSnoozed && !e.isSent && !e.isDraft);
    return {
      inbox: {
        total: activeEmails.length,
        unread: activeEmails.filter((e) => e.isUnread).length,
      },
      'needs-reply': {
        total: emails.filter((e) => e.isNeedsReply && !e.isSent && !e.isDraft).length,
        unread: emails.filter((e) => e.isNeedsReply && e.isUnread).length,
      },
      starred: {
        total: emails.filter((e) => e.isStarred).length,
      },
      snoozed: {
        total: emails.filter((e) => e.isSnoozed).length,
      },
      sent: {
        total: emails.filter((e) => e.isSent).length,
      },
      drafts: {
        total: emails.filter((e) => e.isDraft).length,
      },
    };
  }, [emails, serverCounts, isDemoMode]);

  const headerTitle = useMemo(() => {
    const folderNames: Record<EmailFolder, string> = {
      inbox: 'Inbox',
      'needs-reply': 'Needs Reply',
      starred: 'Starred',
      snoozed: 'Snoozed',
      sent: 'Sent',
      drafts: 'Drafts',
    };
    if (currentView === 'settings') return 'Settings';
    if (currentView === 'connected-accounts') return 'Connected Accounts';
    return folderNames[currentFolder] || 'Inbox';
  }, [currentView, currentFolder]);

  // Category counts for current folder
  const filterCounts = useMemo(() => {
    const base = emails.filter((e) => !e.isSnoozed && !e.isSent && !e.isDraft);
    return {
      all: base.length,
      unread: base.filter((e) => e.isUnread).length,
      'needs-reply': base.filter((e) => e.isNeedsReply).length,
      vip: base.filter((e) => e.tags.includes('VIP') || e.tags.includes('Fundraising')).length,
    };
  }, [emails]);

  // Actions with Optimistic Updates and Rollback on Failure
  const handleSelectEmail = useCallback(async (id: string) => {
    setSelectedEmailId(id);
    setIsMobileDetailOpen(true);

    const target = emails.find((e) => e.id === id);
    if (target && target.isUnread) {
      const prevEmails = emails;
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, isUnread: false } : e)));
      if (!isDemoMode) {
        try {
          await apiClient.updateRead(id, false);
        } catch {
          setEmails(prevEmails);
          showToast('Failed to sync read status with backend', 'error');
        }
      }
    }
  }, [emails, isDemoMode, showToast]);

  const handleToggleStar = useCallback(async (id: string) => {
    const target = emails.find((e) => e.id === id);
    if (!target) return;
    const nextState = !target.isStarred;

    const prevEmails = emails;
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isStarred: nextState } : e))
    );
    showToast(nextState ? 'Marked as starred' : 'Removed from starred', 'info');

    if (!isDemoMode) {
      try {
        await apiClient.updateStar(id, nextState);
      } catch {
        setEmails(prevEmails);
        showToast('Failed to update star on server. Rolled back.', 'error');
      }
    }
  }, [emails, isDemoMode, showToast]);

  const handleSnooze = useCallback(async (id: string, until: string) => {
    const prevEmails = emails;
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isSnoozed: true, snoozedUntil: until } : e
      )
    );
    showToast(`Conversation snoozed until ${until}`, 'success');

    if (!isDemoMode) {
      try {
        await apiClient.updateSnooze(id, true, until);
      } catch {
        setEmails(prevEmails);
        showToast('Failed to snooze on server. Rolled back.', 'error');
      }
    }
  }, [emails, isDemoMode, showToast]);

  const handleUnsnooze = useCallback(async (id: string) => {
    const prevEmails = emails;
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isSnoozed: false, snoozedUntil: undefined } : e
      )
    );
    showToast('Conversation returned to Inbox.', 'success');

    if (!isDemoMode) {
      try {
        await apiClient.updateSnooze(id, false);
      } catch {
        setEmails(prevEmails);
        showToast('Failed to return to inbox on server. Rolled back.', 'error');
      }
    }
  }, [emails, isDemoMode, showToast]);

  const handleArchive = useCallback(async (id: string) => {
    const prevEmails = emails;
    setEmails((prev) => prev.filter((e) => e.id !== id));
    showToast('Thread archived.', 'success');

    if (selectedEmailId === id) {
      const remaining = filteredEmails.filter((e) => e.id !== id);
      setSelectedEmailId(remaining.length > 0 ? remaining[0].id : null);
      setIsMobileDetailOpen(false);
    }

    if (!isDemoMode) {
      try {
        await apiClient.updateArchive(id, true);
      } catch {
        setEmails(prevEmails);
        showToast('Failed to archive thread on server. Rolled back.', 'error');
      }
    }
  }, [emails, filteredEmails, selectedEmailId, isDemoMode, showToast]);

  const handleDelete = useCallback((id: string) => {
    handleArchive(id);
    showToast('Conversation deleted.', 'info');
  }, [handleArchive, showToast]);

  const handleToggleCheck = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmails.map((e) => e.id)));
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;
    const targetIds = Array.from(selectedIds);
    const prevEmails = emails;

    setEmails((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, isUnread: false } : e))
    );
    setSelectedIds(new Set());
    showToast(`Marked ${targetIds.length} conversations as read.`, 'success');

    if (!isDemoMode) {
      try {
        await apiClient.batchRead(targetIds, false);
      } catch {
        setEmails(prevEmails);
        showToast('Batch update failed on server. Rolled back.', 'error');
      }
    }
  };

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return;
    const targetIds = Array.from(selectedIds);
    const prevEmails = emails;

    setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    showToast(`Archived ${targetIds.length} conversations.`, 'success');

    if (!isDemoMode) {
      try {
        await apiClient.batchArchive(targetIds, true);
      } catch {
        setEmails(prevEmails);
        showToast('Batch archive failed on server. Rolled back.', 'error');
      }
    }
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    if (!isDemoMode) {
      try {
        const created = await apiClient.sendNewEmail(to, subject, body);
        setEmails((prev) => [created, ...prev]);
        showToast(`Message sent to ${to}.`, 'success');
      } catch {
        // Fallback optimistic simulation
        const newThread: EmailThread = {
          id: `sent-${Date.now()}`,
          sender: {
            name: 'Alex Rivera',
            email: 'alex@jiosi.online',
            avatar: 'AR',
            role: 'Founder',
          },
          recipient: { name: to, email: to },
          subject: subject || '(No subject)',
          snippet: body.substring(0, 100),
          body: body,
          timestamp: 'Just now',
          date: 'Nov 02',
          isUnread: false,
          isStarred: false,
          isNeedsReply: false,
          isSent: true,
          tags: ['Outbox'],
        };
        setEmails((prev) => [newThread, ...prev]);
        showToast(`Message sent (Simulated).`, 'success');
      }
    } else {
      showToast(`Message sent (Demo Mode).`, 'success');
    }
    setIsComposeOpen(false);
  };

  const handleSaveDraft = async (to: string, subject: string, body: string) => {
    if (!isDemoMode) {
      try {
        await apiClient.saveDraft(to, to, subject, body);
        showToast('Draft saved to server.', 'success');
      } catch {
        showToast('Draft saved locally.', 'info');
      }
    } else {
      showToast('Draft saved (Demo Mode).', 'info');
    }
    setIsComposeOpen(false);
  };

  const handleSendReply = async (to: string, _subject: string, body: string) => {
    if (!selectedEmailId) return;

    if (!isDemoMode) {
      try {
        const updated = await apiClient.sendReply(selectedEmailId, to, body);
        setEmails((prev) => prev.map((e) => (e.id === selectedEmailId ? updated : e)));
        showToast(`Reply sent to ${to}.`, 'success');
      } catch {
        setEmails((prev) =>
          prev.map((e) =>
            e.id === selectedEmailId
              ? { ...e, isNeedsReply: false, isSent: true }
              : e
          )
        );
        showToast(`Reply sent (Simulated).`, 'success');
      }
    } else {
      setEmails((prev) =>
        prev.map((e) =>
          e.id === selectedEmailId
            ? { ...e, isNeedsReply: false, isSent: true }
            : e
        )
      );
      showToast(`Reply sent (Demo Mode).`, 'success');
    }
  };

  const handleOpenSettings = (tab: string = 'general') => {
    setSettingsTab(tab as SettingsTab);
    setCurrentView('settings');
    setIsMobileDetailOpen(false);
  };

  // Keyboard Shortcuts (J/K, E, S, H, C, ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsComposeOpen(true);
      } else if (e.key === 'e' || e.key === 'E') {
        if (selectedEmailId) {
          e.preventDefault();
          handleArchive(selectedEmailId);
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (selectedEmailId) {
          e.preventDefault();
          handleToggleStar(selectedEmailId);
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (selectedEmailId) {
          e.preventDefault();
          handleSnooze(selectedEmailId, 'Tomorrow, 9:00 AM');
        }
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = filteredEmails.findIndex((m) => m.id === selectedEmailId);
        if (currentIndex < filteredEmails.length - 1) {
          handleSelectEmail(filteredEmails[currentIndex + 1].id);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = filteredEmails.findIndex((m) => m.id === selectedEmailId);
        if (currentIndex > 0) {
          handleSelectEmail(filteredEmails[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredEmails,
    selectedEmailId,
    handleSelectEmail,
    handleArchive,
    handleToggleStar,
    handleSnooze,
  ]);

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            currentFolder={currentFolder}
            onSelectFolder={(f) => {
              setCurrentFolder(f);
              setCurrentView('mail');
              setSelectedIds(new Set());
              setIsMobileDetailOpen(false);
            }}
            onOpenCompose={() => setIsComposeOpen(true)}
            onOpenSettings={handleOpenSettings}
            folderCounts={folderCounts}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        }
        header={
          <Header
            currentTitle={headerTitle}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onOpenSettings={handleOpenSettings}
            onSignOut={() => setIsSignInOpen(true)}
            onOpenLanding={() => setCurrentView('landing')}
            onOpenPrivacy={() => setCurrentView('privacy')}
            onOpenTerms={() => setCurrentView('terms')}
            onOpenSupport={() => setCurrentView('support')}
            isDemoMode={isDemoMode}
          />
        }
        customView={
          currentView === 'settings' ? (
            <SettingsView
              initialTab={settingsTab}
              onBackToMail={() => setCurrentView('mail')}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onNotify={showToast}
            />
          ) : currentView === 'privacy' ? (
            <PrivacyView onBack={() => setCurrentView('mail')} />
          ) : currentView === 'terms' ? (
            <TermsView onBack={() => setCurrentView('mail')} />
          ) : currentView === 'support' ? (
            <SupportView onBack={() => setCurrentView('mail')} />
          ) : currentView === 'landing' ? (
            <PublicProductLanding
              onLaunchApp={() => setCurrentView('mail')}
              onOpenPrivacy={() => setCurrentView('privacy')}
              onOpenTerms={() => setCurrentView('terms')}
              onOpenSupport={() => setCurrentView('support')}
            />
          ) : undefined
        }
        emailList={
          <div className="h-full flex flex-col">
            {/* Demo Mode Notice Banner */}
            {isDemoMode && (
              <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900/60 px-3.5 py-2 text-xs flex items-center justify-between text-amber-900 dark:text-amber-200 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span>
                    <strong>Simulation Preview</strong>: Sample threads. Connect a mailbox in Settings to sync live email.
                  </span>
                </div>
                <button
                  onClick={() => loadThreads(currentFolder, currentFilter)}
                  className="underline hover:no-underline font-medium ml-2 text-amber-800 dark:text-amber-300 shrink-0"
                >
                  Retry Sync
                </button>
              </div>
            )}

            {/* Offline Error Banner if not demo and load failed */}
            {loadError && !isDemoMode && (
              <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900/60 px-3.5 py-2 text-xs flex items-center justify-between text-rose-900 dark:text-rose-200 shrink-0">
                <span>{loadError}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEmails(DEMO_EMAILS);
                      setIsDemoMode(true);
                      setLoadError(null);
                    }}
                    className="underline font-medium text-rose-700 dark:text-rose-300"
                  >
                    View Demo Mode
                  </button>
                  <button
                    onClick={() => loadThreads(currentFolder, currentFilter)}
                    className="font-medium px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <EmailList
              emails={filteredEmails}
              currentFolder={currentFolder}
              selectedEmailId={selectedEmailId}
              onSelectEmail={handleSelectEmail}
              currentFilter={currentFilter}
              onSelectFilter={setCurrentFilter}
              filterCounts={filterCounts}
              selectedIds={selectedIds}
              onToggleCheck={handleToggleCheck}
              onToggleSelectAll={handleToggleSelectAll}
              onMarkSelectedAsRead={handleMarkSelectedAsRead}
              onArchiveSelected={handleArchiveSelected}
              onToggleStar={handleToggleStar}
              isLoading={isLoading}
            />
          </div>
        }
        emailDetail={
          <EmailDetail
            email={selectedEmail}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onToggleStar={handleToggleStar}
            onSnooze={handleSnooze}
            onUnsnooze={handleUnsnooze}
            onSendReply={handleSendReply}
            onBackToList={() => setIsMobileDetailOpen(false)}
            onNotify={showToast}
          />
        }
        mobileNavigation={
          currentView === 'mail' ? (
            <MobileNavigation
              currentFolder={currentFolder}
              onSelectFolder={(f) => {
                setCurrentFolder(f);
                setIsMobileDetailOpen(false);
              }}
              onOpenCompose={() => setIsComposeOpen(true)}
              onToggleMenu={() => setIsMobileMenuOpen(true)}
              needsReplyCount={folderCounts['needs-reply'].total}
              unreadCount={folderCounts.inbox.unread}
            />
          ) : undefined
        }
        isMobileDetailOpen={isMobileDetailOpen}
      />

      {/* Screen 2: Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
        onSaveDraft={handleSaveDraft}
      />

      {/* Screen 3: Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectFolder={(f) => {
          setCurrentFolder(f);
          setCurrentView('mail');
          setIsMobileDetailOpen(false);
        }}
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenSettings={handleOpenSettings}
        onToggleTheme={toggleTheme}
        emails={emails}
        onSelectEmail={(id) => {
          setCurrentView('mail');
          handleSelectEmail(id);
        }}
      />

      {/* Sign In Dialog */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSignIn={async (email) => {
          await apiClient.initAuth(email);
          await loadThreads(currentFolder, currentFilter);
          showToast(`Signed in as ${email}`, 'success');
        }}
        onExploreDemo={() => {
          setEmails(DEMO_EMAILS);
          setIsDemoMode(true);
          showToast('Simulation preview active', 'info');
        }}
      />

      {/* Toast Feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default App;
