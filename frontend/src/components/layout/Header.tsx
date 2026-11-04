import React from 'react';
import { Menu, Search, HelpCircle, CheckCircle2, X } from 'lucide-react';
import { Kbd } from '../ui/Kbd';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ProfileMenu } from '../profile/ProfileMenu';

interface HeaderProps {
  currentTitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCommandPalette: () => void;
  onToggleMobileMenu: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: (tab?: string) => void;
  onSignOut: () => void;
  onOpenLanding?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenSupport?: () => void;
  isDemoMode?: boolean;
  user?: {
    fullName: string;
    email: string;
    avatarUrl?: string;
    role?: string;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentTitle,
  searchQuery,
  onSearchChange,
  onOpenCommandPalette,
  onToggleMobileMenu,
  isDark,
  onToggleTheme,
  onOpenSettings,
  onSignOut,
  onOpenLanding,
  onOpenPrivacy,
  onOpenTerms,
  onOpenSupport,
  isDemoMode = false,
  user,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20">
      <div className="flex items-center gap-3.5 flex-1 max-w-2xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Page / Folder Title (Contextual Hierarchy) */}
        <div className="flex items-center gap-2 shrink-0">
          <h2 className="text-sm font-ui font-bold tracking-tight text-slate-900 leading-none">
            {currentTitle || 'Inbox'}
          </h2>
        </div>

        {/* Modern Search Bar */}
        <div className="relative w-full max-w-lg">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search emails, subjects, or commands... (Press ⌘K)"
            className="w-full bg-[#F8FAFC] text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-jiosi-indigo focus:ring-2 focus:ring-indigo-100 focus:bg-white focus:outline-none transition-all py-1.5 pl-9 pr-14 font-sans"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onOpenCommandPalette}
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:block cursor-pointer"
              title="Open Command Palette"
              aria-label="Open Command Palette"
            >
              <Kbd>⌘K</Kbd>
            </button>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync or Demo Status Badge */}
        {isDemoMode ? (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-medium text-amber-800 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 select-none">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Simulation Preview</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-slate-700 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 select-none">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Workspace Active</span>
          </div>
        )}

        {/* Theme Toggle (Light / Dark) */}
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

        {/* Keyboard Shortcuts Dialog Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors hidden sm:block cursor-pointer"
          title="Command Palette & Shortcuts (⌘K)"
          aria-label="Command Palette & Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile / Workspace Switcher Menu */}
        <ProfileMenu
          user={user}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onOpenShortcuts={onOpenCommandPalette}
          onSignOut={onSignOut}
          onOpenSettings={onOpenSettings}
          onOpenLanding={onOpenLanding}
          onOpenPrivacy={onOpenPrivacy}
          onOpenTerms={onOpenTerms}
          onOpenSupport={onOpenSupport}
          isDemoMode={isDemoMode}
        />
      </div>
    </header>
  );
};
