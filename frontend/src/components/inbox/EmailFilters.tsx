import React from 'react';
import { CategoryFilter } from '../../types/email';
import { CheckSquare, Square, Mail, Clock } from 'lucide-react';
import { Kbd } from '../ui/Kbd';

interface EmailFiltersProps {
  currentFilter: CategoryFilter;
  onSelectFilter: (filter: CategoryFilter) => void;
  counts: Record<CategoryFilter, number>;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onMarkSelectedAsRead: () => void;
  hasSelection: boolean;
}

export const EmailFilters: React.FC<EmailFiltersProps> = ({
  currentFilter,
  onSelectFilter,
  counts,
  allSelected,
  onToggleSelectAll,
  onMarkSelectedAsRead,
  hasSelection,
}) => {
  const filters: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'vip', label: 'VIP' },
    { id: 'mentions', label: 'Mentions' },
  ];

  return (
    <div className="flex flex-col border-b border-border-subtle bg-canvas-alt/50">
      {/* Category Tabs */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1.5 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1">
          {filters.map((f) => {
            const active = currentFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFilter(f.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors select-none ${
                  active
                    ? 'bg-ink-primary text-canvas font-medium shadow-xs'
                    : 'text-ink-secondary hover:bg-canvas-surface'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] font-mono ${
                    active ? 'text-canvas/80' : 'text-ink-muted'
                  }`}
                >
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Batch Toolbar when selected or hovering */}
        <div className="flex items-center gap-1 text-ink-muted">
          <button
            onClick={onToggleSelectAll}
            className="p-1 rounded hover:bg-canvas-surface hover:text-ink-primary transition-colors text-xs flex items-center gap-1"
            title="Toggle Select All"
          >
            {allSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-ink-primary" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>

          {hasSelection && (
            <>
              <button
                onClick={onMarkSelectedAsRead}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs hover:bg-canvas-surface hover:text-ink-primary transition-colors"
                title="Mark selected as read (⌘E)"
              >
                <Mail className="w-3 h-3" />
                <Kbd>⌘E</Kbd>
              </button>
              <button
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs hover:bg-canvas-surface hover:text-ink-primary transition-colors opacity-60"
                title="Snooze (H)"
                disabled
              >
                <Clock className="w-3 h-3" />
                <Kbd>H</Kbd>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
