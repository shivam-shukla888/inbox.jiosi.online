import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No messages',
  description = 'Your inbox is clear and up to date.',
  icon = <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-500 stroke-[1.5]" />,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center h-full min-h-[280px]">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4 leading-relaxed">{description}</p>
      {action}
    </div>
  );
};
