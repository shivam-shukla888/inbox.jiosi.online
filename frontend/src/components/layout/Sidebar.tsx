import React from 'react';
import { EmailFolder } from '../../types/email';
import { AuthSessionData } from '../../api/client';
import { Button } from '../ui/Button';
import { HealthBadge } from '../ui/HealthBadge';
import {
  Inbox,
  Send,
  Star,
  Clock,
  SendHorizontal,
  FileEdit,
  Plus,
  Settings,
  Link2,
  X
} from 'lucide-react';

interface SidebarProps {
  currentFolder: EmailFolder;
  onSelectFolder: (folder: EmailFolder) => void;
  onOpenCompose: () => void;
  onOpenSettings: (tab?: string) => void;
  folderCounts: Record<EmailFolder, { total: number; unread?: number }>;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  user?: AuthSessionData | null;
  isDemoMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  onSelectFolder,
  onOpenCompose,
  onOpenSettings,
  folderCounts,
  isOpenMobile = false,
  onCloseMobile,
  user,
  isDemoMode = false,
}) => {
  const navItems: {
    id: EmailFolder;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isUrgentAction?: boolean;
    badgeCount?: number;
    colorClass?: string;
  }[] = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      badgeCount: folderCounts.inbox?.unread ?? 0,
    },
    {
      id: 'needs-reply',
      label: 'Needs Reply',
      icon: Send,
      isUrgentAction: true,
      badgeCount: folderCounts['needs-reply']?.total ?? 0,
      colorClass: 'text-red-500',
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
      badgeCount: folderCounts.starred?.total ?? 0,
      colorClass: 'text-amber-500',
    },
    {
      id: 'snoozed',
      label: 'Snoozed',
      icon: Clock,
      badgeCount: folderCounts.snoozed?.total ?? 0,
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: SendHorizontal,
      badgeCount: folderCounts.sent?.total ?? 0,
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: FileEdit,
      badgeCount: folderCounts.drafts?.total ?? 0,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand, Workspace & Compose */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-mono font-bold text-xs tracking-wider shadow-sm shrink-0">
                JI
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                  JIOSI Inbox
                </h1>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  by Shivsastra
                </span>
              </div>
            </div>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Workspace Pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-left">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-mono text-[10px] font-semibold shrink-0">
                {(isDemoMode ? 'S' : user?.fullName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                {isDemoMode ? 'demo@simulation.preview' : user?.email || 'Authenticated User'}
              </span>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-500'} shrink-0`}
              title={isDemoMode ? 'Simulation Sandbox' : 'Connected'}
            />
          </div>

          {/* High-Contrast Compose Action with Purple Brand Style */}
          <Button
            variant="brand"
            size="md"
            onClick={onOpenCompose}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            shortcut="C"
            className="w-full justify-between shadow-xs font-medium"
          >
            New Message
          </Button>

          {/* Primary Navigation List */}
          <nav className="space-y-1 pt-1" aria-label="Mailbox folders">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentFolder === item.id;
              const isUrgent = item.isUrgentAction && (item.badgeCount ?? 0) > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectFolder(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 stroke-[1.75] ${
                        isActive
                          ? 'text-brand-600 dark:text-brand-400'
                          : isUrgent
                          ? 'text-red-500'
                          : item.colorClass || 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {/* Red Action Indicator for Needs Reply vs Neutral for unread */}
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-all ${
                        isUrgent
                          ? 'bg-red-500 text-white shadow-xs'
                          : isActive
                          ? 'bg-brand-200 dark:bg-brand-900 text-brand-800 dark:text-brand-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Settings, Connected Accounts & System Health */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="space-y-1">
            <button
              onClick={() => onOpenSettings('accounts')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Connected Accounts</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>

            <button
              onClick={() => onOpenSettings('general')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings</span>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <HealthBadge />
          </div>
        </div>
      </aside>
    </>
  );
};
