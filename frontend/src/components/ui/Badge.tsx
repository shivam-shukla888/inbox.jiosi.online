import React from 'react';

type BadgeVariant = 'default' | 'sage' | 'amber' | 'slate' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-canvas-surface text-ink-secondary border border-border-subtle',
    sage: 'bg-brand-sageLight text-brand-sage border border-brand-sage/20',
    amber: 'bg-brand-amberLight text-brand-amber border border-brand-amber/20',
    slate: 'bg-brand-slateLight text-brand-slate border border-brand-slate/20',
    outline: 'bg-transparent text-ink-muted border border-border-subtle',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
