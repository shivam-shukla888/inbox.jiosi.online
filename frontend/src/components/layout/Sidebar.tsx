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
  X,
  ChevronDown,
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  currentFolder: EmailFolder;
  onSelectFolder: (folder: EmailFolder) => void;
  onOpenCompose: () => void;
  onOpenDailyBrief?: () => void;
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
  onOpenDailyBrief,
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
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out select-none shadow-sm lg:shadow-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand, Workspace & Compose */}
        <div className="p-4 space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-jiosi-indigo to-jiosi-violet flex items-center justify-center text-white font-ui font-bold text-xs tracking-wider shadow-sm shadow-indigo-100 shrink-0">
                JI
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-ui font-bold tracking-tight text-slate-900 leading-snug">
                  JIOSI Inbox
                </h1>
                <span className="text-[11px] font-medium text-slate-500 leading-none mt-0.5">
                  by Shivsastra
                </span>
              </div>
            </div>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Premium Workspace Selector */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100/70 transition-colors text-left cursor-pointer">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 text-jiosi-indigo border border-indigo-200 flex items-center justify-center font-ui text-[11px] font-bold shrink-0">
                {(isDemoMode ? 'S' : user?.fullName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-ui font-semibold text-slate-800 block truncate">
                  {isDemoMode ? 'Simulation Sandbox' : user?.defaultWorkspaceName || 'Primary Workspace'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Workspace Active" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Modern Compose Button (Violet) */}
          <Button
            variant="violet"
            size="md"
            onClick={onOpenCompose}
            icon={<Plus className="w-4 h-4" />}
            shortcut="C"
            className="w-full shadow-md shadow-violet-200/80 hover:shadow-lg transition-all font-ui font-semibold text-white"
          >
            New Message
          </Button>

          {onOpenDailyBrief && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenDailyBrief}
              icon={<Briefcase className="w-4 h-4 text-indigo-600" />}
              className="w-full font-ui text-xs font-semibold text-slate-700 hover:text-indigo-600 border-indigo-100 hover:border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all"
            >
              Daily Business Brief
            </Button>
          )}

          {/* Clean Navigation Items */}
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-ui transition-all cursor-pointer ${
                    isActive
                      ? 'bg-jiosi-selected text-jiosi-indigo font-bold border border-indigo-100 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-jiosi-indigo'
                          : item.colorClass || 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] tabular-nums ${
                        item.isUrgentAction
                          ? 'bg-rose-500 text-white font-bold shadow-2xs'
                          : isActive
                          ? 'bg-indigo-100 text-indigo-700 font-bold'
                          : 'bg-slate-100 text-slate-600'
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
        <div className="p-3 border-t border-slate-200 bg-white space-y-1.5">
          {/* Quick link to connected accounts */}
          <button
            onClick={() => {
              onOpenSettings('accounts');
              onCloseMobile?.();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-ui text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Link2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Connected Accounts</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
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
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-ui text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
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
