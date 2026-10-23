import React, { useState, useEffect } from 'react';
import { TopNavbar } from './components/TopNavbar';
import { DeobfuscatorWorkbench } from './components/DeobfuscatorWorkbench';
import { RealDiscordBotView } from './components/RealDiscordBotView';
import { EngineTelemetryView } from './components/EngineTelemetryView';
import { SupportedEnginesView } from './components/SupportedEnginesView';
import { BotDeployGuide } from './components/BotDeployGuide';
import { DiscordBotConnectionModal } from './components/DiscordBotConnectionModal';
import { DiscordUser } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workbench' | 'bot' | 'telemetry' | 'engines' | 'guide'>('workbench');
  const [tagToast, setTagToast] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [botStatus, setBotStatus] = useState<any>({
    isConfigured: false,
    status: 'disconnected',
    clientId: '',
    inviteUrl: null,
    botUser: null,
    errorMessage: null,
    guilds: [],
    recentEvents: []
  });

  const fetchBotStatus = async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data);
      }
    } catch {
      // offline/dev fallback
    }
  };

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Current simulated user profile
  const [currentUser, setCurrentUser] = useState<DiscordUser>({
    id: 'user-7729',
    username: 'RoniUser',
    displayName: 'RoniMember',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
    serverTag: 'RONI',
    hasRoniTag: true,
    tagColor: '#a855f7'
  });

  const handleToggleTag = () => {
    setCurrentUser(prev => {
      const newStatus = !prev.hasRoniTag;
      setTagToast({
        message: newStatus
          ? 'Official [RONI] Server Tag Equipped!'
          : 'Server Tag Unequipped.',
        type: newStatus ? 'success' : 'warn'
      });
      setTimeout(() => setTagToast(null), 3500);

      return {
        ...prev,
        hasRoniTag: newStatus,
        serverTag: newStatus ? 'RONI' : null
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#1e1f22] text-[#dbdee1] flex flex-col font-sans select-none antialiased">
      {/* Top Bar following Top Bar Contract */}
      <TopNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onToggleTag={handleToggleTag}
        botStatus={botStatus}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />

      {/* Floating Status Notification Toast */}
      {tagToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg border shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 ${
            tagToast.type === 'success'
              ? 'bg-purple-950/90 border-purple-500/50 text-purple-200'
              : 'bg-red-950/90 border-red-500/50 text-red-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{tagToast.message}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'workbench' && (
          <DeobfuscatorWorkbench
            botStatus={botStatus}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onViewTelemetry={() => setActiveTab('telemetry')}
          />
        )}

        {activeTab === 'bot' && (
          <RealDiscordBotView
            botStatus={botStatus}
            onRefresh={fetchBotStatus}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onOpenGuide={() => setActiveTab('guide')}
          />
        )}

        {activeTab === 'telemetry' && (
          <EngineTelemetryView onBackToBot={() => setActiveTab('workbench')} />
        )}

        {activeTab === 'engines' && (
          <SupportedEnginesView />
        )}

        {activeTab === 'guide' && (
          <BotDeployGuide />
        )}
      </main>

      {/* Connect Bot Token Modal */}
      <DiscordBotConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        botStatus={botStatus}
        onRefresh={fetchBotStatus}
      />
    </div>
  );
}
