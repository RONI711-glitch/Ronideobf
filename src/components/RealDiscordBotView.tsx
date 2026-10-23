import React, { useState } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Server,
  Terminal,
  Key,
  RefreshCw,
  Copy,
  Check,
  Radio,
  Clock,
  HeartPulse,
  Globe,
  Zap,
  Info
} from 'lucide-react';
import { RoniTagBadge } from './RoniTagBadge';

interface RealDiscordBotViewProps {
  botStatus: any;
  onRefresh: () => void;
  onOpenConnectModal: () => void;
  onOpenGuide?: () => void;
}

export const RealDiscordBotView: React.FC<RealDiscordBotViewProps> = ({
  botStatus,
  onRefresh,
  onOpenConnectModal,
  onOpenGuide
}) => {
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedPing, setCopiedPing] = useState(false);
  const [tagEnforcement, setTagEnforcement] = useState(true);
  const customMsg = 'ah you dumas your not wearing the roni tag, so please equip it to proceed with the deobfuscation process.';

  const effectiveClientId = botStatus?.clientId || botStatus?.botUser?.id || '';
  const inviteUrl = effectiveClientId
    ? `https://discord.com/oauth2/authorize?client_id=${effectiveClientId}&permissions=277025508416&scope=bot%20applications.commands`
    : null;

  const pingUrl = botStatus?.keepaliveUrl || (typeof window !== 'undefined' ? `${window.location.origin}/health` : 'https://ais-pre-xwcm6bx6rhv7uhp2ghbyrc-132456942195.europe-west1.run.app/health');

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleCopyPing = () => {
    navigator.clipboard.writeText(pingUrl);
    setCopiedPing(true);
    setTimeout(() => setCopiedPing(false), 2000);
  };

  return (
    <div className="flex-1 bg-[#1e1f22] p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2b2d31]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                Real Discord Bot Integration & Management
              </h1>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  botStatus?.status === 'online'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {botStatus?.status === 'online' ? 'Gateway Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Live Discord bot gateway responding to <code>.deobf</code> commands with official [RONI] server tag verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-[#2b2d31] hover:bg-[#383a40] text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-[#383a40]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>

            <button
              onClick={onOpenConnectModal}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure Secret Token</span>
            </button>
          </div>
        </div>

        {/* 1. Add Bot To Discord Server Section */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-purple-950/40 via-[#2b2d31] to-[#2b2d31] border border-purple-500/30 space-y-4 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                Instant Server Authorization
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Add RONI Bot to Your Discord Server</span>
                <RoniTagBadge equipped={true} size="sm" />
              </h2>
              <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
                Click below to invite your bot into your Discord server where you have Administrator or Manage Server permissions.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {inviteUrl ? (
                <>
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Invite Bot to Discord Server</span>
                  </a>

                  <button
                    onClick={handleCopyInvite}
                    className="px-3 py-2.5 rounded-xl bg-[#383a40] hover:bg-[#43464d] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy OAuth2 Invite Link"
                  >
                    {copiedInvite ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedInvite ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={onOpenConnectModal}
                  className="px-5 py-2.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>Set Client ID to Generate Invite Link</span>
                </button>
              )}
            </div>
          </div>

          {inviteUrl && (
            <div className="p-3 rounded-lg bg-[#18191c] font-mono text-[11px] text-neutral-400 flex items-center justify-between overflow-x-auto border border-[#383a40]">
              <span className="truncate mr-4 text-purple-300">{inviteUrl}</span>
              <span className="text-neutral-500 shrink-0">Permissions: 277025508416 (Messages, Files, Embeds)</span>
            </div>
          )}
        </div>

        {/* 2. 24/7 Bot Uptime & Keep-Alive Solution Card */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/30 via-[#2b2d31] to-[#2b2d31] border border-emerald-500/30 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                <HeartPulse className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>How to Keep Bot Online 24/7 (Free Keep-Alive Setup)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Recommended
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Cloud Run containers enter idle sleep after 15m of no traffic. Setting up a free 5-minute ping keeps it awake permanently.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://uptimerobot.com"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open UptimeRobot (Free)</span>
              </a>
              <a
                href="https://cron-job.org/en/"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#383a40] hover:bg-[#43464d] text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Cron-job.org</span>
              </a>
            </div>
          </div>

          {/* Quick Steps Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#18191c] border border-[#383a40] space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Step 1</span>
              <p className="text-neutral-300">Sign up for free at <b className="text-white">UptimeRobot.com</b> or <b className="text-white">Cron-job.org</b>.</p>
            </div>
            <div className="p-3 rounded-lg bg-[#18191c] border border-[#383a40] space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Step 2</span>
              <p className="text-neutral-300">Create a new monitor: Type = <b className="text-white">HTTP(s)</b>, Interval = <b className="text-white">Every 5 minutes</b>.</p>
            </div>
            <div className="p-3 rounded-lg bg-[#18191c] border border-[#383a40] space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Step 3</span>
              <p className="text-neutral-300">Paste the Ping URL below into the monitor URL field and click Create!</p>
            </div>
          </div>

          {/* Ping URL field */}
          <div className="p-2.5 rounded-lg bg-[#141517] border border-emerald-500/30 flex items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 truncate select-all">{pingUrl}</span>
            </div>
            <button
              onClick={handleCopyPing}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              {copiedPing ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPing ? 'Copied URL!' : 'Copy 24/7 Ping URL'}</span>
            </button>
          </div>
        </div>

        {/* Anti-Duplicate & Single Response Status Banner */}
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Anti-Duplicate Guard & 1-Response Protocol</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Strict Snowflake ID deduplication drops duplicate Discord Gateway packets, guaranteeing exactly <b>1 response</b> per <code>.deobf</code> command when submitting files or URLs.
              </p>
            </div>
          </div>
          <div className="text-[11px] text-neutral-400 hidden sm:block text-right shrink-0">
            <span className="font-mono text-purple-300 bg-[#1e1f22] px-2 py-1 rounded border border-[#383a40]">Strict 1 Reply/cmd</span>
          </div>
        </div>

        {/* 3. Bot Identity & Live Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40]">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Bot Identity
            </span>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-500/40 overflow-hidden shrink-0">
                {botStatus?.botUser?.avatar ? (
                  <img src={botStatus.botUser.avatar} alt="bot" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-white">R</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {botStatus?.botUser?.username || 'Not Connected'}
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  {botStatus?.botUser?.tag || 'Set bot token'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40]">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Bot Uptime
            </span>
            <div className="text-2xl font-bold text-white tabular-nums">
              {botStatus?.uptimeFormatted || 'Active'}
            </div>
            <span className="text-[11px] text-emerald-400 mt-0.5 block flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{botStatus?.keepalivePings ? `${botStatus.keepalivePings} keepalive pings` : 'Online 24/7 ready'}</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40]">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Gateway Ping
            </span>
            <div className="text-2xl font-bold text-white tabular-nums">
              {botStatus?.botUser?.ping ? `${botStatus.botUser.ping} ms` : '—'}
            </div>
            <span className="text-[11px] text-emerald-400 mt-0.5 block flex items-center gap-1">
              <Radio className="w-3 h-3" />
              <span>{botStatus?.status === 'online' ? 'WebSocket heartbeat active' : 'Disconnected'}</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40]">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Connected Guilds
            </span>
            <div className="text-2xl font-bold text-white tabular-nums">
              {botStatus?.guilds?.length || 0}
            </div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Discord servers joined
            </span>
          </div>
        </div>

        {/* 4. Server Tag Enforcer Settings */}
        <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#383a40]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white">RONI Server Tag Enforcer</h3>
                <p className="text-xs text-neutral-400">
                  Enforces that members must equip the official <code>RONI</code> tag before using <code>.deobf</code>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RoniTagBadge equipped={true} size="md" />
              <button
                onClick={() => setTagEnforcement(!tagEnforcement)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${
                  tagEnforcement
                    ? 'bg-purple-950/60 border-purple-500/50 text-purple-200'
                    : 'bg-neutral-800 border-neutral-600 text-neutral-400'
                }`}
              >
                {tagEnforcement ? 'Tag Rule: Active (Mandatory)' : 'Tag Rule: Disabled'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
              Rejection Message (sent in Discord when someone runs .deobf without the RONI tag):
            </label>
            <div className="p-3 rounded-lg bg-[#1e1f22] border border-[#383a40] font-mono text-xs text-red-300 flex items-center justify-between">
              <span>{customMsg}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-400 font-bold uppercase shrink-0 ml-4">
                Active Alert
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              When triggered, the bot mentions the user and informs them to equip the tag to proceed.
            </p>
          </div>
        </div>

        {/* 5. Connected Discord Servers & Live Gateway Log Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connected Servers List */}
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] flex flex-col">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-purple-400" />
              Connected Discord Servers ({botStatus?.guilds?.length || 0})
            </h3>

            <div className="flex-1 overflow-y-auto max-h-60 space-y-2 pr-1">
              {botStatus?.guilds && botStatus.guilds.length > 0 ? (
                botStatus.guilds.map((g: any) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-lg bg-[#1e1f22] border border-[#383a40] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-neutral-700 flex items-center justify-center font-bold text-white text-xs">
                        {g.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white">{g.name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">ID: {g.id}</div>
                      </div>
                    </div>

                    <span className="text-[11px] text-neutral-300 font-mono">
                      {g.memberCount} members
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-neutral-500 text-xs space-y-1">
                  <Server className="w-6 h-6 opacity-40" />
                  <p>No Discord servers joined yet.</p>
                  <p className="text-[11px] text-neutral-400">Use the invite button above to add the bot to your server!</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Discord Command Gateway Stream */}
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] flex flex-col">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Live Gateway Command Logs (.deobf)
            </h3>

            <div className="flex-1 overflow-y-auto max-h-60 space-y-1.5 p-3 rounded-lg bg-[#141517] font-mono text-[11px]">
              {botStatus?.recentEvents && botStatus.recentEvents.length > 0 ? (
                botStatus.recentEvents.map((evt: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-neutral-500 tabular-nums">[{evt.time}]</span>
                    <span className="text-purple-400 font-semibold">[{evt.type}]</span>
                    <span className="text-neutral-300">{evt.details}</span>
                  </div>
                ))
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-neutral-500 text-xs space-y-1">
                  <Terminal className="w-6 h-6 opacity-40" />
                  <p>Awaiting incoming Discord .deobf commands...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
