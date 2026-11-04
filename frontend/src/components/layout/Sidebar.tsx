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
      colorClass: 'text-action-urgent',
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-jiosi-indigo to-jiosi-violet flex items-center justify-center text-white font-ui font-bold text-xs tracking-wider shadow-sm shrink-0">
                JI
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-ui font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                  JIOSI Inbox
                </h1>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  by Shivsastra
                </span>
              </div>
            </div>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Workspace Pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-left">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-jiosi-violet flex items-center justify-center font-mono text-[10px] font-semibold shrink-0">
                {(isDemoMode ? 'S' : user?.fullName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                {isDemoMode ? 'Simulation Sandbox' : user?.defaultWorkspaceName || 'Default Workspace'}
              </span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Active Workspace" />
          </div>

          {/* Compose Primary Action Button */}
          <Button
            variant="brand"
            size="md"
            onClick={onOpenCompose}
            icon={<Plus className="w-4 h-4" />}
            shortcut="C"
            className="w-full shadow-xs hover:shadow transition-all font-ui"
          >
            New Message
          </Button>

          {/* Navigation Items */}
          <nav className="space-y-1 pt-1" aria-label="Mail folders">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentFolder === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectFolder(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-ui font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-jiosi-selected dark:bg-slate-800 text-jiosi-indigo dark:text-indigo-300 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-jiosi-indigo dark:text-indigo-400'
                          : item.colorClass || 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] tabular-nums ${
                        item.isUrgentAction
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-semibold'
                          : isActive
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold'
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

        {/* Bottom Section: Connected Accounts, Health & Settings */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          {/* Quick link to connected accounts */}
          <button
            onClick={() => {
              onOpenSettings('accounts');
              onCloseMobile?.();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-ui text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Link2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Connected Accounts</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              Active
            </span>
          </button>

          {/* Quick link to Settings */}
          <button
            aria-label="Settings"
            onClick={() => {
              onOpenSettings('general');
              onCloseMobile?.();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-ui text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400" aria-hidden="true">G ,</span>
          </button>

          {/* Backend / DB Health Pill */}
          <div className="pt-2">
            <HealthBadge />
          </div>
        </div>
      </aside>
    </>
  );
};
