import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCode,
  Zap,
  Play,
  Download,
  Copy,
  Check,
  SplitSquareVertical,
  Terminal,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
  Loader2,
  Globe,
  Link as LinkIcon,
  X
} from 'lucide-react';
import { ObfuscationDetection, DeobfuscationResult } from '../types';
import { detectObfuscator } from '../services/detector';
import { runDeobfuscator } from '../services/deobfuscator';
import { PRELOADED_SAMPLES, ObfuscatedSample, INITIAL_ENGINES } from '../services/engineManager';
import { RoniTagBadge } from './RoniTagBadge';
import { CodeModal } from './CodeModal';

interface DeobfuscatorWorkbenchProps {
  botStatus: any;
  onOpenConnectModal: () => void;
  onViewTelemetry: () => void;
}

export const DeobfuscatorWorkbench: React.FC<DeobfuscatorWorkbenchProps> = ({
  botStatus,
  onOpenConnectModal,
  onViewTelemetry
}) => {
  const [inputCode, setInputCode] = useState(PRELOADED_SAMPLES[0].code);
  const [fileName, setFileName] = useState(PRELOADED_SAMPLES[0].name);
  const [selectedEngine, setSelectedEngine] = useState<string>('luraph-v15');
  const [detection, setDetection] = useState<ObfuscationDetection>(() => detectObfuscator(PRELOADED_SAMPLES[0].code));
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DeobfuscationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTab, setViewTab] = useState<'clean' | 'diff' | 'logs'>('clean');

  // URL input states
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [scriptUrlInput, setScriptUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFetchUrl = async () => {
    if (!scriptUrlInput.trim()) return;
    setIsFetchingUrl(true);
    setUrlFetchError(null);

    try {
      const resp = await fetch('/api/fetch-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scriptUrlInput.trim() })
      });
      const data = await resp.json();

      if (!data.success || !data.code) {
        setUrlFetchError(data.error || 'Failed to download script from URL.');
        return;
      }

      setFileName(data.fileName || 'script_from_url.lua');
      handleCodeChange(data.code);
      setIsUrlModalOpen(false);
      setScriptUrlInput('');
    } catch (err: any) {
      setUrlFetchError(err?.message || 'Network error fetching URL.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // When input code changes, run signature analysis
  const handleCodeChange = (newCode: string) => {
    setInputCode(newCode);
    const det = detectObfuscator(newCode);
    setDetection(det);
    if (det.recommendedEngine) {
      setSelectedEngine(det.recommendedEngine);
    }
    setResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleCodeChange(content);
    };
    reader.readAsText(file);
  };

  const handleSelectSample = (sample: ObfuscatedSample) => {
    setFileName(sample.name);
    setSelectedEngine(sample.engine);
    handleCodeChange(sample.code);
  };

  const handleExecuteDeobf = async () => {
    if (!inputCode.trim()) return;
    setIsProcessing(true);

    try {
      const deobfResult = await runDeobfuscator(inputCode, selectedEngine);
      setResult(deobfResult);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCode = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.deobfuscatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!result) return;
    const blob = new Blob([result.deobfuscatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace('.lua', '_deobfuscated.lua');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const effectiveInviteUrl = botStatus?.inviteUrl || (botStatus?.clientId ? `https://discord.com/oauth2/authorize?client_id=${botStatus.clientId}&permissions=277025508416&scope=bot%20applications.commands` : null);

  return (
    <div className="flex-1 bg-[#1e1f22] flex flex-col overflow-y-auto">
      {/* Real Discord Bot Connection & Invite Banner */}
      <div className="bg-[#242629] border-b border-[#2b2d31] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
                <FileCode className="w-6 h-6" />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#242629] ${
                  botStatus?.status === 'online' ? 'bg-emerald-500' : 'bg-neutral-500'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Real Discord Bot: {botStatus?.botUser?.tag || 'RONI Deobfuscator'}
                </h2>
                <RoniTagBadge equipped={true} size="sm" />
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    botStatus?.status === 'online'
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {botStatus?.status === 'online' ? `Online (${botStatus.botUser?.ping || 24}ms)` : 'Gateway Standby'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {botStatus?.status === 'online'
                  ? `Active in ${botStatus.guilds?.length || 0} Discord servers. Listening for .deobf with [RONI] tag verification.`
                  : 'Connect your bot token & client ID below to invite the bot to your Discord server.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Add to Discord Server Button */}
            {effectiveInviteUrl ? (
              <a
                href={effectiveInviteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Add Bot to Your Discord Server</span>
              </a>
            ) : (
              <button
                onClick={onOpenConnectModal}
                className="px-4 py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Add Client ID to Generate Invite Link</span>
              </button>
            )}

            <button
              onClick={onOpenConnectModal}
              className="px-3.5 py-2 rounded-lg bg-[#313338] hover:bg-[#383a40] border border-[#3f4147] text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
            >
              Configure Token
            </button>
          </div>
        </div>
      </div>

      {/* Main Workbench Body */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Sample selector chips */}
        <div className="flex items-center justify-between gap-4 flex-wrap bg-[#2b2d31] p-3 rounded-xl border border-[#383a40]">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Preloaded Samples:
            </span>
            {PRELOADED_SAMPLES.map(sample => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                  fileName === sample.name
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-semibold'
                    : 'bg-[#1e1f22] border-[#383a40] text-neutral-300 hover:text-white hover:bg-[#35373c]'
                }`}
              >
                {sample.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".lua,.luau,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[#383a40] hover:bg-[#43464d] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Lua File</span>
            </button>
            <button
              onClick={() => {
                setUrlFetchError(null);
                setIsUrlModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/50 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Fetch from URL</span>
            </button>
          </div>
        </div>

        {/* Engine Selection & Obfuscator Detection Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Obfuscator Detection Card */}
          <div className="lg:col-span-1 p-4 rounded-xl bg-[#2b2d31] border border-[#383a40] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                AST Signature Scanner
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {detection.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-neutral-400 font-mono">{detection.version}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono">
                  {detection.confidence}% Match
                </span>
              </div>

              <div className="mt-3 space-y-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Detected Patterns:
                </span>
                {detection.matchedSignatures.slice(0, 3).map((sig, idx) => (
                  <div key={idx} className="text-xs text-neutral-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span className="truncate">{sig}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#383a40] text-[11px] text-neutral-400 flex items-center justify-between">
              <span>File: {fileName}</span>
              <span>{(new Blob([inputCode]).size / 1024).toFixed(1)} KB</span>
            </div>
          </div>

          {/* Engine Selector Grid */}
          <div className="lg:col-span-3 p-4 rounded-xl bg-[#2b2d31] border border-[#383a40]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                Select Reverse-Engineering Engine:
              </span>
              <button
                onClick={onViewTelemetry}
                className="text-xs text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
              >
                View Live Telemetry &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INITIAL_ENGINES.map(eng => {
                const isSelected = selectedEngine === eng.id;
                const isRecommended = detection.recommendedEngine === eng.id;

                return (
                  <button
                    key={eng.id}
                    onClick={() => setSelectedEngine(eng.id)}
                    className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-950/50 border-purple-500 text-white shadow'
                        : 'bg-[#1e1f22] border-[#383a40] text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate text-white">{eng.name}</span>
                      {isRecommended && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-600/40 text-purple-300 font-bold uppercase">
                          Best
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400 font-mono">
                      <span>{eng.avgLatencyMs}ms</span>
                      <span>·</span>
                      <span className="text-emerald-400 uppercase font-semibold">{eng.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#383a40]">
              <span className="text-xs text-neutral-400">
                Active Engine: <strong className="text-white">{selectedEngine.toUpperCase()}</strong>
              </span>

              <button
                onClick={handleExecuteDeobf}
                disabled={isProcessing || !inputCode.trim()}
                className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  isProcessing || !inputCode.trim()
                    ? 'bg-neutral-600 opacity-60 cursor-not-allowed text-neutral-300'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white active:scale-95'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{isProcessing ? 'Devirtualizing...' : 'Run Deobfuscator Engine'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dual Code Split View (Input Obfuscated vs Output Cleaned) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[520px]">
          {/* Left Column: Input Obfuscated Code */}
          <div className="rounded-xl bg-[#2b2d31] border border-[#383a40] flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 bg-[#1e1f22] border-b border-[#383a40] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-bold text-white">Input Obfuscated Script</span>
                <span className="text-[11px] text-neutral-500 font-mono">({inputCode.split('\n').length} lines)</span>
              </div>
              <button
                onClick={() => handleCodeChange('')}
                className="text-[11px] text-neutral-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 bg-[#18191c] p-3 overflow-hidden">
              <textarea
                value={inputCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Paste obfuscated Lua script here..."
                className="w-full h-full bg-transparent text-xs font-mono text-neutral-300 outline-none resize-none leading-relaxed selection:bg-purple-600/40"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Right Column: Deobfuscated Clean Output */}
          <div className="rounded-xl bg-[#2b2d31] border border-[#383a40] flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-[#1e1f22] border-b border-[#383a40] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400">Deobfuscated Result</span>
                {result && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono">
                    -{result.reductionPercent}% Reduced ({result.linesReduced.after} lines)
                  </span>
                )}
              </div>

              {result && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded bg-[#383a40] hover:bg-[#43464d] text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownloadFile}
                    className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .lua</span>
                  </button>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-2.5 py-1 rounded bg-[#383a40] hover:bg-[#43464d] text-neutral-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Open Fullscreen Diff Viewer"
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                    <span>Diff</span>
                  </button>
                </div>
              )}
            </div>

            {/* Output Display / Logs */}
            <div className="flex-1 bg-[#141517] overflow-y-auto p-3 font-mono text-xs text-neutral-200 leading-relaxed whitespace-pre selection:bg-purple-600/40">
              {result ? (
                result.deobfuscatedCode
              ) : isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-2">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  <span className="text-xs">Devirtualizing AST & recovering strings...</span>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-2 select-none">
                  <FileCode className="w-8 h-8 opacity-40" />
                  <p className="text-xs text-neutral-400">Click &quot;Run Deobfuscator Engine&quot; above to process this script.</p>
                </div>
              )}
            </div>

            {/* Pass Execution Summary Footbar */}
            {result && (
              <div className="px-4 py-2 bg-[#1e1f22] border-t border-[#383a40] flex items-center justify-between text-[11px] text-neutral-400">
                <div className="flex items-center gap-3">
                  <span>Engine: <strong className="text-white">{result.engineUsed.toUpperCase()}</strong></span>
                  <span>·</span>
                  <span>Time: <strong className="text-emerald-400">{result.executionTimeMs} ms</strong></span>
                  <span>·</span>
                  <span>Strings Decrypted: <strong className="text-purple-300">{result.stringsDecrypted}</strong></span>
                </div>
                <span>AST Passes: {result.astTransformations}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Modal for Diff View */}
      {result && (
        <CodeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fileName={fileName}
          originalCode={inputCode}
          deobfuscatedCode={result.deobfuscatedCode}
          engineName={selectedEngine.toUpperCase()}
        />
      )}

      {/* URL Fetch Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242629] border border-[#383a40] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#383a40] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Fetch Script from URL</h3>
              </div>
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-[#383a40] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Raw Script or Pastebin URL:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={scriptUrlInput}
                    onChange={(e) => setScriptUrlInput(e.target.value)}
                    placeholder="https://pastebin.com/raw/XYZ or GitHub raw URL"
                    className="w-full bg-[#1e1f22] border border-[#383a40] rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFetchUrl();
                    }}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-2">
                  Supports Pastebin, GitHub Raw, Gist, Sourcebin, Rentry, Hastebin, and direct <code className="text-purple-300">.lua</code> links.
                </p>
              </div>

              {urlFetchError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                  {urlFetchError}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-[#1e1f22] border-t border-[#383a40] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-[#2b2d31] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFetchUrl}
                disabled={isFetchingUrl || !scriptUrlInput.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Fetch &amp; Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
