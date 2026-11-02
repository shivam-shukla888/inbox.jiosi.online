import React from 'react';

interface AppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  emailList: React.ReactNode;
  emailDetail: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  sidebar,
  header,
  emailList,
  emailDetail,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      {/* 1. Left Sidebar Navigation */}
      {sidebar}

      {/* 2. Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        {header}

        {/* 3-Column Split Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Middle Feed: Thread List (Responsive width) */}
          <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 h-full border-r border-border-subtle overflow-hidden">
            {emailList}
          </div>

          {/* Right Detail Pane: Hidden on mobile when viewing list unless email selected, flex-1 on tablet/desktop */}
          <div className="hidden md:flex flex-1 min-w-0 h-full overflow-hidden">
            {emailDetail}
          </div>
        </div>
      </div>
    </div>
  );
};
