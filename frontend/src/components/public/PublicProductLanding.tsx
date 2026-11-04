import React, { useState } from 'react';
import {
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
  Command,
  CheckCircle2,
  Server,
  Layers,
  ChevronRight,
  ExternalLink,
  Inbox,
  KeyRound,
  Database,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PublicProductLandingProps {
  onLaunchApp: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenSupport: () => void;
}

export const PublicProductLanding: React.FC<PublicProductLandingProps> = ({
  onLaunchApp,
  onOpenPrivacy,
  onOpenTerms,
  onOpenSupport,
}) => {
  const [activeTab, setActiveTab] = useState<'threads' | 'ai' | 'shortcuts'>('threads');

  return (
    <div className="min-h-full overflow-y-auto bg-jiosi-midnight text-slate-100 selection:bg-jiosi-violet/30 selection:text-white font-sans antialiased">
      {/* 1. MINIMAL RESPONSIVE HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-jiosi-midnight/90 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-jiosi-indigo to-jiosi-violet flex items-center justify-center text-white font-ui font-bold text-sm tracking-wider shadow-md shadow-jiosi-indigo/20">
              JI
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-ui font-bold text-base tracking-tight text-white leading-tight">
                  JIOSI Inbox
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-jiosi-violet/10 text-jiosi-violet border border-jiosi-violet/30 font-medium">
                  v0.1 LTS
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 leading-none mt-0.5">
                by Shivsastra
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#showcase" className="hover:text-white transition-colors">Workspace</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#security" className="hover:text-white transition-colors">Security & Stack</a>
            <button onClick={onOpenSupport} className="hover:text-white transition-colors text-xs font-medium">
              Docs
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLaunchApp}
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors hidden sm:inline-block"
            >
              Sign In
            </button>
            <Button
              variant="violet"
              size="sm"
              onClick={onLaunchApp}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              className="shadow-md shadow-jiosi-violet/25 font-ui"
            >
              Open Workspace
            </Button>
          </div>
        </div>
      </header>

      {/* 2. CINEMATIC HERO SECTION */}
      <section className="relative pt-20 pb-24 px-4 sm:px-8 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-jiosi-indigo/20 via-jiosi-violet/15 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-ui text-slate-200 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-jiosi-violet animate-pulse" />
            <span className="font-medium text-slate-300">Next-Generation Intelligent Email Workspace</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-jiosi-lavender font-mono text-[11px]">Free Tier · Open APIs</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-medium tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            Your inbox. <br className="hidden sm:inline" />
            <span className="italic font-serif bg-gradient-to-r from-jiosi-lavender via-white to-jiosi-lavender bg-clip-text text-transparent">
              Finally under control.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            <strong className="font-semibold text-white">JIOSI Inbox by Shivsastra</strong> replaces noisy, cluttered mail clients with a calm, high-velocity workstation. Engineered with Spring Boot, Neon PostgreSQL, and zero surveillance scripts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              variant="violet"
              size="lg"
              onClick={onLaunchApp}
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto px-7 py-3 text-sm font-semibold tracking-wide shadow-lg shadow-jiosi-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Launch JIOSI Inbox
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onOpenSupport}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium border-slate-700 hover:bg-slate-800 text-slate-200"
            >
              Explore Architecture
            </Button>
          </div>

          {/* Quick Credibility Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success" />
              <span>Keyboard-first velocity</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success" />
              <span>Contextual AI summarization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success" />
              <span>Tenant-isolated security</span>
            </div>
          </div>
        </div>

        {/* 3. APP SCREENSHOT / INTERACTIVE PREVIEW FRAME */}
        <div id="showcase" className="mt-14 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 backdrop-blur-xl shadow-2xl overflow-hidden p-2 ring-1 ring-white/10">
            {/* Window titlebar controls */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] font-mono text-slate-400 ml-2">inbox.jiosi.online — 3-Panel High Velocity Workspace</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">⌘K Palette</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">J/K Nav</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">E Archive</span>
              </div>
            </div>

            {/* Live Visual Showcase */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[16/9] max-h-[640px]">
              <img
                src="/preview/dashboard-full.png"
                alt="JIOSI Inbox Workspace Dashboard"
                className="w-full h-full object-cover object-top opacity-95 transition-opacity"
                onError={(e) => {
                  // Fallback to simulated UI representation if image file is not found
                  e.currentTarget.style.display = 'none';
                  const fallback = document.getElementById('dashboard-fallback-mock');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />

              {/* Dynamic CSS Mockup Fallback (guarantees a 100% sharp render under any condition) */}
              <div
                id="dashboard-fallback-mock"
                style={{ display: 'none' }}
                className="w-full h-full flex-col bg-jiosi-cloud text-slate-900 p-4 font-sans select-none overflow-hidden"
              >
                <div className="h-10 border-b border-slate-200 bg-white flex items-center justify-between px-4 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-ui font-bold text-sm text-slate-900">JIOSI Inbox</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">All Mail (24)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-48 h-6 bg-slate-100 rounded border border-slate-200 flex items-center px-2 text-[10px] text-slate-400">
                      Search emails (⌘K)...
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                  <div className="w-44 border-r border-slate-200 bg-white p-2 space-y-1 text-xs">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium flex justify-between">
                      <span>Inbox</span>
                      <span>12</span>
                    </div>
                    <div className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 flex justify-between">
                      <span>Starred</span>
                      <span>3</span>
                    </div>
                    <div className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 flex justify-between">
                      <span>Drafts</span>
                      <span>1</span>
                    </div>
                  </div>
                  <div className="w-80 border-r border-slate-200 bg-white p-2 space-y-2 overflow-hidden">
                    <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-900">Engineering Review</span>
                        <span className="text-[10px] text-slate-500">10:42 AM</span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-1 mt-0.5">Production verification for Google OAuth and Gmail integration</p>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-900">Security Audit</span>
                        <span className="text-[10px] text-slate-500">Yesterday</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">Workspace isolation and session state verification completed</p>
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-6 space-y-4">
                    <h2 className="text-xl font-display font-semibold text-slate-900">Production verification for Google OAuth and Gmail integration</h2>
                    <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100 text-xs text-violet-900">
                      <div className="font-semibold flex items-center gap-1.5 mb-1 text-violet-950">
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" /> AI Executive Summary
                      </div>
                      Google OAuth redirect URI alignment and incremental Gmail read-only scoping are verified on Render and Vercel.
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Floating Feature Pills on hover */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-ui font-semibold text-white">Experience the Flow:</span>
                  <button
                    onClick={() => setActiveTab('threads')}
                    className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'threads' ? 'bg-jiosi-violet text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    3-Panel Triage
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'ai' ? 'bg-jiosi-violet text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Contextual AI
                  </button>
                  <button
                    onClick={() => setActiveTab('shortcuts')}
                    className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'shortcuts' ? 'bg-jiosi-violet text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Superhuman Shortcuts
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={onLaunchApp}
                  icon={<ArrowRight className="w-3 h-3" />}
                  className="bg-white text-slate-900 hover:bg-slate-100 font-ui"
                >
                  Test Sandbox
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VERIFIED CAPABILITIES & FEATURES GRID */}
      <section id="features" className="py-20 px-4 sm:px-8 border-t border-slate-800/80 bg-slate-950/60 relative">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-widest text-jiosi-violet font-semibold">
              Engineered For Productivity
            </h2>
            <p className="text-3xl sm:text-4xl font-display font-normal text-white">
              Every detail optimized for focus.
            </p>
            <p className="text-sm text-slate-400 font-light">
              Designed from first principles to remove latency, visual noise, and inbox fatigue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-jiosi-indigo/10 border border-jiosi-indigo/30 flex items-center justify-center text-jiosi-indigo group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-ui font-semibold text-white">Sub-Millisecond Keyboard Velocity</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                Full Superhuman and Vim shortcut parity. Navigate emails with <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">J</kbd> and <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">K</kbd>, archive with <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">E</kbd>, compose with <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">C</kbd>, and snooze with <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">H</kbd>.
              </p>
              <div className="pt-2 text-[11px] font-mono text-jiosi-violet flex items-center gap-1.5">
                <span>Zero mouse movement required</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-jiosi-violet/10 border border-jiosi-violet/30 flex items-center justify-center text-jiosi-violet group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-ui font-semibold text-white">Action-Oriented AI Summaries</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                Turn 20-message threads into 3-bullet executive briefs instantly. Extract pending action items and drafting suggestions with full human-in-the-loop oversight.
              </p>
              <div className="pt-2 text-[11px] font-mono text-jiosi-lavender flex items-center gap-1.5">
                <span>Zero model training on user data</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Command className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-ui font-semibold text-white">Unified Command Palette (⌘K)</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                Fuzzy search across mail folders, settings, labels, contacts, and quick actions from anywhere in the app with one keystroke.
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span>Instant sub-string search</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-ui font-semibold text-white">Unified Inbox & Gmail Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                Securely connect Gmail accounts via official Google OAuth with strictly read-only <code className="text-amber-300 font-mono text-[10px]">gmail.readonly</code> permissions. Ingest, search, and view your emails in one place.
              </p>
              <div className="pt-2 text-[11px] font-mono text-amber-400 flex items-center gap-1.5">
                <span>OAuth 2.0 PKCE Protected</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-ui font-semibold text-white">Strict Multi-Tenant Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                Every query enforces workspace boundaries via server-side security interceptors and PostgreSQL foreign keys. Data from different tenants can never collide or leak.
              </p>
              <div className="pt-2 text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
                <span>X-Workspace-Id verified</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-ui font-semibold text-white">Zero Surveillance & Advertising</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                No third-party trackers, meta pixels, behavioral analytics beacons, or data monetization. We are in the productivity software business, not the surveillance business.
              </p>
              <div className="pt-2 text-[11px] font-mono text-rose-400 flex items-center gap-1.5">
                <span>Your mailbox remains yours</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EDITORIAL PRODUCT WORKFLOW: COLLECT -> ORGANISE -> UNDERSTAND -> ACT */}
      <section id="workflow" className="py-24 px-4 sm:px-8 border-t border-slate-800/80 bg-jiosi-midnight relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-widest text-jiosi-violet font-semibold">
              The JIOSI Philosophy
            </h2>
            <p className="text-3xl sm:text-4xl font-display font-normal text-white">
              From inbox chaos to inbox zero.
            </p>
            <p className="text-sm text-slate-400 font-light">
              A deliberate four-stage workflow designed for clarity and rapid execution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <span className="text-2xl font-mono font-bold text-slate-700">01</span>
              <h4 className="text-base font-ui font-semibold text-white">Collect</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Continuous background ingestion aggregates messages from Gmail and internal workspace sources into a unified thread model.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <span className="text-2xl font-mono font-bold text-slate-700">02</span>
              <h4 className="text-base font-ui font-semibold text-white">Organise</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Automatic priority labeling highlights VIP senders, urgent deadlines, and emails waiting for your response with visual pill tags.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <span className="text-2xl font-mono font-bold text-slate-700">03</span>
              <h4 className="text-base font-ui font-semibold text-white">Understand</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Thread-level AI summaries break down complex correspondence into key points and concrete deliverables without reading 30 replies.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <span className="text-2xl font-mono font-bold text-jiosi-violet">04</span>
              <h4 className="text-base font-ui font-semibold text-white">Act</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Reply in seconds using contextual tone drafting, quick keyboard archiving, or scheduling follow-ups with one tap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED TECHNOLOGY & SECURITY DISCLOSURES */}
      <section id="security" className="py-20 px-4 sm:px-8 border-t border-slate-800/80 bg-slate-950/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
              Production Architecture
            </h2>
            <p className="text-3xl font-display font-normal text-white">
              Built on battle-tested enterprise foundations.
            </p>
            <p className="text-xs text-slate-400">
              No fragile hype tech. Every layer is robust, verifiable, and strictly audited.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Spring Boot 3.3.5</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Java 21 LTS runtime with Spring Security 6, non-blocking servlet filters, and audited REST API endpoints.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Database className="w-4 h-4 text-sky-400" />
                <span className="font-semibold">Neon Serverless PG 16</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Flyway-migrated schema (V1–V4) with strict foreign key cascading, tenant constraints, and transaction safety.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <KeyRound className="w-4 h-4 text-jiosi-violet" />
                <span className="font-semibold">Google OIDC / OAuth 2</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Same-site HTTP-only session cookies routed through the apex domain with AES-256-GCM encrypted refresh tokens.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold">React 18 & Tailwind</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Strict TypeScript compilation, Vitest suites (54/54 passing), zero layout shifts, and full ARIA keyboard accessibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL EDITORIAL CTA BANNER */}
      <section className="py-20 px-4 sm:px-8 border-t border-slate-800/80 bg-gradient-to-b from-jiosi-midnight via-slate-950 to-black relative">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-white leading-tight">
            Make email work for you. <br />
            <span className="italic font-serif text-jiosi-lavender">Not the other way around.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-light leading-relaxed">
            Join professionals who start their morning with a calm, zero-lag workspace. No credit card required.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="violet"
              size="lg"
              onClick={onLaunchApp}
              icon={<ArrowRight className="w-4 h-4" />}
              className="px-8 py-3.5 text-sm font-semibold shadow-xl shadow-jiosi-violet/30"
            >
              Launch JIOSI Inbox Free
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onOpenSupport}
              className="px-6 py-3.5 text-sm font-medium border-slate-700 text-slate-300"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* 8. EDITORIAL FOOTER */}
      <footer className="px-4 sm:px-8 py-12 border-t border-slate-800 bg-black text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 pb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-jiosi-indigo flex items-center justify-center text-white font-bold text-xs">
                JI
              </div>
              <span className="font-ui font-bold text-white text-sm">JIOSI Inbox</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-light">
              An intelligent, privacy-first email workspace crafted by <strong>Shivsastra</strong>. Built for high-velocity software engineers, founders, and knowledge workers.
            </p>
            <div className="text-[11px] text-slate-400 font-mono">
              Production domain: <a href="https://inbox.jiosi.online" className="text-jiosi-violet hover:underline">inbox.jiosi.online</a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-ui font-semibold text-white text-xs uppercase tracking-wider">Product</div>
            <ul className="space-y-1.5 text-slate-400">
              <li><button onClick={onLaunchApp} className="hover:text-white transition-colors">Workspace Login</button></li>
              <li><a href="#features" className="hover:text-white transition-colors">Keyboard Triaging</a></li>
              <li><a href="#showcase" className="hover:text-white transition-colors">3-Panel Layout</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">Workflow</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-ui font-semibold text-white text-xs uppercase tracking-wider">Security & Trust</div>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#security" className="hover:text-white transition-colors">Architecture Stack</a></li>
              <li><span className="text-slate-400">Google OIDC (No Passwords)</span></li>
              <li><span className="text-slate-400">Strict Multi-Tenancy</span></li>
              <li><span className="text-slate-400">AES-256 Token Storage</span></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-ui font-semibold text-white text-xs uppercase tracking-wider">Legal & Help</div>
            <ul className="space-y-1.5 text-slate-400">
              <li><button onClick={onOpenPrivacy} className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button onClick={onOpenTerms} className="hover:text-white transition-colors">Terms of Service</button></li>
              <li><button onClick={onOpenSupport} className="hover:text-white transition-colors">Help & Documentation</button></li>
              <li><a href="https://jiosi.online" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-1">jiosi.online <ExternalLink className="w-3 h-3" /></a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 font-mono text-[11px]">
          <div>
            © 2026 JIOSI Inbox by Shivsastra. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Server: Spring Boot 3.3.5</span>
            <span>·</span>
            <span>Database: Neon PostgreSQL</span>
            <span>·</span>
            <span>Encrypted at rest</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
