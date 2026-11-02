import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'brand' | 'ghost' | 'urgent' | 'danger' | 'ai';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  shortcut?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  shortcut,
  isLoading,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'text-[11px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm sm:text-base px-4 py-2.5 gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    brand:
      'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 border border-brand-600 shadow-sm focus:ring-brand-500 dark:bg-brand-500 dark:hover:bg-brand-600',
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 border border-slate-900 shadow-sm focus:ring-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:border-white',
    secondary:
      'bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 shadow-xs focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border-slate-700',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent focus:ring-slate-300 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
    urgent:
      'bg-action-urgent text-white hover:bg-action-urgentHover active:bg-red-700 border border-red-600 shadow-sm focus:ring-red-500',
    danger:
      'bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200 border border-red-200 focus:ring-red-400 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 dark:hover:bg-red-950/70',
    ai:
      'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 focus:ring-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/80 dark:hover:bg-indigo-950/60 shadow-xs',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children && <span>{children}</span>}
      {shortcut && (
        <kbd className="ml-1 text-[10px] font-mono opacity-70 px-1 py-0.2 bg-black/5 dark:bg-white/10 rounded">
          {shortcut}
        </kbd>
      )}
    </button>
  );
};
