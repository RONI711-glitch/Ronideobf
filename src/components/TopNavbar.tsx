import React from 'react';
import { RoniTagBadge } from './RoniTagBadge';
import { DiscordUser } from '../types';

interface TopNavbarProps {
  activeTab: 'workbench' | 'bot' | 'telemetry' | 'engines' | 'guide';
  setActiveTab: (tab: 'workbench' | 'bot' | 'telemetry' | 'engines' | 'guide') => void;
  currentUser: DiscordUser;
  onToggleTag: () => void;
  botStatus: any;
  onOpenConnectModal: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onToggleTag,
  botStatus,
  onOpenConnectModal,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#1e1f22] border-b border-[#2b2d31] select-none sticky top-0 z-40">
      {/* Zone 1: Single text element Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
        </div>
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); setActiveTab('workbench'); }}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap hover:text-purple-300 transition-colors"
        >
          RONI DEOBFUSCATOR
        </a>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => setActiveTab('workbench')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'workbench'
              ? 'text-white border-b-2 border-purple-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Engine Hub & Deobf
        </button>
        <button
          onClick={() => setActiveTab('bot')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'bot'
              ? 'text-white border-b-2 border-purple-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Real Discord Bot
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'telemetry'
              ? 'text-white border-b-2 border-purple-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Live Engine Telemetry
        </button>
        <button
          onClick={() => setActiveTab('engines')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'engines'
              ? 'text-white border-b-2 border-purple-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Supported Engines
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'guide'
              ? 'text-white border-b-2 border-purple-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          24/7 Hosting Guide
        </button>
      </nav>

      {/* Zone 3: 1 primary action - Tag Switcher & Bot Gateway status */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Real Discord Bot Connection Pill */}
        <button
          onClick={onOpenConnectModal}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
            botStatus?.status === 'online'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50'
              : 'bg-[#2b2d31] border-[#383a40] text-neutral-300 hover:text-white hover:bg-[#383a40]'
          }`}
          title="Connect or view real Discord Bot token & gateway status"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              botStatus?.status === 'online'
                ? 'bg-emerald-500 animate-pulse'
                : botStatus?.status === 'connecting'
                ? 'bg-amber-500 animate-spin'
                : 'bg-neutral-500'
            }`}
          />
          <span className="hidden sm:inline">
            {botStatus?.status === 'online'
              ? `Real Bot: ${botStatus.botUser?.username || 'Online'}`
              : 'Real Bot: Connect Token'}
          </span>
        </button>

        <button
          onClick={onToggleTag}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border ${
            currentUser.hasRoniTag
              ? 'bg-purple-950/40 border-purple-500/50 hover:bg-purple-900/50 text-purple-200'
              : 'bg-red-950/40 border-red-500/50 hover:bg-red-900/50 text-red-200'
          }`}
          title="Click to toggle your Discord Server Tag status"
        >
          <span className="text-[11px] text-neutral-400">Server Tag:</span>
          <RoniTagBadge equipped={currentUser.hasRoniTag} size="sm" />
          <span className="text-[10px] uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-black/40">
            {currentUser.hasRoniTag ? 'Equipped' : 'Missing'}
          </span>
        </button>
      </div>
    </header>
  );
};
