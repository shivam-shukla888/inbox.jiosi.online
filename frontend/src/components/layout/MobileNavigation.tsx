import React from 'react';
import { Inbox, Star, Menu, Plus, Send } from 'lucide-react';
import { EmailFolder } from '../../types/email';

interface MobileNavigationProps {
  currentFolder: EmailFolder;
  onSelectFolder: (folder: EmailFolder) => void;
  onOpenCompose: () => void;
  onToggleMenu: () => void;
  needsReplyCount: number;
  unreadCount: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentFolder,
  onSelectFolder,
  onOpenCompose,
  onToggleMenu,
  needsReplyCount,
  unreadCount,
}) => {
  return (
    <>
      {/* Floating Action Button (FAB) for Compose */}
      <button
        onClick={onOpenCompose}
        className="lg:hidden fixed right-4 bottom-20 z-40 w-12 h-12 rounded-full bg-jiosi-violet text-white shadow-xl flex items-center justify-center hover:bg-violet-600 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
        aria-label="Compose new message"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-30 select-none shadow-lg">
        {/* Inbox */}
        <button
          onClick={() => onSelectFolder('inbox')}
          className={`relative flex flex-col items-center justify-center w-16 h-full py-1 text-[11px] font-ui transition-colors cursor-pointer ${
            currentFolder === 'inbox'
              ? 'text-jiosi-indigo font-bold'
              : 'text-slate-500 font-medium'
          }`}
        >
          <div className="relative">
            <Inbox className="w-5 h-5 stroke-[1.75]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </div>
          <span className="mt-1">Inbox</span>
        </button>

        {/* Needs Reply with RED ACTION INDICATOR */}
        <button
          onClick={() => onSelectFolder('needs-reply')}
          className={`relative flex flex-col items-center justify-center w-16 h-full py-1 text-[11px] font-ui transition-colors cursor-pointer ${
            currentFolder === 'needs-reply'
              ? 'text-action-urgent font-bold'
              : 'text-slate-500 font-medium'
          }`}
        >
          <div className="relative">
            <Send className="w-5 h-5 stroke-[1.75]" />
            {needsReplyCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-action-urgent text-white font-mono text-[9px] font-bold ring-2 ring-white">
                {needsReplyCount}
              </span>
            )}
          </div>
          <span className="mt-1">Needs Reply</span>
        </button>

        {/* Starred */}
        <button
          onClick={() => onSelectFolder('starred')}
          className={`relative flex flex-col items-center justify-center w-16 h-full py-1 text-[11px] font-ui transition-colors cursor-pointer ${
            currentFolder === 'starred'
              ? 'text-amber-500 font-bold'
              : 'text-slate-500 font-medium'
          }`}
        >
          <Star className="w-5 h-5 stroke-[1.75]" />
          <span className="mt-1">Starred</span>
        </button>

        {/* Menu / More */}
        <button
          onClick={onToggleMenu}
          className="flex flex-col items-center justify-center w-16 h-full py-1 text-[11px] font-ui font-medium text-slate-500 cursor-pointer"
        >
          <Menu className="w-5 h-5 stroke-[1.75]" />
          <span className="mt-1">More</span>
        </button>
      </nav>
    </>
  );
};
