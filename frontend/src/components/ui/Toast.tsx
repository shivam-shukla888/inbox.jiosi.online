import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id?: string;
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 3500,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-brand-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900',
    error: 'border-red-200 dark:border-red-800/80 bg-white dark:bg-slate-900',
    info: 'border-brand-200 dark:border-brand-800/80 bg-white dark:bg-slate-900',
  };

  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-dropdown animate-fade-in ${borders[type]} text-xs font-medium text-slate-800 dark:text-slate-100 max-w-sm`}
    >
      {icons[type]}
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

