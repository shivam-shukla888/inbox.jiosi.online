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
  icon = <Inbox className="w-8 h-8 text-ink-subtle stroke-[1.5]" />,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
      <div className="w-12 h-12 rounded-full bg-canvas-surface flex items-center justify-center mb-4 border border-border-subtle">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-ink-primary mb-1">{title}</h3>
      <p className="text-xs text-ink-muted max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
};
