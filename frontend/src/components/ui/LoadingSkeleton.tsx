import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'thread' | 'message' | 'card';
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 5,
  type = 'thread',
  className = '',
}) => {
  if (type === 'message') {
    return (
      <div className={`p-6 space-y-6 animate-pulse ${className}`} aria-label="Loading email details...">
        <div className="space-y-3">
          <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-sm" />
              <div className="h-3 w-1/3 bg-slate-150 dark:bg-slate-850 rounded-sm" />
            </div>
          </div>
        </div>
        <div className="space-y-2.5 pt-4 border-t border-slate-150 dark:border-slate-800">
          <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-sm" />
          <div className="h-3.5 w-11/12 bg-slate-200 dark:bg-slate-800 rounded-sm" />
          <div className="h-3.5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-sm" />
          <div className="h-3.5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className={`divide-y divide-slate-100 dark:divide-slate-800/80 ${className}`} aria-label="Loading threads...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 space-y-2.5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-sm" />
            </div>
            <div className="h-3 w-12 bg-slate-150 dark:bg-slate-850 rounded-sm" />
          </div>
          <div className="h-3.5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-sm" />
          <div className="h-3 w-full bg-slate-150 dark:bg-slate-850 rounded-sm" />
        </div>
      ))}
    </div>
  );
};
