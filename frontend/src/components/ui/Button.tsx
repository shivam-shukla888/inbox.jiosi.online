import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-1 focus:ring-ink-primary disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-sm px-4 py-2 gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-ink-primary text-canvas hover:bg-ink-secondary border border-ink-primary',
    secondary: 'bg-white text-ink-primary hover:bg-canvas-surface border border-border-subtle shadow-subtle',
    ghost: 'bg-transparent text-ink-secondary hover:bg-canvas-surface border border-transparent',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
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
      <span>{children}</span>
      {shortcut && (
        <kbd className="ml-1 text-[10px] font-mono opacity-60">[{shortcut}]</kbd>
      )}
    </button>
  );
};
