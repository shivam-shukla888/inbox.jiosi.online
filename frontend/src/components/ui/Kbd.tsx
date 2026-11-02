import React from 'react';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export const Kbd: React.FC<KbdProps> = ({ children, className = '' }) => {
  return (
    <kbd
      className={`inline-flex items-center justify-center font-mono text-[10px] font-medium uppercase px-1.5 py-0.5 rounded border border-border-subtle bg-white text-ink-muted shadow-xs select-none ${className}`}
    >
      {children}
    </kbd>
  );
};
