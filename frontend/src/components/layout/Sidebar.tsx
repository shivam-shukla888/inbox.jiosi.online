import React from 'react';
import { EmailFolder } from '../../types/email';
import { Button } from '../ui/Button';
import { HealthBadge } from '../ui/HealthBadge';
import {
  Inbox,
  AlertCircle,
  Clock,
  Send,
  Search,
  Plus,
  Settings,
  ShieldCheck,
  BarChart3,
  ChevronDown,
  Tag,
  X
} from 'lucide-react';

interface SidebarProps {
  currentFolder: EmailFolder;
  onSelectFolder: (folder: EmailFolder) => void;
  onOpenCompose: () => void;
  folderCounts: Record<EmailFolder, { total: number; unread: number }>;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  onSelectFolder,
  onOpenCompose,
  folderCounts,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems: { id: EmailFolder; label: string; icon: React.ReactNode }[] = [
    { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4 stroke-[1.75]" /> },
    { id: 'important', label: 'Important', icon: <AlertCircle className="w-4 h-4 stroke-[1.75]" /> },
    { id: 'needs-reply', label: 'Needs Reply', icon: <Send className="w-4 h-4 stroke-[1.75]" /> },
    { id: 'follow-ups', label: 'Follow-ups', icon: <Clock className="w-4 h-4 stroke-[1.75]" /> },
    { id: 'search', label: 'Search / All', icon: <Search className="w-4 h-4 stroke-[1.75]" /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-ink-primary/20 backdrop-blur-xs z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-canvas-alt border-r border-border-subtle flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand & Workspace */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-ink-primary flex items-center justify-center text-canvas font-mono font-bold text-xs tracking-wider">
                JI
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-ink-primary flex items-center gap-1">
                  JIOSI Inbox
                  <span className="text-[10px] font-mono font-normal text-ink-muted px-1.5 py-0.2 bg-canvas-surface rounded border border-border-subtle">
                    v0.1
                  </span>
                </h1>
              </div>
            </div>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1 text-ink-muted hover:text-ink-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Workspace Pill */}
          <button className="w-full flex items-center justify-between px-2.5 py-1.5 rounded border border-border-subtle bg-white hover:bg-canvas-surface text-left transition-colors">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-brand-sageLight text-brand-sage flex items-center justify-center font-mono text-[10px] font-medium">
                A
              </div>
              <span className="text-xs font-medium text-ink-primary truncate">
                alex@jiosi.online
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted shrink-0" />
          </button>

          {/* High-Contrast Compose Action */}
          <Button
            variant="primary"
            className="w-full justify-between shadow-subtle"
            icon={<Plus className="w-4 h-4 stroke-[2]" />}
            shortcut="C"
            onClick={onOpenCompose}
          >
            Compose
          </Button>

          {/* Primary Navigation */}
          <nav className="space-y-0.5 pt-2">
            <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-ink-subtle">
              Navigation
            </p>
            {navItems.map((item) => {
              const active = currentFolder === item.id;
              const count = folderCounts[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectFolder(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    active
                      ? 'bg-canvas-focus text-ink-primary font-medium'
                      : 'text-ink-secondary hover:bg-canvas-surface'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-ink-primary' : 'text-ink-muted'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {count && count.total > 0 && (
                    <div className="flex items-center gap-1.5">
                      {count.unread > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-primary" />
                      )}
                      <span className="font-mono text-[11px] text-ink-muted">
                        {count.total}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary Labels / Quick filters */}
          <div className="space-y-0.5 pt-2">
            <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-ink-subtle">
              Quick Tags
            </p>
            <div className="flex flex-col space-y-0.5 text-xs text-ink-muted">
              <span className="flex items-center gap-2 px-2.5 py-1 rounded hover:bg-canvas-surface cursor-pointer">
                <Tag className="w-3.5 h-3.5 text-brand-amber" /> Fundraising
              </span>
              <span className="flex items-center gap-2 px-2.5 py-1 rounded hover:bg-canvas-surface cursor-pointer">
                <Tag className="w-3.5 h-3.5 text-brand-sage" /> Design
              </span>
              <span className="flex items-center gap-2 px-2.5 py-1 rounded hover:bg-canvas-surface cursor-pointer">
                <Tag className="w-3.5 h-3.5 text-brand-slate" /> Finance
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Telemetry, Accounts & Settings */}
        <div className="p-4 border-t border-border-subtle space-y-3">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-2 px-2 py-1 text-xs text-ink-secondary hover:bg-canvas-surface rounded transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-ink-muted" />
              <span>Connected Accounts</span>
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1 text-xs text-ink-secondary hover:bg-canvas-surface rounded transition-colors">
              <BarChart3 className="w-3.5 h-3.5 text-ink-muted" />
              <span>Productivity Analytics</span>
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1 text-xs text-ink-secondary hover:bg-canvas-surface rounded transition-colors">
              <Settings className="w-3.5 h-3.5 text-ink-muted" />
              <span>Settings</span>
            </button>
          </div>

          <div className="pt-2 border-t border-border-subtle flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-ink-muted font-mono">
              <span>Inbox Zero Avg:</span>
              <span className="text-ink-primary font-medium">18m</span>
            </div>
            {/* Live API Health Monitor */}
            <HealthBadge />
          </div>
        </div>
      </aside>
    </>
  );
};
