import React from 'react';
import { Menu, Search, HelpCircle, CheckCircle2, X } from 'lucide-react';
import { Kbd } from '../ui/Kbd';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ProfileMenu } from '../profile/ProfileMenu';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCommandPalette: () => void;
  onToggleMobileMenu: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: (tab?: string) => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenCommandPalette,
  onToggleMobileMenu,
  isDark,
  onToggleTheme,
  onOpenSettings,
  onSignOut,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between gap-3 shrink-0 z-20">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Screen 3) */}
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search emails, subjects, or commands... (Press ⌘K)"
            className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700/80 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all py-1.5 pl-9 pr-14"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onOpenCommandPalette}
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:block cursor-pointer"
              title="Open Command Palette"
            >
              <Kbd>⌘K</Kbd>
            </button>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 select-none">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Synced</span>
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

        {/* Keyboard Shortcuts Dialog Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block cursor-pointer"
          title="Keyboard shortcuts & commands (?)"
          aria-label="Keyboard shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Screen 11: User Profile Menu */}
        <ProfileMenu
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onOpenSettings={onOpenSettings}
          onOpenShortcuts={onOpenCommandPalette}
          onSignOut={onSignOut}
        />
      </div>
    </header>
  );
};
