import React from 'react';

interface AppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  emailList: React.ReactNode;
  emailDetail: React.ReactNode;
  mobileNavigation?: React.ReactNode;
  customView?: React.ReactNode;
  isMobileDetailOpen?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  sidebar,
  header,
  emailList,
  emailDetail,
  mobileNavigation,
  customView,
  isMobileDetailOpen = false,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-canvas-dark text-slate-900 dark:text-slate-100">
      {/* 1. Left Sidebar Navigation */}
      {sidebar}

      {/* 2. Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Top Header */}
        {header}

        {/* Custom view (e.g. Settings / Connected Accounts) or 3-panel Mail Workspace */}
        {customView ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col pb-16 lg:pb-0">
            {customView}
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 overflow-hidden pb-16 lg:pb-0">
            {/* Center: Email Thread List */}
            <div
              className={`w-full md:w-[380px] lg:w-[420px] shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden ${
                isMobileDetailOpen ? 'hidden md:block' : 'block'
              }`}
            >
              {emailList}
            </div>

            {/* Right: Reading Pane */}
            <div
              className={`flex-1 min-w-0 h-full overflow-hidden bg-white dark:bg-slate-900 ${
                isMobileDetailOpen ? 'block' : 'hidden md:flex'
              }`}
            >
              {emailDetail}
            </div>
          </div>
        )}

        {/* Screen 12: Mobile Bottom Navigation Bar */}
        {mobileNavigation}
      </div>
    </div>
  );
};
