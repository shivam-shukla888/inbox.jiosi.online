import React from 'react';

export type BadgeVariant = 'default' | 'urgent' | 'brand' | 'success' | 'warning' | 'info' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  dot = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    default: {
      container: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    urgent: {
      container: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
      dot: 'bg-red-500',
    },
    brand: {
      container: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800',
      dot: 'bg-brand-500',
    },
    success: {
      container: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    warning: {
      container: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    info: {
      container: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    outline: {
      container: 'bg-transparent text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const current = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border ${current.container} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />}
      {children}
    </span>
  );
};
