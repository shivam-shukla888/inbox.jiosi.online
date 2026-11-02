import React from 'react';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export const Kbd: React.FC<KbdProps> = ({ children, className = '' }) => {
  return (
    <kbd
      className={`inline-flex items-center justify-center font-mono text-[10px] font-medium uppercase px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-xs select-none ${className}`}
    >
      {children}
    </kbd>
  );
};
