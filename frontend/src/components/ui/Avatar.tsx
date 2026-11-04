import React from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  email?: string;
  src?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  email,
  src,
  size = 'md',
  status,
  className = '',
}) => {
  const getInitials = (str: string) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses: Record<AvatarSize, { container: string; text: string; dot: string }> = {
    xs: { container: 'w-6 h-6', text: 'text-[10px]', dot: 'w-1.5 h-1.5' },
    sm: { container: 'w-7 h-7', text: 'text-xs', dot: 'w-2 h-2' },
    md: { container: 'w-8 h-8', text: 'text-xs', dot: 'w-2.5 h-2.5' },
    lg: { container: 'w-10 h-10', text: 'text-sm font-semibold', dot: 'w-3 h-3' },
    xl: { container: 'w-12 h-12', text: 'text-base font-bold', dot: 'w-3.5 h-3.5' },
  };

  // Deterministic pastel color assignment
  const colors = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  ];

  const charCode = (name || email || 'A').charCodeAt(0) + (name || '').length;
  const colorClass = colors[charCode % colors.length];

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
  };

  return (
    <div className={`relative inline-flex shrink-0 ${sizeClasses[size].container} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover border border-slate-200 dark:border-slate-700"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-ui font-medium ${sizeClasses[size].text} ${colorClass} border border-black/5 dark:border-white/10 select-none`}
        >
          {getInitials(name || email || 'User')}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-slate-900 ${sizeClasses[size].dot} ${statusColors[status]}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};
