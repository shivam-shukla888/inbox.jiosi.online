import React from 'react';
import { FileText, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface TermsViewProps {
  onBack: () => void;
}

export const TermsView: React.FC<TermsViewProps> = ({ onBack }) => {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-canvas-dark text-slate-800 dark:text-slate-200 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Inbox
          </Button>
          <span className="text-xs font-mono text-slate-400">Effective Date: November 2, 2026</span>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Terms of Service
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Please read these Terms of Service carefully before utilizing the JIOSI Inbox platform.
          </p>
        </div>

        {/* Legal Notice */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Product Owner & Legal Counsel Action Notice</span>
          </div>
          <p>
            These terms represent an engineering-aligned terms framework based on verified software behavior. Items marked with <strong>[OWNER CONFIRMATION REQUIRED]</strong> require qualified legal review and business owner sign-off prior to commercial execution.
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">1. Service Description</h2>
            <p>
              JIOSI Inbox provides intelligent email productivity workflows, organization, triage assistance, and draft composition interfaces for authorized users and workspaces.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">2. Acceptable Use & Account Security</h2>
            <p>
              Users agree to access only workspaces and email accounts for which they possess legitimate authorization. Exploiting multi-tenant boundaries, attempting unauthorized data access, sending unsolicited bulk spam, or reverse-engineering protected endpoints is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">3. Prototype AI & Simulation Capabilities</h2>
            <p>
              Certain features in demonstration and preview builds (including AI suggested replies and summary previews) are simulation prototypes. Users must review all AI-generated drafts prior to transmission. JIOSI AI accepts no liability for unsanctioned communications.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">4. Availability & Disclaimers</h2>
            <p>
              The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without express warranties of uninterrupted uptime or error-free operation.
            </p>
            <p className="text-xs text-slate-500 italic">
              [OWNER CONFIRMATION REQUIRED: Specify target commercial SLA percentages, downtime credits, and warranty exclusions with qualified legal counsel].
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">5. Governing Law & Dispute Resolution</h2>
            <p className="text-xs text-slate-500 italic">
              [OWNER CONFIRMATION REQUIRED: Specify choice of governing state/country law, venue, and arbitration provisions].
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
          <p>For questions regarding terms, contact: <span className="font-mono text-brand-600 dark:text-brand-400">legal@jiosi.online</span></p>
          <p>JIOSI AI · inbox.jiosi.online</p>
        </div>
      </div>
    </div>
  );
};
