import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Link2,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Shield,
  ChevronDown,
  FileText,
  Compass
} from 'lucide-react';

interface ProfileMenuProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: (tab?: string) => void;
  onOpenShortcuts: () => void;
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

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isDark,
  onToggleTheme,
  onOpenSettings,
  onOpenShortcuts,
  onSignOut,
  onOpenLanding,
  onOpenPrivacy,
  onOpenTerms,
  onOpenSupport,
  isDemoMode = false,
  user,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName || (isDemoMode ? 'Simulation Sandbox' : 'Authenticated User');
  const displayEmail = user?.email || (isDemoMode ? 'demo@simulation.preview' : '');
  const displayRole = user?.role
    ? `${user.role} · Team Tier`
    : isDemoMode
    ? 'Sandbox Preview Mode'
    : 'Workspace Member · Team Tier';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'JI';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-100"
        aria-label="User Account Menu"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-jiosi-indigo to-jiosi-violet text-white flex items-center justify-center font-ui text-xs font-bold shadow-xs">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="User profile options"
          className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in-50 zoom-in-95"
        >
          {/* Header Info */}
          <div className="px-4 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-jiosi-indigo to-jiosi-violet text-white flex items-center justify-center font-ui text-xs font-bold">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-ui font-semibold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-jiosi-indigo" />
                <span className="text-[10px] font-medium text-slate-700 truncate max-w-[140px]">
                  {displayRole}
                </span>
              </div>
              <span className="text-[9px] font-normal text-slate-400 shrink-0">
                by Shivsastra
              </span>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings('general');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-ui text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Workspace Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings('accounts');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-ui text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Link2 className="w-4 h-4 text-slate-400" />
              <span>Connected Accounts</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenShortcuts();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-ui text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Command Palette</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">⌘K</span>
            </button>

            <button
              onClick={() => {
                onToggleTheme();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-ui text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-400" />
                )}
                <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
              </div>
            </button>
          </div>

          {/* External Links */}
          <div className="py-1 border-t border-slate-100">
            {onOpenLanding && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenLanding();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-ui text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                <Compass className="w-4 h-4 text-slate-400" />
                <span>Product Overview</span>
              </button>
            )}

            {onOpenSupport && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSupport();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-ui text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help & Documentation</span>
              </button>
            )}

            {onOpenPrivacy && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenPrivacy();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-ui text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Privacy & Security</span>
              </button>
            )}

            {onOpenTerms && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenTerms();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-ui text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Terms of Service</span>
              </button>
            )}
          </div>

          {/* Sign Out */}
          <div className="pt-1 border-t border-slate-100">
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-ui text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isDemoMode ? 'Exit Preview & Sign In' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
