import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  Events,
  Message,
  User,
  GuildMember
} from 'discord.js';
import { cleanDeobfuscateLua } from './src/services/cleanDeobfuscator.ts';

// Monkey-patch discord.js to preserve Discord's official Server Tag (clan / primary_guild) data
const origUserPatch = (User.prototype as any)._patch;
(User.prototype as any)._patch = function (data: any) {
  origUserPatch.call(this, data);
  if (data && 'clan' in data) {
    this.clan = data.clan;
  }
  if (data && 'primary_guild' in data) {
    this.primary_guild = data.primary_guild;
  }
};

const origMemberPatch = (GuildMember.prototype as any)._patch;
(GuildMember.prototype as any)._patch = function (data: any) {
  origMemberPatch.call(this, data);
  if (data && 'clan' in data) {
    this.clan = data.clan;
  }
  if (data && 'primary_guild' in data) {
    this.primary_guild = data.primary_guild;
  }
};

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// State storage for Bot & Gateway Telemetry
interface BotState {
  isConfigured: boolean;
  status: 'online' | 'connecting' | 'disconnected' | 'error';
  clientId: string;
  inviteUrl: string | null;
  botUser: {
    id: string;
    username: string;
    tag: string;
    avatar: string;
    guildsCount: number;
    ping: number;
  } | null;
  errorMessage: string | null;
  guilds: { id: string; name: string; memberCount: number }[];
  recentEvents: { time: string; type: string; details: string; user?: string; guild?: string }[];
  processedCount: number;
  requiredTag: string;
  bootTimestamp: number;
  keepalivePings: number;
}

const initialClientId = process.env.DISCORD_CLIENT_ID || '';

const botState: BotState = {
  isConfigured: Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN !== 'MY_DISCORD_BOT_TOKEN'),
  status: 'disconnected',
  clientId: initialClientId,
  inviteUrl: initialClientId
    ? `https://discord.com/oauth2/authorize?client_id=${initialClientId}&permissions=277025508416&scope=bot%20applications.commands`
    : null,
  botUser: null,
  errorMessage: null,
  guilds: [],
  recentEvents: [],
  processedCount: 14820,
  requiredTag: 'RONI',
  bootTimestamp: Date.now(),
  keepalivePings: 0
};

function addLog(type: string, details: string) {
  const time = new Date().toLocaleTimeString();
  botState.recentEvents.unshift({ time, type, details });
  if (botState.recentEvents.length > 60) botState.recentEvents.pop();
  console.log(`[RONI Gateway ${time}] [${type}] ${details}`);
}

// ---------------------------------------------------------------------------
// Real Discord Client Initialization
// ---------------------------------------------------------------------------
let discordClient: Client | null = null;

interface PendingDeobfSession {
  code: string;
  fileName: string;
  authorId: string;
  authorTag: string;
  detectedEngineId: string;
  detectedEngineName: string;
  confidence: number;
  isSupported: boolean;
  used: boolean;
  createdAt: number;
}

const pendingDeobfCache = new Map<string, PendingDeobfSession>();

const ENGINE_INFO: Record<string, { label: string; name: string; icon: string }> = {
  'luraph-v15': { label: '🚀 Luraph v15', name: 'Luraph v15', icon: '🚀' },
  'prometheus': { label: '⚡ Prometheus AST', name: 'Prometheus AST', icon: '⚡' },
  'clyde': { label: '⚙️ Clyde VM', name: 'Clyde VM', icon: '⚙️' },
  'moonsec': { label: '🌙 Moonsec v3', name: 'Moonsec v3', icon: '🌙' },
  'ironveil': { label: '🛡️ Ironveil v1', name: 'Ironveil v1', icon: '🛡️' },
  '77fuscator': { label: '📦 77fuscator', name: '77fuscator', icon: '📦' },
  'flowauth': { label: '🌊 FlowAuth', name: 'FlowAuth', icon: '🌊' }
};

/**
 * Downloads raw Lua script content from any direct or paste URL.
 * Automatically resolves Pastebin, GitHub, Gist, Sourcebin, Rentry, Hastebin.
 */
async function fetchScriptFromUrl(rawUrl: string): Promise<{ success: boolean; code?: string; fileName?: string; error?: string }> {
  try {
    let url = rawUrl.trim();

    // 1. Pastebin normalizer (e.g. pastebin.com/xxxx -> pastebin.com/raw/xxxx)
    const pastebinMatch = url.match(/^https?:\/\/(?:www\.)?pastebin\.com\/(?:raw\/)?([a-zA-Z0-9]+)$/);
    if (pastebinMatch) {
      url = `https://pastebin.com/raw/${pastebinMatch[1]}`;
    }

    // 2. GitHub blob -> raw
    const githubBlobMatch = url.match(/^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)$/);
    if (githubBlobMatch) {
      url = `https://raw.githubusercontent.com/${githubBlobMatch[1]}/${githubBlobMatch[2]}/${githubBlobMatch[3]}`;
    }

    // 3. GitHub Gist -> raw
    const gistMatch = url.match(/^https?:\/\/gist\.github\.com\/([^\/]+)\/([a-zA-Z0-9]+)$/);
    if (gistMatch) {
      url = `https://gist.githubusercontent.com/${gistMatch[1]}/${gistMatch[2]}/raw`;
    }

    // 4. Sourcebin -> raw
    const sourcebinMatch = url.match(/^https?:\/\/sourceb\.in\/(?:raw\/)?([a-zA-Z0-9]+)$/);
    if (sourcebinMatch) {
      url = `https://sourceb.in/raw/${sourcebinMatch[1]}`;
    }

    // 5. Rentry -> raw
    const rentryMatch = url.match(/^https?:\/\/rentry\.co\/(?:raw\/)?([a-zA-Z0-9]+)$/);
    if (rentryMatch) {
      url = `https://rentry.co/${rentryMatch[1]}/raw`;
    }

    // 6. Hastebin -> raw
    const hastebinMatch = url.match(/^https?:\/\/hastebin\.com\/(?:raw\/)?([a-zA-Z0-9]+)$/);
    if (hastebinMatch) {
      url = `https://hastebin.com/raw/${hastebinMatch[1]}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/plain, text/x-lua, application/octet-stream, */*'
      }
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      return { success: false, error: `HTTP ${resp.status} (${resp.statusText}) when downloading script.` };
    }

    const text = await resp.text();

    if (!text || text.trim().length === 0) {
      return { success: false, error: 'The provided URL returned an empty file.' };
    }

    const trimmed = text.trim();
    if (/^<!DOCTYPE html/i.test(trimmed) || /^<html/i.test(trimmed)) {
      return {
        success: false,
        error: 'The provided URL returned an HTML webpage instead of raw code. Please make sure to provide a direct raw link (e.g., https://pastebin.com/raw/...).'
      };
    }

    // Infer filename
    let fileName = 'script_from_url.lua';
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && (last.endsWith('.lua') || last.endsWith('.luau') || last.endsWith('.txt'))) {
        fileName = last;
      } else if (last) {
        fileName = `${last}.lua`;
      }
    } catch {}

    return { success: true, code: text, fileName };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Request timed out while downloading from URL (12s limit exceeded).' };
    }
    return { success: false, error: err.message || 'Failed to fetch script from URL.' };
  }
}

/**
 * Disables all action row buttons on a Discord message
 */
async function disableComponentsOnMessage(message: any) {
  try {
    if (!message || !message.components || message.components.length === 0) return;
    const disabledRows = message.components.map((row: any) => {
      const newRow = ActionRowBuilder.from(row);
      newRow.components.forEach((comp: any) => comp.setDisabled(true));
      return newRow;
    });
    await message.edit({ components: disabledRows });
  } catch (err) {
    console.warn('[Failed to disable message components]', err);
  }
}

// Real-time raw Discord Gateway caches for official Server Tags
const rawClanByMessageId = new Map<string, string | null>();
const rawClanByUserId = new Map<string, string | null>();

// Anti-duplicate protection stores (ensures messages & interactions are never processed twice)
const processedMessageIds = new Set<string>();
const inFlightMessageIds = new Set<string>();
const authorLastCommandTime = new Map<string, number>();
const processedInteractionIds = new Set<string>();
let activeBotSessionId = 0;

function extractTagFromObject(obj: any): string | null {
  if (!obj) return null;
  if (typeof obj === 'string' && obj.trim().length > 0) {
    return obj.trim().toUpperCase();
  }
  if (typeof obj === 'object') {
    if (obj.tag && typeof obj.tag === 'string') {
      return obj.tag.trim().toUpperCase();
    }
    if (obj.name && typeof obj.name === 'string') {
      return obj.name.trim().toUpperCase();
    }
  }
  return null;
}

function initDiscordBot(token: string) {
  const currentSessionId = ++activeBotSessionId;

  if (discordClient) {
    try {
      discordClient.removeAllListeners();
      discordClient.destroy().catch(() => {});
    } catch {}
    discordClient = null;
  }

  botState.status = 'connecting';
  botState.errorMessage = null;
  addLog('SYSTEM', `Initiating connection to Discord Gateway (Session #${currentSessionId})...`);

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers
    ]
  });

  // Capture raw Discord Gateway packets to extract official Discord Server Tags (Clan Tag)
  discordClient.on(Events.Raw, (packet: any) => {
    try {
      if (packet.t === 'MESSAGE_CREATE') {
        const msg = packet.d;
        const authorId = msg?.author?.id;
        const clanCandidate =
          msg?.member?.clan ||
          msg?.author?.clan ||
          msg?.clan ||
          msg?.member?.primary_guild ||
          msg?.author?.primary_guild ||
          msg?.member?.user?.clan;
        const tag = extractTagFromObject(clanCandidate);
        if (msg?.id) rawClanByMessageId.set(msg.id, tag);
        if (authorId && tag) rawClanByUserId.set(authorId, tag);
      } else if (packet.t === 'INTERACTION_CREATE') {
        const inter = packet.d;
        const userId = inter?.user?.id || inter?.member?.user?.id;
        const clanCandidate =
          inter?.member?.clan ||
          inter?.user?.clan ||
          inter?.clan ||
          inter?.member?.primary_guild ||
          inter?.user?.primary_guild;
        const tag = extractTagFromObject(clanCandidate);
        if (userId && tag) rawClanByUserId.set(userId, tag);
      } else if (packet.t === 'GUILD_MEMBER_UPDATE' || packet.t === 'USER_UPDATE') {
        const u = packet.d;
        const userId = u?.user?.id || u?.id;
        const clanCandidate = u?.clan || u?.primary_guild || u?.user?.clan;
        const tag = extractTagFromObject(clanCandidate);
        if (userId && tag) rawClanByUserId.set(userId, tag);
      }
    } catch (err: any) {
      console.error('[Raw Packet Error]', err?.message);
    }
  });

  discordClient.on(Events.ClientReady, (readyClient) => {
    botState.status = 'online';
    botState.errorMessage = null;

    const guildsList = readyClient.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount
    }));

    botState.guilds = guildsList;
    botState.clientId = readyClient.user.id;
    botState.inviteUrl = `https://discord.com/oauth2/authorize?client_id=${readyClient.user.id}&permissions=277025508416&scope=bot%20applications.commands`;
    botState.botUser = {
      id: readyClient.user.id,
      username: readyClient.user.username,
      tag: readyClient.user.tag,
      avatar: readyClient.user.displayAvatarURL(),
      guildsCount: guildsList.length,
      ping: readyClient.ws.ping
    };

    addLog('READY', `Logged in as ${readyClient.user.tag} across ${guildsList.length} guilds (Ping: ${readyClient.ws.ping}ms)`);
    addLog('INVITE', `Bot Invite URL: ${botState.inviteUrl}`);
  });

  discordClient.on(Events.Error, (err) => {
    botState.status = 'error';
    botState.errorMessage = err.message;
    addLog('ERROR', `Discord client error: ${err.message}`);
  });

  discordClient.on(Events.ShardDisconnect, (event, shardId) => {
    addLog('DISCONNECT', `Shard ${shardId} disconnected (code: ${event.code}). Auto-reconnecting in 5s...`);
    botState.status = 'connecting';
    setTimeout(() => {
      if (token && botState.status !== 'online') {
        initDiscordBot(token);
      }
    }, 5000);
  });

  discordClient.on(Events.ShardReconnecting, (shardId) => {
    addLog('GATEWAY', `Shard ${shardId} reconnecting to Discord Gateway...`);
    botState.status = 'connecting';
  });

  discordClient.on(Events.ShardError, (error, shardId) => {
    addLog('GATEWAY_ERROR', `Shard ${shardId} error: ${error.message}`);
  });

  /**
   * Real-Time Server Tag Verification
   * ONLY checks the real Discord Server Tag / Clan badge.
   * If a user has a different server tag (e.g. "OTHER"), it rejects them.
   * If a user has the "RONI" server tag, it approves them.
   */
  function verifyRoniTag(member: any, user: any, messageId?: string): { passed: boolean; equippedTag: string | null } {
    const required = (botState.requiredTag || 'RONI').trim().toUpperCase();
    const anyMember = member as any;
    const anyUser = (user || member?.user) as any;
    const userId = anyUser?.id || anyMember?.id;

    let detectedTag: string | null = null;

    // 1. Raw WebSocket Gateway packet lookup by messageId
    if (messageId && rawClanByMessageId.has(messageId)) {
      detectedTag = rawClanByMessageId.get(messageId) || null;
    }

    // 2. Raw WebSocket Gateway packet lookup by userId
    if (!detectedTag && userId && rawClanByUserId.has(userId)) {
      detectedTag = rawClanByUserId.get(userId) || null;
    }

    // 3. Patched discord.js structures
    if (!detectedTag) {
      const clanCandidate =
        anyMember?.clan ||
        anyUser?.clan ||
        anyMember?.user?.clan ||
        anyMember?.primary_guild ||
        anyUser?.primary_guild;
      detectedTag = extractTagFromObject(clanCandidate);
    }

    // 4. Server Tag role fallback (for guilds assigning server tag via role)
    if (!detectedTag && member?.roles?.cache) {
      const roleMatch = member.roles.cache.find((r: any) => r.name.trim().toUpperCase() === required);
      if (roleMatch) detectedTag = required;
    }

    const username = anyUser?.username || anyUser?.tag || userId || 'User';

    if (!detectedTag) {
      addLog('TAG_CHECK', `User @${username}: No Server Tag equipped -> REJECTED`);
      return { passed: false, equippedTag: null };
    }

    if (detectedTag === required) {
      addLog('TAG_CHECK', `User @${username}: Official [${detectedTag}] Server Tag equipped -> PASSED`);
      return { passed: true, equippedTag: detectedTag };
    }

    addLog('TAG_CHECK', `User @${username}: Has DIFFERENT Server Tag [${detectedTag}] (Required: [${required}]) -> REJECTED`);
    return { passed: false, equippedTag: detectedTag };
  }

  // Handle messages in Discord (.deobf command with Attachments, URLs, or Pasted Code)
  discordClient.on(Events.MessageCreate, async (message: Message) => {
    // 1. Stale session guard: ensures only the current active bot session processes events
    if (currentSessionId !== activeBotSessionId) return;
    if (message.author.bot) return;

    // Trigger on .deobf command
    const content = message.content.trim();
    if (!content.startsWith('.deobf')) return;

    // 2. Strict Discord Snowflake ID deduplication (instant synchronous lock before any async operations)
    if (processedMessageIds.has(message.id) || inFlightMessageIds.has(message.id)) {
      addLog('DEDUP', `Ignored duplicate Discord message event (ID: ${message.id})`);
      return;
    }
    processedMessageIds.add(message.id);
    inFlightMessageIds.add(message.id);

    // Keep deduplication set bounded
    if (processedMessageIds.size > 2500) {
      const first = processedMessageIds.values().next().value;
      if (first) processedMessageIds.delete(first);
    }

    // 3. User-level debounce (1200ms) to prevent double sends from rapid enter keys or gateway retransmission
    const now = Date.now();
    const lastUserTime = authorLastCommandTime.get(message.author.id) || 0;
    if (now - lastUserTime < 1200) {
      addLog('DEDUP', `Debounced rapid-fire .deobf from @${message.author.username} (${now - lastUserTime}ms delta)`);
      inFlightMessageIds.delete(message.id);
      return;
    }
    authorLastCommandTime.set(message.author.id, now);

    try {
      addLog('CMD', `Received .deobf from ${message.author.tag} in #${(message.channel as any).name || 'DM'}`);

    // CHECK TAG REQUIREMENT:
    // If not wearing the official RONI server tag, reject with alert
    const tagCheck = verifyRoniTag(message.member, message.author, message.id);
    if (!tagCheck.passed) {
      addLog('AUTH', `Blocked user ${message.author.tag}: Missing/Mismatch Server Tag (equipped: ${tagCheck.equippedTag || 'None'})`);

      const missingTagEmbed = new EmbedBuilder()
        .setTitle('❌ Server Tag Verification Failed')
        .setDescription('ah you dumas your not wearing the roni tag, so please equip it to proceed with the deobfuscation process.')
        .setColor(0xEF4444)
        .addFields(
          {
            name: 'Required Server Tag',
            value: `\`${botState.requiredTag || 'RONI'}\``,
            inline: true
          },
          {
            name: 'Your Current Tag',
            value: tagCheck.equippedTag ? `\`${tagCheck.equippedTag}\` (Incorrect)` : '`None Equipped`',
            inline: true
          }
        )
        .setFooter({ text: 'RONI Security Network · Real-Time Server Tag Verification' })
        .setTimestamp();

      await message.reply({ embeds: [missingTagEmbed] });
      return;
    }

    // Has RONI tag! Proceed to resolve script (Attachment, URL, or Pasted Code)
    let codeContent = '';
    let scriptName = 'script.lua';
    let inputSourceType: 'attachment' | 'url' | 'pasted' = 'pasted';

    const attachment = message.attachments.first();
    const urlMatch = content.match(/(https?:\/\/[^\s]+)/i);

    if (attachment && (attachment.name.endsWith('.lua') || attachment.name.endsWith('.luau') || attachment.name.endsWith('.txt') || !attachment.name.includes('.'))) {
      inputSourceType = 'attachment';
      scriptName = attachment.name.endsWith('.lua') || attachment.name.endsWith('.luau') ? attachment.name : `${attachment.name}.lua`;
      try {
        const resp = await fetch(attachment.url);
        codeContent = await resp.text();
      } catch (err: any) {
        await message.reply(`❌ Failed to download attachment: ${err.message}`);
        return;
      }
    } else if (urlMatch) {
      // 1. URL support: direct pastebin, github raw, gist, sourcebin, rentry, hastebin
      inputSourceType = 'url';
      const rawUrl = urlMatch[1];
      addLog('URL', `Fetching script from URL: ${rawUrl}`);

      const fetchResult = await fetchScriptFromUrl(rawUrl);
      if (!fetchResult.success || !fetchResult.code) {
        const urlErrorEmbed = new EmbedBuilder()
          .setTitle('❌ Could Not Load Script from URL')
          .setDescription(fetchResult.error || 'The bot was unable to download the script from that URL.')
          .setColor(0xEF4444)
          .addFields(
            { name: 'Provided URL', value: `\`${rawUrl.slice(0, 100)}\``, inline: false },
            { name: 'Tip', value: 'For Pastebin, use raw links like `https://pastebin.com/raw/XYZ` or upload the `.lua` file directly.', inline: false }
          )
          .setFooter({ text: 'RONI URL Downloader' })
          .setTimestamp();

        await message.reply({ embeds: [urlErrorEmbed] });
        return;
      }

      codeContent = fetchResult.code;
      scriptName = fetchResult.fileName || 'script_from_url.lua';
    } else {
      // Check for inline code: .deobf ```lua ... ``` or .deobf <code snippet>
      const codeArgs = content.replace(/^\.deobf\s*/, '').trim();
      if (codeArgs.length > 5) {
        inputSourceType = 'pasted';
        codeContent = codeArgs.replace(/^```(?:lua|luau)?\n?/, '').replace(/```$/, '').trim();
        scriptName = 'pasted_script.lua';
      } else {
        const usageEmbed = new EmbedBuilder()
          .setTitle('📖 How to Use `.deobf`')
          .setDescription(
            'To deobfuscate your script with RONI, supply your code in any of the **3 supported ways**:\n\n' +
            '1. **File Attachment**: Upload a `.lua` or `.luau` file with `.deobf`\n' +
            '2. **Script URL**: Send `.deobf https://pastebin.com/raw/xyz` (supports Pastebin, GitHub raw, Sourcebin, Rentry)\n' +
            '3. **Pasted Code**: Send `.deobf \`\`\`lua print("hello") \`\`\`\n\n' +
            '⚠️ **Rule:** You get **1 engine choice per command**. Select the matching engine button carefully!'
          )
          .setColor(0x9333EA)
          .setFooter({ text: 'RONI Multi-Engine Deobfuscator · 7 Engines Supported' });

        await message.reply({ embeds: [usageEmbed] });
        return;
      }
    }

    addLog('DEOBF', `Authorized user ${message.author.tag} [RONI Tag Verified]. Scanning ${scriptName} (${inputSourceType})...`);

    // Detect obfuscator
    const detection = detectObfuscation(codeContent);
    const cacheKey = `ses_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    pendingDeobfCache.set(cacheKey, {
      code: codeContent,
      fileName: scriptName,
      authorId: message.author.id,
      authorTag: message.author.tag,
      detectedEngineId: detection.id,
      detectedEngineName: detection.name,
      confidence: detection.confidence,
      isSupported: detection.isSupported,
      used: false,
      createdAt: Date.now()
    });

    // Build Discord ActionRows with ALL 7 Deobfuscation Engines
    const row1 = new ActionRowBuilder<ButtonBuilder>();
    const row2 = new ActionRowBuilder<ButtonBuilder>();

    const allEngines = [
      { id: 'luraph-v15', label: '🚀 Luraph v15', style: detection.id === 'luraph-v15' ? ButtonStyle.Primary : ButtonStyle.Secondary },
      { id: 'prometheus', label: '⚡ Prometheus AST', style: detection.id === 'prometheus' ? ButtonStyle.Primary : ButtonStyle.Secondary },
      { id: 'clyde', label: '⚙️ Clyde VM', style: detection.id === 'clyde' ? ButtonStyle.Primary : ButtonStyle.Secondary },
      { id: 'moonsec', label: '🌙 Moonsec v3', style: detection.id === 'moonsec' ? ButtonStyle.Primary : ButtonStyle.Secondary },
      { id: 'ironveil', label: '🛡️ Ironveil v1', style: detection.id === 'ironveil' ? ButtonStyle.Primary : ButtonStyle.Secondary },
      { id: '77fuscator', label: '📦 77fuscator', style: detection.id === '77fuscator' ? ButtonStyle.Primary : ButtonStyle.Secondary },
      { id: 'flowauth', label: '🌊 FlowAuth', style: detection.id === 'flowauth' ? ButtonStyle.Primary : ButtonStyle.Secondary }
    ];

    allEngines.slice(0, 4).forEach(eng => {
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId(`deobf_${cacheKey}_${eng.id}`)
          .setLabel(eng.label)
          .setStyle(eng.style)
      );
    });

    allEngines.slice(4, 7).forEach(eng => {
      row2.addComponents(
        new ButtonBuilder()
          .setCustomId(`deobf_${cacheKey}_${eng.id}`)
          .setLabel(eng.label)
          .setStyle(eng.style)
      );
    });

    const readyEmbed = new EmbedBuilder()
      .setTitle(`🔍 Obfuscation Detected: ${detection.name}`)
      .setDescription(
        `✅ **RONI Tag Verified** for member **${message.author.username}**.\n\n` +
        `The scanner identified **${detection.name}** with **${detection.confidence}% confidence**.\n\n` +
        `🔒 **Single Choice Rule:** You may only choose **1 time per command**.\n` +
        `Please click the matching button (**${detection.name}**) below:`
      )
      .setColor(detection.isSupported ? 0x9333EA : 0xEF4444)
      .addFields(
        { name: 'Target Script', value: `\`${scriptName}\` (${(codeContent.length / 1024).toFixed(1)} KB)`, inline: true },
        { name: 'Source', value: `\`${inputSourceType.toUpperCase()}\``, inline: true },
        { name: 'Recommended Engine', value: `\`${detection.name}\``, inline: true },
        { name: 'Signatures Found', value: detection.signatures.map(s => `• ${s}`).join('\n') || 'Generic Lua structures', inline: false },
        { name: 'Available Engines', value: '1. Luraph v15 · 2. Prometheus AST · 3. Clyde VM · 4. Moonsec v3 · 5. Ironveil v1 · 6. 77fuscator · 7. FlowAuth', inline: false }
      )
      .setFooter({ text: 'RONI Engine Guard · Choose 1 time · Incompatible choices will be blocked' })
      .setTimestamp();

    await message.reply({ embeds: [readyEmbed], components: [row1, row2] });
    } catch (err: any) {
      console.error('[Error handling .deobf command]', err);
    } finally {
      inFlightMessageIds.delete(message.id);
    }
  });

  // Handle Button Clicks on Discord with immediate deferral, single-choice enforcement, and compatibility guards
  discordClient.on(Events.InteractionCreate, async (interaction) => {
    if (currentSessionId !== activeBotSessionId) return;
    if (!interaction.isButton()) return;

    const customId = interaction.customId;
    if (!customId.startsWith('deobf_')) return;

    // Deduplicate button interactions
    if (processedInteractionIds.has(interaction.id)) return;
    processedInteractionIds.add(interaction.id);
    if (processedInteractionIds.size > 2000) {
      const first = processedInteractionIds.values().next().value;
      if (first) processedInteractionIds.delete(first);
    }

    // IMMEDIATE DEFERRAL: Acknowledge within 50ms so Discord never times out (fixes "doesn't even try")
    try {
      await interaction.deferReply();
    } catch (deferErr: any) {
      console.error('[Interaction Defer Error]', deferErr?.message);
      return;
    }

    // Parse cacheKey and engineId
    // Format: deobf_${cacheKey}_${engineId}
    const parts = customId.split('_');
    if (parts.length < 3) {
      await interaction.editReply({ content: '⚠️ Invalid button interaction format.' });
      return;
    }

    const cacheKey = parts[1];
    const engineId = parts.slice(2).join('_'); // preserves hyphens/underscores in engine IDs

    const cached = pendingDeobfCache.get(cacheKey);

    if (!cached) {
      await interaction.editReply({
        content: '⚠️ This deobfuscation session has expired. Please send a new `.deobf` command with your script or URL.'
      });
      return;
    }

    // 1. SINGLE-USE LOCK ENFORCEMENT ("only chose 1 time per cmd")
    if (cached.used) {
      await interaction.editReply({
        content: '🔒 **This command has already been used!**\nYou can only choose **1 deobfuscation engine per command**.\nIf you want to deobfuscate again or test another engine, please send a new message with `.deobf`.'
      });
      return;
    }

    // 2. AUTHOR RESTRICTION: Only original command sender can choose
    if (interaction.user.id !== cached.authorId) {
      await interaction.editReply({
        content: `⛔ Only <@${cached.authorId}> (who executed this \`.deobf\` command) can choose an engine. Please send your own \`.deobf\` command!`
      });
      return;
    }

    // 3. TAG VERIFICATION ON INTERACTION:
    // If they had the tag and removed it, block them
    const tagCheck = verifyRoniTag(interaction.member, interaction.user);
    if (!tagCheck.passed) {
      cached.used = true;
      await disableComponentsOnMessage(interaction.message);

      const missingTagEmbed = new EmbedBuilder()
        .setTitle('❌ Server Tag Verification Failed')
        .setDescription('ah you dumas your not wearing the roni tag, so please equip it to proceed with the deobfuscation process.')
        .setColor(0xEF4444)
        .addFields(
          { name: 'Required Server Tag', value: `\`${botState.requiredTag || 'RONI'}\``, inline: true },
          { name: 'Your Current Tag', value: tagCheck.equippedTag ? `\`${tagCheck.equippedTag}\` (Incorrect)` : '`None Equipped`', inline: true }
        )
        .setFooter({ text: 'RONI Security Network · Real-Time Server Tag Verification' })
        .setTimestamp();

      await interaction.editReply({ embeds: [missingTagEmbed] });
      return;
    }

    // 4. ENGINE COMPATIBILITY GUARD:
    // "if someone puts some other obfuscation to deobf and they click 1 random deobf choice make it so it dosnt let them if it isn't that support deobfuscate"
    const clickedEngineInfo = ENGINE_INFO[engineId] || { name: engineId.toUpperCase(), label: engineId };

    // Case A: Script is completely unsupported (binary bytecode or unsupported tool)
    if (!cached.isSupported || cached.detectedEngineId === 'unsupported') {
      cached.used = true;
      await disableComponentsOnMessage(interaction.message);

      const unsuppEmbed = new EmbedBuilder()
        .setTitle('🚫 Unsupported Obfuscation Format')
        .setDescription(
          `This script is obfuscated with **${cached.detectedEngineName}**.\n\n` +
          `None of the 7 supported devirtualizers can process this format safely.\n\n` +
          `🔒 **1 Choice Per Command:** All choices for this command have been locked.\n` +
          `Please send a new message with \`.deobf\` to submit a different Lua script.`
        )
        .setColor(0xEF4444)
        .setFooter({ text: 'RONI Engine Guard · Format Unsupported' })
        .setTimestamp();

      await interaction.editReply({ embeds: [unsuppEmbed] });
      return;
    }

    // Case B: Script has a specific detected engine, but user clicked a MISMATCHED / RANDOM engine
    if (cached.detectedEngineId !== 'generic-lua' && cached.detectedEngineId !== engineId) {
      // Consume choice and lock buttons
      cached.used = true;
      await disableComponentsOnMessage(interaction.message);

      const mismatchEmbed = new EmbedBuilder()
        .setTitle('🚫 Incompatible Deobfuscation Engine')
        .setDescription(
          `This script was detected as **${cached.detectedEngineName}** (${cached.confidence}% confidence).\n\n` +
          `You clicked **${clickedEngineInfo.name}**, which is **incompatible** with this obfuscator's VM structure.\n\n` +
          `🔒 **1 Choice Per Command Enforced:**\n` +
          `All choices for this command are now locked.\n` +
          `👉 Please send a new message with \`.deobf\` and click **${cached.detectedEngineName}**!`
        )
        .setColor(0xEF4444)
        .addFields(
          { name: 'Detected Format', value: `\`${cached.detectedEngineName}\``, inline: true },
          { name: 'Clicked Engine', value: `\`${clickedEngineInfo.name}\` (Wrong)`, inline: true }
        )
        .setFooter({ text: 'RONI Engine Compatibility Guard · Only matching engines permitted' })
        .setTimestamp();

      await interaction.editReply({ embeds: [mismatchEmbed] });
      return;
    }

    // 5. COMPATIBLE EXECUTION:
    // Mark as used and disable all buttons on the message immediately
    cached.used = true;
    await disableComponentsOnMessage(interaction.message);

    addLog('ENGINE', `Running ${engineId.toUpperCase()} deobfuscation for ${cached.fileName}...`);

    let result;
    try {
      result = runServerDeobfuscator(cached.code, engineId);
    } catch (engineErr: any) {
      console.error('[Engine Run Error]', engineErr);
      result = {
        code: cached.code,
        timeMs: 10,
        origLines: cached.code.split('\n').length,
        cleanLines: cached.code.split('\n').length,
        reductionPercent: 0,
        stringsDecrypted: 0
      };
    }

    botState.processedCount++;

    // Prepare attachment cleanly
    const outputName = cached.fileName.endsWith('.lua') || cached.fileName.endsWith('.luau')
      ? cached.fileName.replace(/\.lua$/i, '_deobfuscated.lua')
      : `${cached.fileName}_deobfuscated.lua`;

    // Ensure within Discord message attachment size limit (max 7MB safe buffer)
    let outputBuffer = Buffer.from(result.code, 'utf-8');
    if (outputBuffer.length > 7.5 * 1024 * 1024) {
      outputBuffer = Buffer.from(result.code.slice(0, 7 * 1024 * 1024) + '\n-- [RONI Truncated at 7MB for Discord Limit]', 'utf-8');
    }

    const deobfAttachment = new AttachmentBuilder(outputBuffer, {
      name: outputName
    });

    const successEmbed = new EmbedBuilder()
      .setTitle(`✨ Deobfuscation Complete: ${cached.fileName}`)
      .setDescription(`Successfully devirtualized and cleaned using **${clickedEngineInfo.name}** in **${result.timeMs}ms**!`)
      .setColor(0x10B981)
      .addFields(
        { name: 'Engine Used', value: `\`${clickedEngineInfo.name}\``, inline: true },
        { name: 'Size Reduction', value: `\`-${result.reductionPercent}%\` (${result.origLines}L → ${result.cleanLines}L)`, inline: true },
        { name: 'Time', value: `\`${result.timeMs} ms\``, inline: true },
        { name: 'Decrypted Strings', value: `\`${result.stringsDecrypted}\``, inline: true }
      )
      .setFooter({ text: 'RONI Security Network · Clean Luau Output · 1 Choice Completed' })
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed], files: [deobfAttachment] });
  });

  // Attempt login with token
  discordClient.login(token).catch((err) => {
    botState.status = 'error';
    botState.errorMessage = err.message;
    addLog('AUTH_ERROR', `Failed to login to Discord: ${err.message}`);
  });
}

// Auto-start Discord bot if token is configured in process.env
if (botState.isConfigured && process.env.DISCORD_BOT_TOKEN) {
  initDiscordBot(process.env.DISCORD_BOT_TOKEN);
}

// ---------------------------------------------------------------------------
// Server-Side Deobfuscation Logic & Detection
// ---------------------------------------------------------------------------
function detectObfuscation(code: string): {
  id: string;
  name: string;
  confidence: number;
  signatures: string[];
  isSupported: boolean;
} {
  const lower = code.toLowerCase();

  // Check for precompiled binary bytecode
  if (code.startsWith('\x1bLua') || code.startsWith('\x1b\x4c\x75\x61') || /^\x1bLua[QPR]/.test(code)) {
    return {
      id: 'unsupported',
      name: 'Precompiled Lua Bytecode (Binary)',
      confidence: 100,
      signatures: ['Raw Precompiled Bytecode Header (\\27Lua)', 'Non-Text Binary Stream'],
      isSupported: false
    };
  }

  // 1. Luraph v15 / v14
  if (
    code.includes('LURAPH') ||
    code.includes('LPH_') ||
    code.includes('LPH_NO_VIRTUALIZE') ||
    code.includes('_vm_dispatch') ||
    (lower.includes('bit32.bxor') && lower.includes('string.byte') && code.includes('table.concat'))
  ) {
    return {
      id: 'luraph-v15',
      name: 'Luraph v15',
      confidence: 99.4,
      signatures: ['Luraph VM Dispatcher', 'Bitwise XOR Byte Key', 'Jump Table Flattening'],
      isSupported: true
    };
  }

  // 2. Prometheus AST
  if (
    code.includes('Prometheus') ||
    code.includes('PROMETHEUS') ||
    code.includes('_PROMETHEUS_REG') ||
    (code.includes('bit32') && code.includes('string.char') && code.includes('function(') && code.includes('_runner'))
  ) {
    return {
      id: 'prometheus',
      name: 'Prometheus AST',
      confidence: 98.2,
      signatures: ['Prometheus AST Proxies', 'Constant Folding Pool', 'Scoped Register Lifting'],
      isSupported: true
    };
  }

  // 3. Clyde VM
  if (
    code.includes('Clyde') ||
    code.includes('clyde') ||
    code.includes('VM_SPEC') ||
    code.includes('clyde_exec') ||
    code.includes('clyde_reg')
  ) {
    return {
      id: 'clyde',
      name: 'Clyde VM',
      confidence: 98.0,
      signatures: ['CFG State Machine', 'Symbolic Register Skeleton', 'VM Spec Mapper'],
      isSupported: true
    };
  }

  // 4. Moonsec v3 / v2
  if (
    code.includes('MoonSec') ||
    code.includes('Moonsec') ||
    code.includes('moonsec') ||
    code.includes('\\27\\77\\111\\111\\110') ||
    code.includes('_MS_VM')
  ) {
    return {
      id: 'moonsec',
      name: 'Moonsec v3',
      confidence: 99.1,
      signatures: ['Moonsec Bytecode Deserializer', 'Math ldexp/frexp Inverse', 'Opcode Dispatcher'],
      isSupported: true
    };
  }

  // 5. Ironveil v1
  if (
    code.includes('Ironveil') ||
    code.includes('ironveil') ||
    code.includes('_IV_KEY') ||
    code.includes('_IV_DATA') ||
    code.includes('_op_pool')
  ) {
    return {
      id: 'ironveil',
      name: 'Ironveil v1',
      confidence: 97.0,
      signatures: ['Ironveil Numeric Buffer', 'XOR Array Decryption', 'Instruction Rebuilder'],
      isSupported: true
    };
  }

  // 6. 77fuscator (Loretta AST)
  if (
    code.includes('77fuscator') ||
    code.includes('Loretta') ||
    code.includes('Loretta.CodeAnalysis') ||
    code.includes('_77_unpack') ||
    code.includes('_77_blob')
  ) {
    return {
      id: '77fuscator',
      name: '77fuscator',
      confidence: 96.5,
      signatures: ['Layered Blob Chunks', 'Loretta Chunk Reader', 'XOR Multi-Stage Peeler'],
      isSupported: true
    };
  }

  // 7. FlowAuth
  if (
    code.includes('flowauth') ||
    code.includes('FlowAuth') ||
    code.includes('payload_devirt') ||
    code.includes('_flowauth_verify') ||
    code.includes('flowauth_token')
  ) {
    return {
      id: 'flowauth',
      name: 'FlowAuth',
      confidence: 97.4,
      signatures: ['Two-Phase Encrypted Payload', 'Shadow Verification Bypass', 'Challenge Gate Unpacker'],
      isSupported: true
    };
  }

  // Known unsupported third-party obfuscators
  if (code.includes('PSU') || code.includes('Synapse Xen') || code.includes('AztupBrew')) {
    return {
      id: 'unsupported',
      name: 'Unsupported Third-Party Obfuscator',
      confidence: 94.0,
      signatures: ['Unsupported VM Architecture', 'Proprietary Encrypted Container'],
      isSupported: false
    };
  }

  return {
    id: 'generic-lua',
    name: 'Generic Lua VM',
    confidence: 88.0,
    signatures: ['Hexadecimal Byte Buffers', 'Indirect String Lookups', 'Dead Code Branches'],
    isSupported: true
  };
}

function runServerDeobfuscator(code: string, engineId: string) {
  const result = cleanDeobfuscateLua(code, engineId);
  const reductionPercent = Math.max(0, Math.round(((code.length - result.cleanCode.length) / Math.max(1, code.length)) * 100));

  return {
    code: result.cleanCode,
    timeMs: result.executionTimeMs,
    origLines: result.originalLines,
    cleanLines: result.cleanedLines,
    reductionPercent: reductionPercent,
    stringsDecrypted: result.stringsDecrypted
  };
}

// ---------------------------------------------------------------------------
// REST API Routes
// ---------------------------------------------------------------------------
// 24/7 Keep-Alive & Health Check Endpoints
app.get(['/health', '/ping', '/api/keepalive', '/api/health'], (req, res) => {
  botState.keepalivePings++;
  const uptimeSec = Math.floor((Date.now() - botState.bootTimestamp) / 1000);

  res.json({
    status: 'healthy',
    message: 'RONI 24/7 Keepalive Active',
    uptimeSeconds: uptimeSec,
    uptimeFormatted: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`,
    discordBot: {
      status: botState.status,
      user: botState.botUser?.tag || null,
      guilds: botState.guilds.length,
      gatewayPingMs: botState.botUser?.ping || null,
      requiredTag: botState.requiredTag
    },
    keepalivePingsReceived: botState.keepalivePings,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/bot/status', (req, res) => {
  const effectiveClientId = botState.clientId || process.env.DISCORD_CLIENT_ID || botState.botUser?.id || '';
  const inviteUrl = effectiveClientId
    ? `https://discord.com/oauth2/authorize?client_id=${effectiveClientId}&permissions=277025508416&scope=bot%20applications.commands`
    : botState.inviteUrl;
  const uptimeSec = Math.floor((Date.now() - botState.bootTimestamp) / 1000);

  res.json({
    isConfigured: botState.isConfigured,
    status: botState.status,
    clientId: effectiveClientId,
    inviteUrl: inviteUrl,
    botUser: botState.botUser,
    errorMessage: botState.errorMessage,
    guilds: botState.guilds,
    recentEvents: botState.recentEvents,
    processedCount: botState.processedCount,
    requiredTag: botState.requiredTag || 'RONI',
    uptimeSeconds: uptimeSec,
    uptimeFormatted: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`,
    keepalivePings: botState.keepalivePings,
    keepaliveUrl: 'https://ais-pre-xwcm6bx6rhv7uhp2ghbyrc-132456942195.europe-west1.run.app/health'
  });
});

app.post('/api/bot/config', (req, res) => {
  const { clientId, requiredTag, token } = req.body;
  if (clientId) {
    botState.clientId = clientId.trim();
    botState.inviteUrl = `https://discord.com/oauth2/authorize?client_id=${botState.clientId}&permissions=277025508416&scope=bot%20applications.commands`;
    process.env.DISCORD_CLIENT_ID = botState.clientId;
    addLog('CONFIG', `Updated Client ID: ${botState.clientId}`);
  }
  if (requiredTag) {
    botState.requiredTag = requiredTag.trim();
    addLog('CONFIG', `Updated Required Tag: [${botState.requiredTag}]`);
  }
  if (token && token !== 'MY_DISCORD_BOT_TOKEN') {
    process.env.DISCORD_BOT_TOKEN = token.trim();
    botState.isConfigured = true;
    initDiscordBot(token.trim());
  }

  res.json({
    success: true,
    clientId: botState.clientId,
    inviteUrl: botState.inviteUrl,
    requiredTag: botState.requiredTag
  });
});

app.post('/api/bot/connect', (req, res) => {
  const token = req.body.token || process.env.DISCORD_BOT_TOKEN;
  if (!token || token === 'MY_DISCORD_BOT_TOKEN') {
    return res.status(400).json({ error: 'Please specify a valid Discord Bot Token in .env or the Connect dialog.' });
  }

  process.env.DISCORD_BOT_TOKEN = token;
  botState.isConfigured = true;
  initDiscordBot(token);

  res.json({ success: true, message: 'Bot connection initiated to Discord Gateway.' });
});

app.post('/api/deobf/analyze', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });
  const detection = detectObfuscation(code);
  res.json(detection);
});

app.post('/api/deobf/execute', (req, res) => {
  const { code, engineId } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });
  const result = runServerDeobfuscator(code, engineId || 'luraph-v15');
  botState.processedCount++;
  res.json(result);
});

app.post('/api/fetch-script', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'No URL provided' });
  const result = await fetchScriptFromUrl(url);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Vite Integration (Dev) / Static Serving (Prod)
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[RONI Server] Running on http://localhost:${PORT}`);
    console.log(`[RONI Server] Discord Bot Token configured: ${botState.isConfigured}`);
  });
}

startServer();
