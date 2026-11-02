import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Inbox,
  Send,
  Star,
  Clock,
  Plus,
  Settings,
  Sun,
  Mail,
  History,
  X
} from 'lucide-react';
import { Kbd } from '../ui/Kbd';
import { EmailFolder, EmailThread } from '../../types/email';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folder: EmailFolder) => void;
  onOpenCompose: () => void;
  onOpenSettings: (tab?: string) => void;
  onToggleTheme: () => void;
  emails: EmailThread[];
  onSelectEmail: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectFolder,
  onOpenCompose,
  onOpenSettings,
  onToggleTheme,
  emails,
  onSelectEmail,
}) => {
  const [query, setQuery] = useState('');
  const recentSearches = [
    'Term sheet',
    'Design review',
    'Stripe invoice',
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Actions list
  const systemActions = useMemo(
    () => [
      {
        id: 'compose',
        label: 'Compose new message',
        category: 'Actions',
        icon: <Plus className="w-4 h-4 text-brand-500" />,
        shortcut: 'C',
        run: () => {
          onOpenCompose();
          onClose();
        },
      },
      {
        id: 'nav-inbox',
        label: 'Go to Inbox',
        category: 'Navigation',
        icon: <Inbox className="w-4 h-4 text-slate-400" />,
        shortcut: 'G I',
        run: () => {
          onSelectFolder('inbox');
          onClose();
        },
      },
      {
        id: 'nav-reply',
        label: 'Go to Needs Reply',
        category: 'Navigation',
        icon: <Send className="w-4 h-4 text-red-500" />,
        shortcut: 'G R',
        run: () => {
          onSelectFolder('needs-reply');
          onClose();
        },
      },
      {
        id: 'nav-starred',
        label: 'Go to Starred',
        category: 'Navigation',
        icon: <Star className="w-4 h-4 text-amber-500" />,
        shortcut: 'G S',
        run: () => {
          onSelectFolder('starred');
          onClose();
        },
      },
      {
        id: 'nav-snoozed',
        label: 'Go to Snoozed',
        category: 'Navigation',
        icon: <Clock className="w-4 h-4 text-slate-400" />,
        shortcut: 'G H',
        run: () => {
          onSelectFolder('snoozed');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        label: 'Open Settings',
        category: 'Settings',
        icon: <Settings className="w-4 h-4 text-slate-400" />,
        shortcut: 'G ,',
        run: () => {
          onOpenSettings('general');
          onClose();
        },
      },
      {
        id: 'toggle-theme',
        label: 'Toggle Light / Dark Theme',
        category: 'Appearance',
        icon: <Sun className="w-4 h-4 text-amber-400" />,
        shortcut: 'T',
        run: () => {
          onToggleTheme();
          onClose();
        },
      },
    ],
    [onOpenCompose, onSelectFolder, onOpenSettings, onToggleTheme, onClose]
  );

  // Email search results
  const matchingEmails = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return emails.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.snippet.toLowerCase().includes(q) ||
        e.sender.name.toLowerCase().includes(q) ||
        e.sender.email.toLowerCase().includes(q) ||
        e.recipient.name.toLowerCase().includes(q) ||
        (e.attachments &&
          e.attachments.some((att) => att.filename.toLowerCase().includes(q)))
    );
  }, [emails, query]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return systemActions;
    const q = query.toLowerCase();
    return systemActions.filter((a) => a.label.toLowerCase().includes(q));
  }, [systemActions, query]);

  if (!isOpen) return null;

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-modal overflow-hidden flex flex-col z-10 max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search emails, senders, files..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Kbd>ESC</Kbd>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 text-xs">
          {/* Recent Searches (when query empty) */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2 space-y-1">
              <span className="text-[10px] font-mono font-medium text-slate-400 px-2 uppercase tracking-wider">
                Recent Searches
              </span>
              <div className="flex items-center gap-1.5 pt-1 px-1 flex-wrap">
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectRecent(term)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xs"
                  >
                    <History className="w-3 h-3 text-slate-400" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Email Match Results */}
          {matchingEmails.length > 0 && (
            <div className="p-2 space-y-1">
              <span className="text-[10px] font-mono font-medium text-slate-400 px-2 uppercase tracking-wider">
                Matching Messages ({matchingEmails.length})
              </span>
              {matchingEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => {
                    onSelectEmail(email.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Mail className="w-4 h-4 text-brand-500 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {email.subject}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {email.sender.name} · {email.snippet}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {email.timestamp}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Actions / Commands */}
          <div className="p-2 space-y-1">
            <span className="text-[10px] font-mono font-medium text-slate-400 px-2 uppercase tracking-wider">
              Navigation & Actions
            </span>
            {filteredActions.map((action) => (
              <button
                key={action.id}
                onClick={action.run}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {action.icon}
                  <span className="text-slate-800 dark:text-slate-200">
                    {action.label}
                  </span>
                </div>
                {action.shortcut && <Kbd>{action.shortcut}</Kbd>}
              </button>
            ))}
          </div>

          {filteredActions.length === 0 && matchingEmails.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands or emails found for "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Navigate with ↑↓ · Select with ↵</span>
          <span>JIOSI Search v0.2</span>
        </div>
      </div>
    </div>
  );
};
