import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn?: () => void;
  onExploreDemo: () => void;
  authError?: string | null;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onExploreDemo,
  authError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(authError || null);

  if (!isOpen) return null;

  const handleGoogleClick = () => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (onGoogleSignIn) {
        onGoogleSignIn();
      } else {
        window.location.href = apiClient.getGoogleOAuthUrl();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to initiate Google sign-in.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-mono font-bold text-sm tracking-wider shadow-sm shrink-0">
              JI
            </div>
            <div>
              <h2 id="signin-title" className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                JIOSI Inbox
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                by Shivsastra
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close sign-in dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Actions */}
        <div className="p-6 space-y-5">
          <div className="text-left space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Sign in with your Google account
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Authenticate securely via Google OpenID Connect to access your tenant-isolated workspace and intelligent email triage.
            </p>
          </div>

          {(error || authError) && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error || authError}</span>
            </div>
          )}

          <div className="space-y-3 pt-1">
            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-100 font-medium text-sm transition-all shadow-xs hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Simulation Preview Button */}
            <button
              type="button"
              onClick={() => {
                onExploreDemo();
                onClose();
              }}
              className="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Explore in Simulation Preview</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Google OpenID Connect</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>by Shivsastra</span>
          </div>
        </div>
      </div>
    </div>
  );
};
