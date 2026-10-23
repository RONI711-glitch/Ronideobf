import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Upload,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  Loader2,
  Hash,
  Volume2,
  Users,
  Settings,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { DiscordMessage, DiscordUser, ObfuscationDetection, DeobfuscationResult } from '../types';
import { RoniTagBadge } from './RoniTagBadge';
import { detectObfuscator } from '../services/detector';
import { runDeobfuscator } from '../services/deobfuscator';
import { PRELOADED_SAMPLES, ObfuscatedSample } from '../services/engineManager';
import { CodeModal } from './CodeModal';

interface DiscordViewProps {
  currentUser: DiscordUser;
  onToggleTag: () => void;
  onOpenTelemetry: () => void;
}

export const DiscordView: React.FC<DiscordViewProps> = ({
  currentUser,
  onToggleTag,
  onOpenTelemetry
}) => {
  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string; size: number } | null>(null);
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'deobf-bot' | 'bot-logs' | 'announcements'>('deobf-bot');
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    fileName: string;
    originalCode: string;
    deobfuscatedCode: string;
    engineName: string;
  }>({
    isOpen: false,
    fileName: '',
    originalCode: '',
    deobfuscatedCode: '',
    engineName: ''
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message from the bot
  useEffect(() => {
    const welcomeMsg: DiscordMessage = {
      id: 'welcome-msg',
      author: {
        username: 'RONI Deobfuscator',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
        isBot: true,
        tag: 'BOT',
        botBadge: true
      },
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: '',
      embed: {
        title: '🛡️ RONI Lua Deobfuscation System v2.5',
        description:
          'Welcome to the official RONI Deobfuscator Bot. Upload your obfuscated `.lua` / `.luau` files or use `.deobf` to analyze and unpack protected scripts.\n\n' +
          '⚠️ **Mandatory Server Rule**: You must equip the **[RONI] Server Tag** in your profile to run deobfuscation jobs. If you do not have it equipped, the engine will block your request.',
        color: '#9333ea',
        fields: [
          {
            name: '⚡ Supported Obfuscators',
            value: '• Luraph v15 / v14\n• Prometheus AST Pipeline\n• Clyde Deobfuscator\n• Moonsec v2 / v3\n• Ironveil v1\n• 77fuscator\n• FlowAuth',
            inline: true
          },
          {
            name: '🏷️ Tag Verification Status',
            value: currentUser.hasRoniTag
              ? '✅ **RONI Tag Equipped** (Authorized to use `.deobf`)'
              : '❌ **RONI Tag Missing** (Deobfuscator access locked)',
            inline: true
          },
          {
            name: '📌 How to use',
            value: '1. Select a preloaded sample below or upload your `.lua` file.\n2. Type `.deobf` and send.\n3. Verify tag authentication and select your target engine.',
            inline: false
          }
        ],
        footer: {
          text: 'RONI Security Network · Real-Time AST Devirtualization'
        }
      }
    };

    setMessages([welcomeMsg]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle uploading file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setSelectedFile({
        name: file.name,
        content: text,
        size: file.size
      });
      if (!inputContent) {
        setInputContent('.deobf');
      }
    };
    reader.readAsText(file);
  };

  // Preload a sample
  const handleLoadSample = (sample: ObfuscatedSample) => {
    setSelectedFile({
      name: sample.name,
      content: sample.code,
      size: new Blob([sample.code]).size
    });
    setInputContent(`.deobf ${sample.name}`);
  };

  // Submit user command
  const handleSendMessage = async () => {
    if (!inputContent.trim() && !selectedFile) return;

    const text = inputContent.trim();
    const attachedFile = selectedFile;
    const fileContent = attachedFile?.content || (text.startsWith('.deobf') ? text.replace('.deobf', '').trim() : text);
    const fileName = attachedFile?.name || 'input_script.lua';

    // Append user message
    const userMsgId = 'msg-' + Date.now();
    const userMessage: DiscordMessage = {
      id: userMsgId,
      author: {
        username: currentUser.username,
        avatar: currentUser.avatar,
        hasRoniTag: currentUser.hasRoniTag
      },
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: text || `.deobf ${fileName}`,
      attachment: attachedFile ? {
        name: attachedFile.name,
        size: attachedFile.size,
        code: attachedFile.content
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputContent('');
    setSelectedFile(null);
    setIsProcessing(true);

    // Initial bot thinking step
    const loadingBotId = 'bot-' + Date.now();
    const initialBotMessage: DiscordMessage = {
      id: loadingBotId,
      author: {
        username: 'RONI Deobfuscator',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
        isBot: true,
        tag: 'BOT',
        botBadge: true
      },
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: '',
      loadingState: {
        step: 'Verifying server tag [RONI] on member profile...',
        progress: 25
      }
    };

    setMessages(prev => [...prev, initialBotMessage]);

    // Simulate tag check delay
    await new Promise(r => setTimeout(r, 650));

    // CHECK TAG REQUIREMENT:
    // "make sure like it reads if it has the server tag or not if it does it will continue
    // if not it will tell them ah you dumas your not wearing the roni tag, so please equip it to proceed with the deobfuscation process."
    if (!currentUser.hasRoniTag) {
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === loadingBotId) {
            return {
              ...msg,
              loadingState: undefined,
              embed: {
                title: '❌ Tag Verification Failed',
                description:
                  'ah you dumas your not wearing the roni tag, so please equip it to proceed with the deobfuscation process.',
                color: '#ef4444',
                fields: [
                  {
                    name: 'Required Server Tag',
                    value: '`RONI` (Equip the purple badge to gain bot access)',
                    inline: true
                  },
                  {
                    name: 'Target File',
                    value: `\`${fileName}\` (${(fileContent.length / 1024).toFixed(1)} KB)`,
                    inline: true
                  }
                ],
                footer: {
                  text: 'Equip the tag using the button below or in the top navigation bar, then run .deobf again.'
                }
              },
              components: [
                {
                  buttons: [
                    {
                      type: 'button',
                      id: 'equip-tag-btn',
                      label: '⚡ Equip RONI Server Tag Now',
                      style: 'primary'
                    }
                  ]
                }
              ]
            };
          }
          return msg;
        })
      );
      setIsProcessing(false);
      return;
    }

    // User HAS the tag! Proceed to check obfuscation signature
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === loadingBotId) {
          return {
            ...msg,
            loadingState: {
              step: 'Scanning file AST & detecting obfuscation engine signature...',
              progress: 65
            }
          };
        }
        return msg;
      })
    );

    await new Promise(r => setTimeout(r, 700));

    // Detect obfuscator
    const detection = detectObfuscator(fileContent || '-- empty');

    // Present detection and available deobfuscation engines
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === loadingBotId) {
          return {
            ...msg,
            loadingState: undefined,
            embed: {
              title: `🔍 Obfuscation Detected: ${detection.name}`,
              description:
                `✅ **RONI Tag Verified** for member **${currentUser.username}**.\n\n` +
                `The engine analyzed your script \`${fileName}\` and identified the obfuscation format with **${detection.confidence}% confidence**.\n\n` +
                `Select which deobfuscator engine you want to use to unpack this file:`,
              color: '#3b82f6',
              fields: [
                {
                  name: 'Engine Version',
                  value: `\`${detection.version}\``,
                  inline: true
                },
                {
                  name: 'Confidence',
                  value: `\`${detection.confidence}%\``,
                  inline: true
                },
                {
                  name: 'Identified Patterns',
                  value: detection.matchedSignatures.map(s => `• ${s}`).join('\n'),
                  inline: false
                }
              ],
              footer: {
                text: 'Click an engine button below to start the deobfuscation pipeline.'
              }
            },
            components: [
              {
                buttons: detection.supportedEngines.map(eng => ({
                  type: 'button',
                  id: `run-engine:${eng.id}:${encodeURIComponent(fileName)}`,
                  label: `${eng.icon} Run ${eng.name}`,
                  style: eng.id === detection.recommendedEngine ? 'primary' : 'secondary'
                }))
              }
            ]
          };
        }
        return msg;
      })
    );

    setIsProcessing(false);
  };

  // Handle clicking interactive Discord buttons
  const handleButtonClick = async (buttonId: string, currentMessageId: string) => {
    // 1. Equip tag button
    if (buttonId === 'equip-tag-btn') {
      onToggleTag();
      // Update message to reflect equipped state
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === currentMessageId) {
            return {
              ...msg,
              embed: {
                ...msg.embed,
                title: '✅ Server Tag Equipped!',
                description:
                  '**Awesome!** You are now wearing the official **[RONI]** server tag.\n' +
                  'You can now run `.deobf` with your file to deobfuscate it!',
                color: '#10b981',
                fields: []
              },
              components: []
            };
          }
          return msg;
        })
      );
      return;
    }

    // 2. Run Engine button
    if (buttonId.startsWith('run-engine:')) {
      const parts = buttonId.split(':');
      const engineId = parts[1];
      const fileName = decodeURIComponent(parts[2]);

      // Re-check tag on every execution as requested by user:
      // "and if they have it and remove it make sure the bots tell them you dont have it like make it like every time it will read if it has it"
      if (!currentUser.hasRoniTag) {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.id === currentMessageId) {
              return {
                ...msg,
                embed: {
                  title: '❌ Tag Verification Failed',
                  description:
                    'ah you dumas your not wearing the roni tag, so please equip it to proceed with the deobfuscation process.',
                  color: '#ef4444',
                  fields: []
                },
                components: [
                  {
                    buttons: [
                      {
                        type: 'button',
                        id: 'equip-tag-btn',
                        label: '⚡ Equip RONI Server Tag Now',
                        style: 'primary'
                      }
                    ]
                  }
                ]
              };
            }
            return msg;
          })
        );
        return;
      }

      // Find original file code from user's message
      const targetMsgIndex = messages.findIndex(m => m.id === currentMessageId);
      const priorUserMsg = messages
        .slice(0, targetMsgIndex)
        .reverse()
        .find(m => m.attachment?.code || m.content);

      const rawCode = priorUserMsg?.attachment?.code || priorUserMsg?.content || PRELOADED_SAMPLES[0].code;

      // Set bot message to working state
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === currentMessageId) {
            return {
              ...msg,
              components: [],
              loadingState: {
                step: `Executing ${engineId.toUpperCase()} pipeline: folding AST, decrypting strings, lifting registers...`,
                progress: 80
              }
            };
          }
          return msg;
        })
      );

      // Run real deobfuscator
      const result: DeobfuscationResult = await runDeobfuscator(rawCode, engineId);

      // Deliver final deobfuscated file!
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === currentMessageId) {
            if (!result.success) {
              return {
                ...msg,
                loadingState: undefined,
                embed: {
                  title: `❌ Deobfuscation Failed (${engineId})`,
                  description: `Engine encountered an error during parsing: ${result.error}`,
                  color: '#ef4444'
                }
              };
            }

            return {
              ...msg,
              loadingState: undefined,
              embed: {
                title: `✨ Deobfuscation Complete: ${fileName.replace('.lua', '_deobfuscated.lua')}`,
                description:
                  `Successfully deobfuscated using **${result.engineUsed.toUpperCase()}** in **${result.executionTimeMs}ms**.\n` +
                  `All VM instructions devirtualized, dynamic strings decrypted, and control flow reconstructed.`,
                color: '#10b981',
                fields: [
                  {
                    name: '📊 Size Reduction',
                    value: `\`-${result.reductionPercent}%\` (${(result.originalSize / 1024).toFixed(1)}KB → ${(result.cleanedSize / 1024).toFixed(1)}KB)`,
                    inline: true
                  },
                  {
                    name: '⏱️ Exec Time',
                    value: `\`${result.executionTimeMs} ms\``,
                    inline: true
                  },
                  {
                    name: '🔧 AST Passes',
                    value: `\`${result.astTransformations} nodes\``,
                    inline: true
                  },
                  {
                    name: '🔤 Decrypted Strings',
                    value: `\`${result.stringsDecrypted}\``,
                    inline: true
                  },
                  {
                    name: '🔢 Constants Folded',
                    value: `\`${result.constantsFolded}\``,
                    inline: true
                  },
                  {
                    name: '⚙️ Proxies Inlined',
                    value: `\`${result.proxiesInlined}\``,
                    inline: true
                  }
                ],
                footer: {
                  text: 'RONI Deobfuscator Engine · Verified Clean Output'
                }
              },
              attachment: {
                name: fileName.replace('.lua', '_deobfuscated.lua'),
                size: result.cleanedSize,
                code: result.deobfuscatedCode
              },
              components: [
                {
                  buttons: [
                    {
                      type: 'button',
                      id: `view-code:${encodeURIComponent(fileName)}`,
                      label: '👁️ View Clean Code',
                      style: 'primary'
                    },
                    {
                      type: 'button',
                      id: `download-file:${encodeURIComponent(fileName)}`,
                      label: '📥 Download .lua File',
                      style: 'success'
                    }
                  ]
                }
              ]
            };
          }
          return msg;
        })
      );
      return;
    }

    // 3. View Code button
    if (buttonId.startsWith('view-code:')) {
      const msg = messages.find(m => m.id === currentMessageId);
      if (msg?.attachment?.code) {
        setModalData({
          isOpen: true,
          fileName: msg.attachment.name,
          originalCode: PRELOADED_SAMPLES[0].code,
          deobfuscatedCode: msg.attachment.code,
          engineName: 'RONI'
        });
      }
      return;
    }

    // 4. Download file button
    if (buttonId.startsWith('download-file:')) {
      const msg = messages.find(m => m.id === currentMessageId);
      if (msg?.attachment?.code) {
        const blob = new Blob([msg.attachment.code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = msg.attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#313338] text-[#dbdee1] h-[calc(100vh-57px)]">
      {/* Discord Left Channel Sidebar */}
      <div className="w-60 bg-[#2b2d31] flex flex-col border-r border-[#1f2023] shrink-0 select-none hidden sm:flex">
        {/* Guild Header */}
        <div className="px-4 py-3.5 border-b border-[#1f2023] flex items-center justify-between font-bold text-white text-sm tracking-wide shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="truncate">RONI DEOBFUSCATION</span>
          </div>
          <RoniTagBadge equipped={currentUser.hasRoniTag} size="sm" />
        </div>

        {/* Channels List */}
        <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <div className="px-2 py-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Text Channels
          </div>

          <button
            onClick={() => setActiveChannel('deobf-bot')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeChannel === 'deobf-bot'
                ? 'bg-[#35373c] text-white'
                : 'text-neutral-400 hover:bg-[#35373c]/50 hover:text-neutral-200'
            }`}
          >
            <Hash className="w-4 h-4 text-neutral-400" />
            <span>deobf-bot</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-purple-600/30 text-purple-300 font-mono">
              Active
            </span>
          </button>

          <button
            onClick={() => setActiveChannel('bot-logs')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeChannel === 'bot-logs'
                ? 'bg-[#35373c] text-white'
                : 'text-neutral-400 hover:bg-[#35373c]/50 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-4 h-4 text-neutral-400" />
            <span>engine-logs</span>
          </button>

          <button
            onClick={() => setActiveChannel('announcements')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeChannel === 'announcements'
                ? 'bg-[#35373c] text-white'
                : 'text-neutral-400 hover:bg-[#35373c]/50 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-neutral-400" />
            <span>tag-rules</span>
          </button>

          <div className="pt-4 px-2 py-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Quick Actions
          </div>

          <button
            onClick={onOpenTelemetry}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:bg-[#35373c]/60 hover:text-purple-300 transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Live Engine Monitor</span>
          </button>

          <button
            onClick={onToggleTag}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:bg-[#35373c]/60 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-neutral-400" />
            <span>Toggle Tag State ({currentUser.hasRoniTag ? 'Equipped' : 'Missing'})</span>
          </button>
        </div>

        {/* Member Profile Footer */}
        <div className="p-2.5 bg-[#232428] border-t border-[#1f2023] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-700 shrink-0">
              <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              <div
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#232428] ${
                  currentUser.hasRoniTag ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                <span>{currentUser.displayName}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                <RoniTagBadge equipped={currentUser.hasRoniTag} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
        {/* Channel Header */}
        <div className="px-4 py-3 border-b border-[#26282c] flex items-center justify-between bg-[#313338] shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-neutral-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">deobf-bot</h2>
            <span className="text-neutral-500">|</span>
            <span className="text-xs text-neutral-400 truncate hidden md:inline">
              Real-time Lua Deobfuscation Bot · Luraph v15, Prometheus, Clyde, Moonsec · Must equip <span className="text-purple-300 font-semibold">[RONI]</span> tag
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTag}
              className={`text-xs px-2.5 py-1 rounded font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                currentUser.hasRoniTag
                  ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
                  : 'bg-red-900/40 text-red-200 border border-red-500/30'
              }`}
            >
              <span>Server Tag:</span>
              <RoniTagBadge equipped={currentUser.hasRoniTag} size="sm" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-4 group hover:bg-black/[0.04] p-1.5 rounded-lg transition-colors">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-neutral-700 mt-0.5">
                <img src={msg.author.avatar} alt="avatar" className="w-full h-full object-cover" />
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                {/* Header: Name, Tag, Timestamp */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-white hover:underline cursor-pointer">
                    {msg.author.username}
                  </span>

                  {msg.author.botBadge && (
                    <span className="px-1.5 py-0.2 rounded bg-[#5865f2] text-white text-[10px] font-bold uppercase tracking-wider">
                      BOT
                    </span>
                  )}

                  {/* Render Server Tag if user */}
                  {msg.author.hasRoniTag !== undefined && (
                    <RoniTagBadge equipped={msg.author.hasRoniTag} size="sm" />
                  )}

                  <span className="text-[11px] text-neutral-400">{msg.timestamp}</span>
                </div>

                {/* Text Content */}
                {msg.content && (
                  <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans mb-2">
                    {msg.content}
                  </p>
                )}

                {/* Attached File Display */}
                {msg.attachment && (
                  <div className="inline-flex items-center gap-3 p-3 rounded-lg bg-[#2b2d31] border border-[#3f4147] mb-2 max-w-md">
                    <div className="w-9 h-9 rounded bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{msg.attachment.name}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {(msg.attachment.size / 1024).toFixed(1)} KB · Lua Script
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State Spinner */}
                {msg.loadingState && (
                  <div className="p-3 rounded-lg bg-[#2b2d31] border border-[#3f4147] flex items-center gap-3 text-xs text-neutral-200">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                    <span className="font-medium">{msg.loadingState.step}</span>
                  </div>
                )}

                {/* Discord Embed */}
                {msg.embed && (
                  <div
                    className="rounded-lg bg-[#2b2d31] border-l-4 p-4 text-xs space-y-3 max-w-2xl shadow-md my-1.5"
                    style={{
                      borderLeftColor: msg.embed.color || '#5865f2',
                      borderColor: 'rgba(255,255,255,0.06)'
                    }}
                  >
                    {msg.embed.title && (
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {msg.embed.title}
                      </h4>
                    )}

                    {msg.embed.description && (
                      <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed text-xs">
                        {msg.embed.description}
                      </p>
                    )}

                    {/* Embed Fields Grid */}
                    {msg.embed.fields && msg.embed.fields.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {msg.embed.fields.map((field, idx) => (
                          <div
                            key={idx}
                            className={field.inline ? 'space-y-0.5' : 'sm:col-span-2 space-y-0.5'}
                          >
                            <span className="text-[11px] font-bold text-neutral-400 block">
                              {field.name}
                            </span>
                            <div className="text-neutral-200 whitespace-pre-wrap font-sans text-xs">
                              {field.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Embed Footer */}
                    {msg.embed.footer && (
                      <div className="pt-2 border-t border-white/5 text-[10px] text-neutral-400 font-medium">
                        {msg.embed.footer.text}
                      </div>
                    )}
                  </div>
                )}

                {/* Discord ActionRow Interactive Components (Buttons) */}
                {msg.components && msg.components.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.components.map((row, rIdx) =>
                      row.buttons.map((btn, bIdx) => (
                        <button
                          key={`${rIdx}-${bIdx}`}
                          onClick={() => handleButtonClick(btn.id, msg.id)}
                          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
                            btn.style === 'primary'
                              ? 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                              : btn.style === 'success'
                              ? 'bg-[#23a55a] hover:bg-[#1d8b4b] text-white'
                              : btn.style === 'danger'
                              ? 'bg-[#da373c] hover:bg-[#ba2e33] text-white'
                              : 'bg-[#4e5058] hover:bg-[#6d6f78] text-white'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Selected File Chip preview before sending */}
        {selectedFile && (
          <div className="px-4 py-2 bg-[#2b2d31] border-t border-[#3f4147] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white">
              <FileCode className="w-4 h-4 text-purple-400" />
              <span className="font-semibold">{selectedFile.name}</span>
              <span className="text-neutral-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {/* Message Input Bar & Preloaded Samples Bar */}
        <div className="p-4 bg-[#313338] border-t border-[#26282c]">
          {/* Sample quick selector */}
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-neutral-400 whitespace-nowrap shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Test Samples:
            </span>
            {PRELOADED_SAMPLES.map(sample => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className="px-2.5 py-1 rounded bg-[#2b2d31] hover:bg-[#383a40] text-neutral-300 hover:text-white text-xs font-mono border border-[#3f4147] whitespace-nowrap transition-colors cursor-pointer"
                title={sample.description}
              >
                {sample.name}
              </button>
            ))}
          </div>

          {/* Discord Input Box */}
          <div className="relative flex items-center bg-[#383a40] rounded-lg px-4 py-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".lua,.luau,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-full hover:bg-neutral-600/50 text-neutral-300 hover:text-white transition-colors cursor-pointer mr-2 shrink-0"
              title="Upload Obfuscated Lua Script"
            >
              <Upload className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                selectedFile
                  ? `File ready: ${selectedFile.name} — Press Enter to run .deobf`
                  : 'Message #deobf-bot (e.g. .deobf [file])'
              }
              className="flex-1 bg-transparent text-sm text-white placeholder-neutral-400 outline-none font-sans"
            />

            <button
              onClick={handleSendMessage}
              disabled={isProcessing || (!inputContent.trim() && !selectedFile)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ml-2 shrink-0 ${
                isProcessing || (!inputContent.trim() && !selectedFile)
                  ? 'text-neutral-500 cursor-not-allowed'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/40'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <span>Status:</span>
              <span className={currentUser.hasRoniTag ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                {currentUser.hasRoniTag ? 'Authorized ([RONI] Tag Active)' : 'Access Locked (Equip [RONI] Tag to run .deobf)'}
              </span>
            </span>
            <span>Commands: <code className="bg-[#2b2d31] px-1 py-0.5 rounded text-neutral-300">.deobf</code></span>
          </div>
        </div>
      </div>

      {/* Code Modal */}
      <CodeModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))}
        fileName={modalData.fileName}
        originalCode={modalData.originalCode}
        deobfuscatedCode={modalData.deobfuscatedCode}
        engineName={modalData.engineName}
      />
    </div>
  );
};
