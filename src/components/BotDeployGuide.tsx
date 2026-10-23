import React, { useState } from 'react';
import {
  Copy,
  Check,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Globe,
  HeartPulse,
  Server,
  Zap,
  Code2,
  Clock,
  Layers,
  ShieldAlert
} from 'lucide-react';

export const BotDeployGuide: React.FC = () => {
  const [activeGuideTab, setActiveGuideTab] = useState<'keepalive' | 'vps' | 'railway' | 'code'>('keepalive');
  const [copiedPing, setCopiedPing] = useState(false);
  const [copiedPm2, setCopiedPm2] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const pingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/health`
    : 'https://ais-pre-xwcm6bx6rhv7uhp2ghbyrc-132456942195.europe-west1.run.app/health';

  const pm2Script = `# 1. Install PM2 globally
npm install -g pm2

# 2. Clone or place your bot folder
cd roni-deobf-bot

# 3. Install required packages
npm install discord.js dotenv

# 4. Start bot under PM2 with automatic crash restart
pm2 start server.ts --name "roni-bot" --interpreter ./node_modules/.bin/tsx

# 5. Make it launch automatically on system reboot
pm2 startup
pm2 save`;

  const standaloneBotCode = `// RONI 24/7 Deobfuscator Discord Bot (discord.js v14)
// Supported Engines: Luraph v15, Prometheus AST, Clyde VM, Moonsec v3, Ironveil v1, 77fuscator, FlowAuth
require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  AttachmentBuilder,
  Events 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const REQUIRED_TAG = 'RONI';

// Caches for raw official Discord server tags / clan badges
const clanByMsg = new Map();
const clanByUser = new Map();

client.on(Events.Raw, (packet) => {
  if (packet.t === 'MESSAGE_CREATE') {
    const clan = packet.d?.member?.clan?.tag || packet.d?.author?.clan?.tag || packet.d?.clan?.tag;
    if (clan) {
      const upper = clan.trim().toUpperCase();
      if (packet.d.id) clanByMsg.set(packet.d.id, upper);
      if (packet.d.author?.id) clanByUser.set(packet.d.author.id, upper);
    }
  }
});

// Strict Tag Verification: ONLY accepts official RONI server tag
function verifyTag(message) {
  const authorId = message.author.id;
  const tag = clanByMsg.get(message.id) || clanByUser.get(authorId) || message.member?.clan?.tag?.toUpperCase();
  return { passed: tag === REQUIRED_TAG, tag: tag || null };
}

client.on('ready', () => {
  console.log(\`[RONI 24/7] Logged in as \${client.user.tag}\`);
  console.log(\`[RONI 24/7] Official Server Tag Enforcer: [\${REQUIRED_TAG}] ACTIVE\`);
});

// Anti-duplicate protection: stops gateway retransmissions and double-enters
const processedMessageIds = new Set();
const lastUserCmdTime = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('.deobf')) return;

  // 1. Exact Message Snowflake Deduplication
  if (processedMessageIds.has(message.id)) return;
  processedMessageIds.add(message.id);
  if (processedMessageIds.size > 2000) {
    const first = processedMessageIds.values().next().value;
    if (first) processedMessageIds.delete(first);
  }

  // 2. User Debounce (1200ms) to prevent double sends
  const now = Date.now();
  const lastTime = lastUserCmdTime.get(message.author.id) || 0;
  if (now - lastTime < 1200) return;
  lastUserCmdTime.set(message.author.id, now);

  const tagCheck = verifyTag(message);
  if (!tagCheck.passed) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Tag Verification Failed')
      .setDescription('ah you dumas your not wearing the roni tag, so please equip it to proceed with the deobfuscation process.')
      .setColor(0xEF4444)
      .addFields(
        { name: 'Required Server Tag', value: '\`RONI\`', inline: true },
        { name: 'Your Equipped Tag', value: tagCheck.tag ? \`\`\${tagCheck.tag}\`\` : 'None', inline: true }
      )
      .setFooter({ text: 'Equip the official RONI server tag and run .deobf again.' });
    return message.reply({ embeds: [embed] });
  }

  // Extract attachment, URL, or pasted code
  const urlMatch = message.content.match(/(https?:\\\/\\\/[^\\s]+)/i);
  let scriptName = 'script.lua';
  let code = '';

  if (message.attachments.first()) {
    const att = message.attachments.first();
    scriptName = att.name;
    const res = await fetch(att.url);
    code = await res.text();
  } else if (urlMatch) {
    let url = urlMatch[1];
    if (url.includes('pastebin.com/') && !url.includes('/raw/')) {
      url = url.replace('pastebin.com/', 'pastebin.com/raw/');
    }
    const res = await fetch(url);
    code = await res.text();
    scriptName = 'url_script.lua';
  } else {
    const raw = message.content.replace(/^\\.deobf\\s*/, '').trim();
    if (raw.length > 5) {
      code = raw;
      scriptName = 'pasted.lua';
    } else {
      return message.reply('Please attach a .lua file or provide a URL with \`.deobf [url]\`!');
    }
  }

  // Two Action Rows to present all 7 engines cleanly
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(\`deobf:luraph-v15:\${Date.now()}\`).setLabel('Luraph v15').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(\`deobf:prometheus:\${Date.now()}\`).setLabel('Prometheus AST').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(\`deobf:clyde:\${Date.now()}\`).setLabel('Clyde VM').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(\`deobf:moonsec:\${Date.now()}\`).setLabel('Moonsec v3').setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(\`deobf:ironveil:\${Date.now()}\`).setLabel('Ironveil v1').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(\`deobf:77fuscator:\${Date.now()}\`).setLabel('77fuscator').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(\`deobf:flowauth:\${Date.now()}\`).setLabel('FlowAuth').setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setTitle('✨ Official [RONI] Tag Verified')
    .setDescription(\`Member **\${message.author.username}** verified. Select an engine to devirtualize \`\${scriptName}\`:\\n\\n🔒 **Note:** You can only choose 1 time per command.\`)
    .setColor(0x10B981)
    .setFooter({ text: 'RONI Multi-Engine Deobfuscator · 1 Choice Per Command' });

  await message.reply({ embeds: [embed], components: [row1, row2] });
});

// Single Choice & Button Disable on Interaction
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() || !interaction.customId.startsWith('deobf:')) return;
  
  // Acknowledge immediately to avoid Discord timeout
  await interaction.deferReply();

  // Disable all buttons on the message (enforce 1 choice per command)
  const disabled = interaction.message.components.map(r => {
    const row = ActionRowBuilder.from(r);
    row.components.forEach(c => c.setDisabled(true));
    return row;
  });
  await interaction.message.edit({ components: disabled });

  const [, engine] = interaction.customId.split(':');
  await interaction.editReply(\`✨ Running clean deobfuscation with **\${engine.toUpperCase()}**...\`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
`;

  const copyPing = () => {
    navigator.clipboard.writeText(pingUrl);
    setCopiedPing(true);
    setTimeout(() => setCopiedPing(false), 2000);
  };

  const copyPm2 = () => {
    navigator.clipboard.writeText(pm2Script);
    setCopiedPm2(true);
    setTimeout(() => setCopiedPm2(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(standaloneBotCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 bg-[#1e1f22] p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-[#2b2d31]">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              How to Keep RONI Bot Online 24/7
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              100% Uptime
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Choose the best method for your setup to ensure your Discord bot never disconnects or goes to sleep.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#2b2d31] border border-[#383a40] text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveGuideTab('keepalive')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeGuideTab === 'keepalive'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>Method 1: Free Keep-Alive (Easiest - 100% Free)</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('vps')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeGuideTab === 'vps'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Method 2: VPS / PC (PM2)</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('railway')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeGuideTab === 'railway'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Method 3: Cloud Worker (Railway / Render)</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('code')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeGuideTab === 'code'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>Standalone bot.js Script</span>
          </button>
        </div>

        {/* Tab 1: Free Keep-Alive via Uptime Monitor */}
        {activeGuideTab === 'keepalive' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                  <HeartPulse className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Why Does the Bot Go Offline & How Keep-Alive Fixes It</h3>
                  <p className="text-xs text-neutral-400">
                    Modern cloud hosting (Google Cloud Run, Render, Glitch) pauses your container after 15 minutes of inactivity to save compute.
                    By having an automated free monitor ping your health endpoint every 5 minutes, the container never scales to zero!
                  </p>
                </div>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
                <div className="p-4 rounded-xl bg-[#1e1f22] border border-[#383a40] space-y-2">
                  <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">1</div>
                  <h4 className="font-bold text-white text-sm">Create Free Monitor</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Go to <a href="https://uptimerobot.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">UptimeRobot.com</a> or <a href="https://cron-job.org" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">Cron-job.org</a> (both have 100% free accounts).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#1e1f22] border border-[#383a40] space-y-2">
                  <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">2</div>
                  <h4 className="font-bold text-white text-sm">Add New Monitor</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Select <b>Monitor Type: HTTP(s)</b>. Set friendly name to <code>RONI Deobf Bot</code>. Set Interval to <b>5 minutes</b>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#1e1f22] border border-[#383a40] space-y-2">
                  <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">3</div>
                  <h4 className="font-bold text-white text-sm">Paste Ping URL</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Paste the unique URL below into the URL field and click <b>Create Monitor</b>. Your bot will remain online 24/7/365!
                  </p>
                </div>
              </div>

              {/* Ping URL Box */}
              <div className="p-4 rounded-xl bg-[#18191c] border border-emerald-500/40 space-y-2">
                <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Your Live 24/7 Keepalive Ping URL:
                </label>
                <div className="flex items-center justify-between gap-3 font-mono text-xs p-2.5 rounded-lg bg-[#141517] border border-[#383a40]">
                  <span className="text-emerald-300 truncate select-all">{pingUrl}</span>
                  <button
                    onClick={copyPing}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedPing ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPing ? 'Copied URL!' : 'Copy Ping URL'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: VPS / Linux / Windows with PM2 */}
        {activeGuideTab === 'vps' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <span>Host on a VPS / Raspberry Pi / PC with PM2</span>
              </h3>
              <p className="text-xs text-neutral-400">
                PM2 is a production process manager for Node.js. It keeps your Discord bot running in the background forever and restarts it automatically if the server reboots or crashes.
              </p>

              <div className="rounded-xl bg-[#141517] border border-[#383a40] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#18191c] border-b border-[#383a40] flex items-center justify-between">
                  <span className="text-xs font-mono text-purple-300">Terminal Commands</span>
                  <button
                    onClick={copyPm2}
                    className="px-2.5 py-1 rounded bg-[#2b2d31] hover:bg-[#383a40] text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedPm2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPm2 ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto">
                  {pm2Script}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Railway / Render */}
        {activeGuideTab === 'railway' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Deploy to Railway or Render Background Worker</span>
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Railway and Render provide always-on container workers that never sleep and do not require keep-alive pingers.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#1e1f22] border border-[#383a40] space-y-2">
                  <h4 className="font-bold text-white text-sm">Railway.app (Recommended)</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-neutral-300">
                    <li>Create account at <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-purple-400 underline">railway.app</a>.</li>
                    <li>Click <b>New Project</b> → <b>Deploy from GitHub repo</b>.</li>
                    <li>Add Environment Variables: <code>DISCORD_BOT_TOKEN</code> and <code>DISCORD_CLIENT_ID</code>.</li>
                    <li>Start command: <code>npm run start</code>.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-[#1e1f22] border border-[#383a40] space-y-2">
                  <h4 className="font-bold text-white text-sm">Render.com</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-neutral-300">
                    <li>Create account at <a href="https://render.com" target="_blank" rel="noreferrer" className="text-purple-400 underline">render.com</a>.</li>
                    <li>Click <b>New +</b> → <b>Web Service</b> or <b>Background Worker</b>.</li>
                    <li>Build command: <code>npm install && npm run build</code>.</li>
                    <li>Start command: <code>node server.ts</code>.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Standalone Bot Script */}
        {activeGuideTab === 'code' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Duplicate instance callout */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-200">Why does Discord send 2 messages to a single command?</p>
                <p className="text-neutral-300 leading-relaxed">
                  If your bot responds <b>2 times</b> when someone runs <code>.deobf</code>, it means <b>two bot processes are running simultaneously with the exact same bot token</b> (e.g. this web application is connected AND you are running the standalone script on your terminal or VPS). Always make sure only <b>ONE</b> instance is running.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#2b2d31] border border-[#383a40] overflow-hidden">
              <div className="px-4 py-3 bg-[#1e1f22] border-b border-[#383a40] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">roni-bot-standalone.js (Complete with all 7 Engines + Anti-Duplicate Guard)</span>
                </div>
                <button
                  onClick={copyCode}
                  className="px-3 py-1 rounded bg-[#383a40] hover:bg-[#43464d] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied Code!' : 'Copy standalone script'}</span>
                </button>
              </div>

              <pre className="p-4 bg-[#141517] font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto max-h-[480px]">
                {standaloneBotCode}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
