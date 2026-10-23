import React, { useState } from 'react';
import { Key, Shield, ExternalLink, Check, AlertCircle, X, Terminal, Server, Sparkles } from 'lucide-react';

interface DiscordBotConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  botStatus: any;
  onRefresh: () => void;
}

export const DiscordBotConnectionModal: React.FC<DiscordBotConnectionModalProps> = ({
  isOpen,
  onClose,
  botStatus,
  onRefresh
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState(botStatus?.clientId || '');
  const [requiredTagInput, setRequiredTagInput] = useState(botStatus?.requiredTag || 'RONI');
  const [connecting, setConnecting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveAndConnect = async () => {
    setConnecting(true);
    setFeedback(null);

    try {
      // 1. Save config (ClientId and Required Tag)
      if (clientIdInput.trim() || requiredTagInput.trim()) {
        await fetch('/api/bot/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: clientIdInput.trim(),
            requiredTag: requiredTagInput.trim(),
            token: tokenInput.trim() || undefined
          })
        });
      }

      // 2. If token provided, connect to Discord Gateway
      if (tokenInput.trim()) {
        const res = await fetch('/api/bot/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenInput.trim() })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Connection failed');
        }
      }

      setFeedback({ type: 'success', msg: 'Settings updated and connection initiated to Discord Gateway!' });
      setTokenInput('');
      setTimeout(() => {
        onRefresh();
      }, 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to connect bot.' });
    } finally {
      setConnecting(false);
    }
  };

  const effectiveClientId = clientIdInput.trim() || botStatus?.clientId || botStatus?.botUser?.id || '';
  const currentInviteUrl = effectiveClientId
    ? `https://discord.com/oauth2/authorize?client_id=${effectiveClientId}&permissions=277025508416&scope=bot%20applications.commands`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-[#2b2d31] rounded-2xl border border-[#383a40] shadow-2xl overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e1f22] border-b border-[#383a40]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Connect Real Discord Bot & Server Invite
              </h3>
              <p className="text-[11px] text-neutral-400">
                Configure your Bot Secret Token and Client ID to invite and run the bot
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#383a40] text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Current Status Box */}
          <div className="p-3.5 rounded-xl bg-[#1e1f22] border border-[#383a40] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  botStatus?.status === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : botStatus?.status === 'connecting'
                    ? 'bg-amber-500 animate-spin'
                    : 'bg-red-500'
                }`}
              />
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Status: {botStatus?.status ? botStatus.status.toUpperCase() : 'DISCONNECTED'}</span>
                  {botStatus?.status === 'online' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono">
                      WebSocket Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {botStatus?.botUser
                    ? `Connected as ${botStatus.botUser.tag} (${botStatus.botUser.guildsCount} servers, ${botStatus.botUser.ping}ms ping)`
                    : 'No active Discord Gateway connection yet'}
                </div>
              </div>
            </div>
          </div>

          {/* Client ID / Application ID Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                Discord Client ID (Application ID)
              </label>
              {currentInviteUrl && (
                <a
                  href={currentInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Server Invite</span>
                </a>
              )}
            </div>
            <input
              type="text"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="e.g. 132456789012345678"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e1f22] border border-[#383a40] text-xs text-white placeholder-neutral-500 outline-none font-mono focus:border-purple-500/80 transition-colors"
            />
            <p className="text-[11px] text-neutral-400">
              Found under "General Information" &rarr; "Application ID" in Discord Developer Portal. Used to generate your 1-click server invite link.
            </p>
          </div>

          {/* Bot Token Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
              Discord Bot Secret Token
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={botStatus?.isConfigured ? '•••••••••••••••••••••••• (Configured — paste to change)' : 'Paste your Bot Token here'}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e1f22] border border-[#383a40] text-xs text-white placeholder-neutral-500 outline-none font-mono focus:border-purple-500/80 transition-colors"
            />
            <p className="text-[11px] text-neutral-400">
              Found in the "Bot" tab &rarr; "Reset Token". Needs <b>Message Content</b> intent checked in the Developer Portal.
            </p>
          </div>

          {/* Required Server Tag */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
              Required Discord Server Tag
            </label>
            <input
              type="text"
              value={requiredTagInput}
              onChange={(e) => setRequiredTagInput(e.target.value)}
              placeholder="RONI"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e1f22] border border-[#383a40] text-xs text-white placeholder-neutral-500 outline-none font-mono focus:border-purple-500/80 transition-colors"
            />
            <p className="text-[11px] text-neutral-400">
              Official Server Tag required to use <code>.deobf</code>. Default is <code>RONI</code>.
            </p>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/60 border border-red-500/40 text-red-200'
              }`}
            >
              {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* Quick Invite Button if Client ID exists */}
          {currentInviteUrl && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">Ready to Add to Server?</div>
                <div className="text-[11px] text-purple-300">Click to authorize RONI bot into your Discord guild</div>
              </div>
              <a
                href={currentInviteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs flex items-center gap-1.5 shadow transition-transform hover:scale-105"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Invite Bot</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#1e1f22] border-t border-[#383a40] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#383a40] hover:bg-[#43464d] text-white text-xs font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSaveAndConnect}
            disabled={connecting || (!tokenInput.trim() && !clientIdInput.trim() && !requiredTagInput.trim())}
            className={`px-4 py-2 rounded-lg text-white text-xs font-semibold cursor-pointer transition-colors shadow ${
              connecting || (!tokenInput.trim() && !clientIdInput.trim() && !requiredTagInput.trim())
                ? 'bg-neutral-600 cursor-not-allowed opacity-60'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {connecting ? 'Saving & Connecting...' : 'Save & Connect to Discord'}
          </button>
        </div>
      </div>
    </div>
  );
};
