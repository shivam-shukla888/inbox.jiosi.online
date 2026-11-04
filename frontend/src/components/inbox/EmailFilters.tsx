import React from 'react';
import { CategoryFilter } from '../../types/email';
import { CheckSquare, Square, Mail, Archive } from 'lucide-react';

interface EmailFiltersProps {
  currentFilter: CategoryFilter;
  onSelectFilter: (filter: CategoryFilter) => void;
  counts: Record<CategoryFilter, number>;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onMarkSelectedAsRead: () => void;
  onArchiveSelected?: () => void;
  hasSelection: boolean;
}

export const EmailFilters: React.FC<EmailFiltersProps> = ({
  currentFilter,
  onSelectFilter,
  counts,
  allSelected,
  onToggleSelectAll,
  onMarkSelectedAsRead,
  onArchiveSelected,
  hasSelection,
}) => {
  const filters: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'needs-reply', label: 'Needs Reply' },
    { id: 'vip', label: 'VIP' },
  ];

  return (
    <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      <div className="flex items-center justify-between px-3.5 py-2.5 gap-2 overflow-x-auto">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5">
          {filters.map((f) => {
            const active = currentFilter === f.id;
            const isNeedsReplyTab = f.id === 'needs-reply';
            return (
              <button
                key={f.id}
                onClick={() => onSelectFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-ui transition-all select-none cursor-pointer ${
                  active
                    ? isNeedsReplyTab
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900/40 shadow-2xs'
                      : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums ${
                    active
                      ? isNeedsReplyTab
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-300 dark:text-slate-600 font-bold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {counts[f.id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-Select Toolbar */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <button
            onClick={onToggleSelectAll}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="Toggle Select All"
            aria-label="Toggle Select All"
          >
            {allSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-jiosi-indigo dark:text-indigo-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>

          {hasSelection && (
            <div className="flex items-center gap-1">
              <button
                onClick={onMarkSelectedAsRead}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-xs flex items-center cursor-pointer"
                title="Mark selected as read"
                aria-label="Mark selected as read"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
              {onArchiveSelected && (
                <button
                  onClick={onArchiveSelected}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-xs flex items-center cursor-pointer"
                  title="Archive selected"
                  aria-label="Archive selected"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
