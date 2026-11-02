import React from 'react';
import { Menu, Search, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Kbd } from '../ui/Kbd';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCommandPalette: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenCommandPalette,
  onToggleMobileMenu,
}) => {
  return (
    <header className="h-14 border-b border-border-subtle bg-canvas-alt px-4 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded hover:bg-canvas-surface text-ink-muted transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-ink-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search emails, people, or commands... (Press ⌘K)"
            className="w-full bg-white text-ink-primary placeholder:text-ink-subtle text-xs rounded border border-border-subtle focus:border-ink-primary focus:outline-none transition-colors py-1.5 pl-9 pr-14"
          />
          <button
            onClick={onOpenCommandPalette}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            title="Open Command Palette"
          >
            <Kbd>⌘K</Kbd>
          </button>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-ink-muted px-2 py-0.5 rounded bg-canvas-surface border border-border-subtle">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Synced</span>
        </div>

        <button
          onClick={onOpenCommandPalette}
          className="p-1 text-ink-muted hover:text-ink-primary rounded hover:bg-canvas-surface transition-colors"
          title="Keyboard shortcuts & commands (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile Avatar */}
        <div className="relative flex items-center cursor-pointer select-none">
          <div className="w-7 h-7 rounded-full bg-ink-primary text-canvas flex items-center justify-center font-mono text-xs font-semibold">
            AR
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>
      </div>
    </header>
  );
};
