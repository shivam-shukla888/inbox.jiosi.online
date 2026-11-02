import React, { useState, useEffect } from 'react';
import { Search, Inbox, Send, AlertCircle, Clock, Plus, RefreshCw, X } from 'lucide-react';
import { Kbd } from '../ui/Kbd';
import { EmailFolder } from '../../types/email';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folder: EmailFolder) => void;
  onOpenCompose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectFolder,
  onOpenCompose,
}) => {
  const [query, setQuery] = useState('');

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

  if (!isOpen) return null;

  const actions = [
    {
      id: 'compose',
      label: 'Compose new message',
      icon: <Plus className="w-4 h-4" />,
      shortcut: 'C',
      run: () => {
        onOpenCompose();
        onClose();
      },
    },
    {
      id: 'nav-inbox',
      label: 'Go to Inbox',
      icon: <Inbox className="w-4 h-4" />,
      shortcut: 'G I',
      run: () => {
        onSelectFolder('inbox');
        onClose();
      },
    },
    {
      id: 'nav-important',
      label: 'Go to Important',
      icon: <AlertCircle className="w-4 h-4" />,
      shortcut: 'G S',
      run: () => {
        onSelectFolder('important');
        onClose();
      },
    },
    {
      id: 'nav-reply',
      label: 'Go to Needs Reply',
      icon: <Send className="w-4 h-4" />,
      shortcut: 'G R',
      run: () => {
        onSelectFolder('needs-reply');
        onClose();
      },
    },
    {
      id: 'nav-follow',
      label: 'Go to Follow-ups',
      icon: <Clock className="w-4 h-4" />,
      shortcut: 'G F',
      run: () => {
        onSelectFolder('follow-ups');
        onClose();
      },
    },
    {
      id: 'sync-health',
      label: 'Refresh System Health',
      icon: <RefreshCw className="w-4 h-4" />,
      shortcut: 'R',
      run: () => {
        window.location.reload();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-ink-primary/20 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-border-strong rounded-lg shadow-command overflow-hidden flex flex-col">
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-border-subtle gap-3">
          <Search className="w-4 h-4 text-ink-muted" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to..."
            className="w-full text-xs text-ink-primary placeholder:text-ink-subtle focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-canvas-surface text-ink-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-ink-muted text-center py-6">
              No matching commands found.
            </p>
          ) : (
            filtered.map((action) => (
              <button
                key={action.id}
                onClick={action.run}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-xs text-ink-secondary hover:bg-canvas-focus hover:text-ink-primary transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-ink-muted">{action.icon}</span>
                  <span>{action.label}</span>
                </div>
                {action.shortcut && <Kbd>{action.shortcut}</Kbd>}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border-subtle bg-canvas-alt flex items-center justify-between text-[11px] text-ink-muted font-mono">
          <span>Navigation: ↑ ↓ · Enter to select</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
