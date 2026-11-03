import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Inbox, Zap, AlertCircle, ArrowRight, Lock } from 'lucide-react';

interface AuthPageProps {
  onGoogleSignIn: () => void;
  onExploreDemo: () => void;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenSupport?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onGoogleSignIn,
  onExploreDemo,
  isLoading = false,
  error,
  onClearError,
  onOpenPrivacy,
  onOpenTerms,
  onOpenSupport,
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignIn = () => {
    setIsRedirecting(true);
    onGoogleSignIn();
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background lighting */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-indigo-900/10 blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Top Brand Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-mono font-bold text-sm tracking-wider shadow-lg shadow-brand-500/20">
            JI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white leading-none">
                JIOSI Inbox
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                by Shivsastra
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Read less. Understand faster. Respond smarter.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Encrypted Session</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 sm:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Product Showcase & Pillars (Desktop) */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Enterprise Email Intelligence</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                Your inbox,{' '}
                <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-indigo-200 bg-clip-text text-transparent">
                  intelligently organized.
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
                Experience velocity-driven triage, multi-tenant workspace isolation, and automated action item extraction. Built for leaders who value clarity and focused attention.
              </p>
            </div>

            {/* Three Product Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <Inbox className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">One Focused Workspace</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Keyboard-first triage with 3-panel split view and distraction-free velocity.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">Clear Email Priorities</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instant triage scores and urgent action item extraction across threads.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">Secure Account Access</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct Google OpenID Connect verification without third-party mail brokers.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-2xl p-7 sm:p-9 backdrop-blur-md space-y-6">
              
              {/* Card Header */}
              <div className="text-left space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Welcome to JIOSI Inbox
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in securely with your Google account to access your tenant-isolated workspace.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div 
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 text-left space-y-1">
                    <p className="font-semibold text-rose-100">Authentication Failed</p>
                    <p className="text-rose-300 leading-relaxed">{error}</p>
                    {onClearError && (
                      <button
                        onClick={onClearError}
                        className="text-[11px] text-rose-400 hover:text-rose-200 underline mt-1 cursor-pointer block"
                      >
                        Dismiss and retry
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Primary Action: Continue with Google */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoading || isRedirecting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-slate-700 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 cursor-pointer min-h-[48px]"
                  aria-label="Continue with Google"
                >
                  {isRedirecting || isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span>{isRedirecting ? 'Redirecting to Google...' : 'Continue with Google'}</span>
                </button>

                {/* Security Verification Footnote */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google OpenID Connect · Tenant-Isolated</span>
                </div>
              </div>

              {/* Simulation Sandbox Divider */}
              <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Evaluating without an account?
                </p>
                <button
                  type="button"
                  onClick={onExploreDemo}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60 cursor-pointer min-h-[40px]"
                >
                  <span>Explore in Simulation Preview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>© 2026 JIOSI Inbox by Shivsastra. All rights reserved.</p>
        
        <div className="flex items-center gap-6">
          {onOpenPrivacy && (
            <button
              onClick={onOpenPrivacy}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          )}
          {onOpenTerms && (
            <button
              onClick={onOpenTerms}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          )}
          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Support
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

