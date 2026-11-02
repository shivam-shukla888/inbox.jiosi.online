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
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-lg border border-slate-200 dark:border-slate-700/80 focus:border-brand-500 dark:focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all py-2 ${
            icon ? 'pl-9' : 'pl-3'
          } ${suffix ? 'pr-12' : 'pr-3'} ${className}`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-2.5 flex items-center pointer-events-none">
            {suffix}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
