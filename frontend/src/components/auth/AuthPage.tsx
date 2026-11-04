import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen w-full bg-[#FAF9F6] text-[#111112] flex flex-col justify-between selection:bg-[#B8481D]/20 selection:text-[#B8481D] font-sans">
      {/* Top Navigation & Brand Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#111112] flex items-center justify-center text-white font-mono font-bold text-sm tracking-wider shadow-xs">
            JI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-[#111112] leading-none">
                JIOSI Inbox
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#FAF2ED] text-[#B8481D] border border-[#F0D5C7]">
                by Shivsastra
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] mt-0.5 font-normal hidden sm:block">
              Read less. Understand faster. Respond smarter.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#78716C]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E6E3DC] text-[11px] font-medium text-[#57534E] shadow-2xs">
            <Lock className="w-3 h-3 text-[#B8481D]" />
            <span>Encrypted Session · TLS 1.3</span>
          </span>
        </div>
      </header>

      {/* Main Two-Column Editorial Stage */}
      <main className="w-full max-w-7xl mx-auto px-6 py-6 sm:py-12 lg:py-16 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Brand Story & Editorial Manifesto */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest font-semibold text-[#B8481D]">
                <span>Intelligent Email Workspace</span>
              </div>
              
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#111112] leading-[1.12] tracking-tight">
                Your inbox.
                <br />
                <span className="italic text-[#292524]">A clearer way to work.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-[#57534E] leading-relaxed max-w-xl font-normal">
                Bring clarity to every conversation. Prioritize what matters, understand messages faster, and work from one intelligent email workspace.
              </p>
            </div>

            {/* Three Product Benefits with Hairline Dividers */}
            <div className="pt-4 space-y-4 max-w-xl">
              <div className="pt-4 border-t border-[#E6E3DC] flex items-start gap-4">
                <span className="font-mono text-xs font-semibold text-[#B8481D] tracking-wider pt-0.5 shrink-0">
                  01
                </span>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold text-[#111112]">
                    Focused Workspace
                  </h2>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Organize conversations in one clean workspace.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6E3DC] flex items-start gap-4">
                <span className="font-mono text-xs font-semibold text-[#B8481D] tracking-wider pt-0.5 shrink-0">
                  02
                </span>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold text-[#111112]">
                    Clear Priorities
                  </h2>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Understand important messages without unnecessary noise.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6E3DC] flex items-start gap-4">
                <span className="font-mono text-xs font-semibold text-[#B8481D] tracking-wider pt-0.5 shrink-0">
                  03
                </span>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold text-[#111112]">
                    Secure Access
                  </h2>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Access your workspace through secure Google authentication.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean White Authentication Panel */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="rounded-2xl bg-white border border-[#E6E3DC] shadow-[0_4px_24px_-4px_rgba(17,17,18,0.06),0_1px_3px_rgba(17,17,18,0.04)] p-8 sm:p-10 space-y-6 text-left">
              
              {/* Card Header */}
              <div className="space-y-1.5">
                <h2 className="text-2xl font-serif font-normal tracking-tight text-[#111112]">
                  Welcome to JIOSI Inbox
                </h2>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Sign in to your workspace securely.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div 
                  role="alert"
                  className="p-3.5 rounded-xl bg-[#FDF4EF] border border-[#EAC4B0] text-[#8C3413] text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-[#B8481D] shrink-0 mt-0.5" />
                  <div className="flex-1 text-left space-y-1">
                    <p className="font-semibold text-[#8C3413]">Authentication Failed</p>
                    <p className="text-[#A04018] leading-relaxed">{error}</p>
                    {onClearError && (
                      <button
                        onClick={onClearError}
                        className="text-[11px] text-[#B8481D] hover:text-[#8C3413] underline font-medium mt-1 cursor-pointer block"
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
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-[#DCD8CF] hover:border-[#BFB9AD] bg-white hover:bg-[#F9F8F5] active:bg-[#F2EFE8] text-[#111112] font-medium text-sm transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#B8481D]/30 focus:border-[#B8481D] disabled:opacity-50 cursor-pointer min-h-[48px]"
                  aria-label="Continue with Google"
                >
                  {isRedirecting || isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#111112] border-t-transparent rounded-full animate-spin" />
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

                {/* Security Verification Caption */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#78716C]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B8481D]" />
                  <span>Secure sign-in powered by Google OpenID Connect.</span>
                </div>
              </div>

              {/* Simulation Preview Sandbox */}
              <div className="pt-4 border-t border-[#E6E3DC] text-center space-y-2">
                <p className="text-xs text-[#78716C]">
                  Evaluating without an account?
                </p>
                <button
                  type="button"
                  onClick={onExploreDemo}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium text-[#57534E] hover:text-[#111112] bg-[#FAF9F6] hover:bg-[#F2EFE8] rounded-xl transition-colors border border-[#E6E3DC] hover:border-[#DCD8CF] cursor-pointer min-h-[40px]"
                >
                  <span>Explore in Simulation Preview</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#B8481D]" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Understated Editorial Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-[#E6E3DC] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
        <p>© 2026 JIOSI Inbox by Shivsastra. All rights reserved.</p>
        
        <div className="flex items-center gap-6">
          {onOpenPrivacy && (
            <button
              onClick={onOpenPrivacy}
              className="hover:text-[#111112] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          )}
          {onOpenTerms && (
            <button
              onClick={onOpenTerms}
              className="hover:text-[#111112] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          )}
          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="hover:text-[#111112] transition-colors cursor-pointer"
            >
              Support
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
