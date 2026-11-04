import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Kbd } from './Kbd';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  shortcut?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  shortcut = '⌘K',
  placeholder = 'Search emails, subjects, or commands...',
  className = '',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
        <Search className="w-4 h-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 focus:border-jiosi-indigo focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-jiosi-indigo/20 transition-all py-2 pl-9.5 pr-14"
        {...props}
      />

      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcut ? (
        <div className="absolute right-3 hidden sm:flex items-center pointer-events-none">
          <Kbd>{shortcut}</Kbd>
        </div>
      ) : null}
    </div>
  );
};
