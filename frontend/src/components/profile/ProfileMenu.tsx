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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        aria-label="User Account Menu"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-mono text-xs font-semibold shadow-xs">
            AR
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="User profile options"
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-dropdown z-50 py-1.5 animate-in fade-in-50 zoom-in-95"
        >
          {/* Header Info */}
          <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-mono text-xs font-semibold">
                AR
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Alex Rivera
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  alex@jiosi.online
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-brand-500" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                  Workspace Admin · Team Tier
                </span>
              </div>
              <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500">
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
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings('accounts');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
            >
              <Link2 className="w-4 h-4 text-slate-400" />
              <span>Connected Accounts</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenShortcuts();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Keyboard Shortcuts</span>
            </button>

            {onOpenLanding && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenLanding();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
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
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help & Support</span>
              </button>
            )}

            {onOpenPrivacy && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenPrivacy();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Privacy Policy</span>
              </button>
            )}

            {onOpenTerms && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenTerms();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Terms of Service</span>
              </button>
            )}
          </div>

          {/* Theme switcher */}
          <div className="py-1.5 px-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              {isDark ? <Moon className="w-3.5 h-3.5 text-brand-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>Theme: {isDark ? 'Dark' : 'Light'}</span>
            </span>
            <button
              onClick={onToggleTheme}
              className="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
            >
              Switch to {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Sign Out */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
