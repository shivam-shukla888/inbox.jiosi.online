import React, { useState } from 'react';
import { X, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string) => Promise<void>;
  onExploreDemo: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onExploreDemo,
}) => {
  const [email, setEmail] = useState('alex@jiosi.online');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSignIn(email.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please verify API availability.');
    } finally {
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

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-left space-y-1">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sign in to your intelligent email workspace to access your tenant-isolated threads and smart triage.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label htmlFor="signin-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Work Email Address
            </label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              isLoading={isSubmitting}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>

            <button
              type="button"
              onClick={() => {
                onExploreDemo();
                onClose();
              }}
              className="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Continue in Simulation Preview</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted Token Auth</span>
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

