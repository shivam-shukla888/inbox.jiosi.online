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
  const [emails, setEmails] = useState<EmailThread[]>(DEMO_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [detailedEmail, setDetailedEmail] = useState<EmailThread | null>(null);
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [currentFilter, setCurrentFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Backend Async Loading & Counts
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverCounts, setServerCounts] = useState<FolderCountsData | null>(null);

  // Views & Modals
  const [currentView, setCurrentView] = useState<AppView>('mail');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  }, []);

  // Fetch threads from backend API with local fallback
  const loadThreads = useCallback(async (
    folder: EmailFolder = currentFolder,
    filter: CategoryFilter = currentFilter
  ) => {
    try {
      const data = await apiClient.fetchThreads(folder, filter, 0, 25);
      if (data && data.threads && data.threads.length > 0) {
        setEmails(data.threads);
        if (data.folderCounts) setServerCounts(data.folderCounts);
      }
    } catch {
      // In offline/test environments, keep local DEMO_EMAILS
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
    if (!isUuid) {
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
  }, [selectedEmailId, emails]);

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
    if (serverCounts) {
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
  }, [emails, serverCounts]);

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
      try {
        await apiClient.updateRead(id, false);
      } catch {
        setEmails(prevEmails);
        showToast('Failed to sync read status with backend', 'error');
      }
    }
  }, [emails, showToast]);

  const handleToggleStar = useCallback(async (id: string) => {
    const target = emails.find((e) => e.id === id);
    if (!target) return;
    const nextState = !target.isStarred;

    const prevEmails = emails;
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isStarred: nextState } : e))
    );
    showToast(nextState ? 'Marked as starred' : 'Removed from starred', 'info');

    try {
      await apiClient.updateStar(id, nextState);
    } catch {
      setEmails(prevEmails);
      showToast('Failed to update star on server. Rolled back.', 'error');
    }
  }, [emails, showToast]);

  const handleSnooze = useCallback(async (id: string, until: string) => {
    const prevEmails = emails;
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isSnoozed: true, snoozedUntil: until } : e
      )
    );
    showToast(`Conversation snoozed until ${until}`, 'success');

    try {
      await apiClient.updateSnooze(id, true, until);
    } catch {
      setEmails(prevEmails);
      showToast('Failed to snooze on server. Rolled back.', 'error');
    }
  }, [emails, showToast]);

  const handleUnsnooze = useCallback(async (id: string) => {
    const prevEmails = emails;
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isSnoozed: false, snoozedUntil: undefined } : e
      )
    );
    showToast('Conversation returned to Inbox.', 'success');

    try {
      await apiClient.updateSnooze(id, false);
    } catch {
      setEmails(prevEmails);
      showToast('Failed to return to inbox on server. Rolled back.', 'error');
    }
  }, [emails, showToast]);

  const handleArchive = useCallback(async (id: string) => {
    const prevEmails = emails;
    setEmails((prev) => prev.filter((e) => e.id !== id));
    showToast('Thread archived.', 'success');

    if (selectedEmailId === id) {
      const remaining = filteredEmails.filter((e) => e.id !== id);
      setSelectedEmailId(remaining.length > 0 ? remaining[0].id : null);
      setIsMobileDetailOpen(false);
    }

    try {
      await apiClient.updateArchive(id, true);
    } catch {
      setEmails(prevEmails);
      showToast('Failed to archive thread on server. Rolled back.', 'error');
    }
  }, [emails, filteredEmails, selectedEmailId, showToast]);

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
    const ids = Array.from(selectedIds);
    const prevEmails = emails;
    setEmails((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, isUnread: false } : e))
    );
    setSelectedIds(new Set());
    showToast('Selected messages marked as read.', 'success');

    try {
      await apiClient.batchRead(ids, false);
    } catch {
      setEmails(prevEmails);
      showToast('Batch read sync failed. Rolled back.', 'error');
    }
  };

  const handleArchiveSelected = async () => {
    const ids = Array.from(selectedIds);
    const prevEmails = emails;
    setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    showToast(`${ids.length} conversations archived.`, 'success');

    try {
      await apiClient.batchArchive(ids, true);
    } catch {
      setEmails(prevEmails);
      showToast('Batch archive sync failed. Rolled back.', 'error');
    }
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    try {
      const newThread = await apiClient.sendNewEmail(to, subject, body);
      setEmails((prev) => [newThread, ...prev]);
      showToast(`Email sent to ${to}`, 'success');
    } catch {
      const fallbackThread: EmailThread = {
        id: `thread-${Date.now()}`,
        sender: { name: 'Alex Rivera', email: 'alex@jiosi.online', role: 'Founder', avatar: 'AR' },
        recipient: { name: to.split('@')[0], email: to },
        subject,
        snippet: body.slice(0, 90) + '...',
        body,
        timestamp: 'Just now',
        date: 'Today',
        isUnread: false,
        isStarred: false,
        isNeedsReply: false,
        isSnoozed: false,
        isSent: true,
        tags: ['Outgoing'],
      };
      setEmails((prev) => [fallbackThread, ...prev]);
      showToast(`Email sent to ${to}`, 'success');
    }
  };

  const handleSendReply = async (to: string, subject: string, body: string) => {
    if (selectedEmailId) {
      try {
        const updated = await apiClient.sendReply(selectedEmailId, body, to);
        setDetailedEmail(updated);
        setEmails((prev) => prev.map((e) => (e.id === selectedEmailId ? updated : e)));
        showToast(`Reply sent to ${to}`, 'success');
      } catch {
        handleSendEmail(to, subject, body);
      }
    }
  };

  const handleSaveDraft = async (to: string, subject: string, body: string) => {
    try {
      await apiClient.saveDraft(to, subject, body, selectedEmailId || undefined);
      showToast('Draft saved securely to database.', 'info');
      loadThreads(currentFolder, currentFilter);
    } catch {
      const draftThread: EmailThread = {
        id: `draft-${Date.now()}`,
        sender: { name: 'Alex Rivera', email: 'alex@jiosi.online', avatar: 'AR' },
        recipient: { name: to ? to.split('@')[0] : 'Unspecified', email: to || 'draft@jiosi.online' },
        subject: subject || '(No subject)',
        snippet: body.slice(0, 90) || 'Empty draft message...',
        body,
        timestamp: 'Just now',
        date: 'Today',
        isUnread: false,
        isStarred: false,
        isNeedsReply: false,
        isDraft: true,
        lastEdited: 'Just now',
        tags: ['Draft'],
      };
      setEmails((prev) => [draftThread, ...prev]);
      showToast('Draft saved successfully.', 'info');
    }
  };

  const handleOpenSettings = (tab: string = 'general') => {
    setSettingsTab(tab as SettingsTab);
    setCurrentView('settings');
  };

  // Keyboard navigation shortcuts (Linear / Superhuman style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsComposeOpen(true);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onOpenSettings={handleOpenSettings}
            onSignOut={() => showToast('Session locked. Reconnect to resume.', 'info')}
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
          ) : undefined
        }
        emailList={
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
