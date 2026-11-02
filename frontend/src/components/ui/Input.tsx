import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, suffix, className = '', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-ink-muted">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-white text-ink-primary placeholder:text-ink-subtle text-sm rounded border border-border-subtle focus:border-ink-primary focus:outline-none transition-colors py-1.5 ${
            icon ? 'pl-9' : 'pl-3'
          } ${suffix ? 'pr-12' : 'pr-3'} ${className}`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-2 flex items-center pointer-events-none">
            {suffix}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
