import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-ink-muted">
      <div
        className={`${sizeClasses[size]} border-border-subtle border-t-ink-primary rounded-full animate-spin mb-3`}
      />
      {label && <p className="text-xs font-mono">{label}</p>}
    </div>
  );
};
