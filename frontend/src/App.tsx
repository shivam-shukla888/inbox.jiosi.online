import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EmailList } from './components/inbox/EmailList';
import { EmailDetail } from './components/inbox/EmailDetail';
import { ComposeModal } from './components/inbox/ComposeModal';
import { CommandPalette } from './components/inbox/CommandPalette';
import { DEMO_EMAILS } from './data/mockEmails';
import { EmailThread, EmailFolder, CategoryFilter } from './types/email';

export const App: React.FC = () => {
  const [emails, setEmails] = useState<EmailThread[]>(DEMO_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>('thread-1');
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [currentFilter, setCurrentFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Folder and Filter counts
  const folderCounts = useMemo(() => {
    return {
      inbox: {
        total: emails.length,
        unread: emails.filter((e) => e.isUnread).length,
      },
      important: {
        total: emails.filter((e) => e.isImportant).length,
        unread: emails.filter((e) => e.isImportant && e.isUnread).length,
      },
      'needs-reply': {
        total: emails.filter((e) => e.isNeedsReply).length,
        unread: emails.filter((e) => e.isNeedsReply && e.isUnread).length,
      },
      'follow-ups': {
        total: emails.filter((e) => e.isFollowUp).length,
        unread: emails.filter((e) => e.isFollowUp && e.isUnread).length,
      },
      search: {
        total: emails.length,
        unread: emails.filter((e) => e.isUnread).length,
      },
    };
  }, [emails]);

  // Filtered emails based on active folder, category tab, and search query
  const filteredEmails = useMemo(() => {
    let result = emails;

    // Folder filtering
    if (currentFolder === 'important') {
      result = result.filter((e) => e.isImportant);
    } else if (currentFolder === 'needs-reply') {
      result = result.filter((e) => e.isNeedsReply);
    } else if (currentFolder === 'follow-ups') {
      result = result.filter((e) => e.isFollowUp);
    }

    // Category filter
    if (currentFilter === 'unread') {
      result = result.filter((e) => e.isUnread);
    } else if (currentFilter === 'vip') {
      result = result.filter((e) => e.tags.includes('VIP') || e.isImportant);
    } else if (currentFilter === 'mentions') {
      result = result.filter((e) => e.tags.includes('Feedback') || e.tags.includes('Fundraising'));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q) ||
          e.sender.name.toLowerCase().includes(q) ||
          e.sender.email.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q)
      );
    }

    return result;
  }, [emails, currentFolder, currentFilter, searchQuery]);

  // Selected email object
  const selectedEmail = useMemo(() => {
    return emails.find((e) => e.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

  // Category counts for the current folder
  const filterCounts = useMemo(() => {
    let base = emails;
    if (currentFolder === 'important') base = base.filter((e) => e.isImportant);
    else if (currentFolder === 'needs-reply') base = base.filter((e) => e.isNeedsReply);
    else if (currentFolder === 'follow-ups') base = base.filter((e) => e.isFollowUp);

    return {
      all: base.length,
      unread: base.filter((e) => e.isUnread).length,
      vip: base.filter((e) => e.tags.includes('VIP') || e.isImportant).length,
      mentions: base.filter((e) => e.tags.includes('Feedback') || e.tags.includes('Fundraising')).length,
    };
  }, [emails, currentFolder]);

  // Handle email click: select and mark read
  const handleSelectEmail = useCallback((id: string) => {
    setSelectedEmailId(id);
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isUnread: false } : e))
    );
  }, []);

  // Multi-select helpers
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
  };

  const handleArchive = (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmailId === id) {
      const remaining = emails.filter((e) => e.id !== id);
      setSelectedEmailId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleDelete = (id: string) => {
    handleArchive(id);
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
      snippet: body.slice(0, 80) + '...',
      body,
      timestamp: 'Just now',
      date: 'Today',
      isUnread: false,
      isImportant: false,
      isNeedsReply: false,
      isFollowUp: false,
      tags: ['Outgoing'],
    };

    setEmails((prev) => [newThread, ...prev]);
    setSelectedEmailId(newThread.id);
  };

  // Keyboard navigation shortcuts (Linear / Superhuman style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
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
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        // Navigate to next email
        e.preventDefault();
        const currentIndex = filteredEmails.findIndex((m) => m.id === selectedEmailId);
        if (currentIndex < filteredEmails.length - 1) {
          handleSelectEmail(filteredEmails[currentIndex + 1].id);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        // Navigate to previous email
        e.preventDefault();
        const currentIndex = filteredEmails.findIndex((m) => m.id === selectedEmailId);
        if (currentIndex > 0) {
          handleSelectEmail(filteredEmails[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredEmails, selectedEmailId, handleSelectEmail]);

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            currentFolder={currentFolder}
            onSelectFolder={(f) => {
              setCurrentFolder(f);
              setSelectedIds(new Set());
            }}
            onOpenCompose={() => setIsComposeOpen(true)}
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
          />
        }
        emailList={
          <EmailList
            emails={filteredEmails}
            selectedEmailId={selectedEmailId}
            onSelectEmail={handleSelectEmail}
            currentFilter={currentFilter}
            onSelectFilter={setCurrentFilter}
            filterCounts={filterCounts}
            selectedIds={selectedIds}
            onToggleCheck={handleToggleCheck}
            onToggleSelectAll={handleToggleSelectAll}
            onMarkSelectedAsRead={handleMarkSelectedAsRead}
          />
        }
        emailDetail={
          <EmailDetail
            email={selectedEmail}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        }
      />

      {/* Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
      />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectFolder={(folder) => {
          setCurrentFolder(folder);
          setSelectedIds(new Set());
        }}
        onOpenCompose={() => setIsComposeOpen(true)}
      />
    </>
  );
};

export default App;
