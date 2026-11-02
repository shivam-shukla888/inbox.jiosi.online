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
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>('thread-1');
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [currentFilter, setCurrentFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Folder Counts
  const folderCounts = useMemo(() => {
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
  }, [emails]);

  // Filtered emails based on active folder, category tab, and search query
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

  // Active selected email object
  const selectedEmail = useMemo(() => {
    return emails.find((e) => e.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

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

  // Actions
  const handleSelectEmail = useCallback((id: string) => {
    setSelectedEmailId(id);
    setIsMobileDetailOpen(true);
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isUnread: false } : e))
    );
  }, []);

  const handleToggleStar = useCallback((id: string) => {
    setEmails((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const nextState = !e.isStarred;
          showToast(nextState ? 'Marked as starred' : 'Removed from starred', 'info');
          return { ...e, isStarred: nextState };
        }
        return e;
      })
    );
  }, [showToast]);

  const handleSnooze = useCallback((id: string, until: string) => {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isSnoozed: true, snoozedUntil: until } : e
      )
    );
    showToast(`Conversation snoozed until ${until}`, 'success');
  }, [showToast]);

  const handleUnsnooze = useCallback((id: string) => {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isSnoozed: false, snoozedUntil: undefined } : e
      )
    );
    showToast('Conversation returned to Inbox.', 'success');
  }, [showToast]);

  const handleArchive = useCallback((id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    showToast('Thread archived.', 'success');
    if (selectedEmailId === id) {
      const remaining = filteredEmails.filter((e) => e.id !== id);
      setSelectedEmailId(remaining.length > 0 ? remaining[0].id : null);
      setIsMobileDetailOpen(false);
    }
  }, [filteredEmails, selectedEmailId, showToast]);

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

  const handleMarkSelectedAsRead = () => {
    setEmails((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, isUnread: false } : e))
    );
    setSelectedIds(new Set());
    showToast('Selected messages marked as read.', 'success');
  };

  const handleArchiveSelected = () => {
    const count = selectedIds.size;
    setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    showToast(`${count} conversations archived.`, 'success');
  };

  const handleSendEmail = (to: string, subject: string, body: string) => {
    const newThread: EmailThread = {
      id: `thread-${Date.now()}`,
      sender: {
        name: 'Alex Rivera',
        email: 'alex@jiosi.online',
        role: 'Founder',
        avatar: 'AR',
      },
      recipient: {
        name: to.split('@')[0],
        email: to,
      },
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

    setEmails((prev) => [newThread, ...prev]);
    showToast(`Email sent to ${to}`, 'success');
  };

  const handleSaveDraft = (to: string, subject: string, body: string) => {
    const draftThread: EmailThread = {
      id: `draft-${Date.now()}`,
      sender: {
        name: 'Alex Rivera',
        email: 'alex@jiosi.online',
        avatar: 'AR',
      },
      recipient: {
        name: to ? to.split('@')[0] : 'Unspecified',
        email: to || 'draft@jiosi.online',
      },
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
  };

  const handleOpenSettings = (tab: string = 'general') => {
    setSettingsTab(tab as SettingsTab);
    setCurrentView('settings');
  };

  // Keyboard navigation shortcuts (Linear / Superhuman style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, or contentEditable
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
            onSendReply={handleSendEmail}
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
