import React, { useState } from 'react';
import { Copy, Check, Download, X, Code2, SplitSquareVertical } from 'lucide-react';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  originalCode: string;
  deobfuscatedCode: string;
  engineName: string;
}

export const CodeModal: React.FC<CodeModalProps> = ({
  isOpen,
  onClose,
  fileName,
  originalCode,
  deobfuscatedCode,
  engineName,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'deobf' | 'diff'>('deobf');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(deobfuscatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([deobfuscatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.lua') ? fileName.replace('.lua', '_deobfuscated.lua') : `${fileName}_deobfuscated.lua`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = deobfuscatedCode.split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#2b2d31] rounded-xl border border-[#383a40] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#1e1f22] border-b border-[#383a40]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {fileName}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
                  {engineName} Cleaned
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {lines.length} lines · {new Blob([deobfuscatedCode]).size} bytes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#313338] border border-[#3f4147] text-xs">
              <button
                onClick={() => setViewMode('deobf')}
                className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                  viewMode === 'deobf'
                    ? 'bg-[#2b2d31] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Clean Lua
              </button>
              <button
                onClick={() => setViewMode('diff')}
                className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'diff'
                    ? 'bg-[#2b2d31] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                Diff View
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-[#383a40] hover:bg-[#43464d] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              Download .lua
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#383a40] text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden bg-[#1e1f22]">
          {viewMode === 'deobf' ? (
            <div className="h-full overflow-y-auto p-4 font-mono text-xs text-neutral-300 leading-relaxed selection:bg-purple-600/40">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03]">
                      <td className="w-12 text-right pr-4 text-neutral-500 select-none tabular-nums font-mono text-[11px] align-top">
                        {idx + 1}
                      </td>
                      <td className="whitespace-pre font-mono">
                        {renderLuaSyntaxLine(line)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-full grid grid-cols-2 divide-x divide-[#383a40] overflow-hidden">
              {/* Left Column: Original Obfuscated */}
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 bg-[#2b2d31] border-b border-[#383a40] text-xs font-semibold text-neutral-400 flex items-center justify-between">
                  <span>Obfuscated Input ({originalCode.split('\n').length} lines)</span>
                  <span className="text-[10px] uppercase tracking-wider text-red-400">Encrypted</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] text-neutral-400 leading-snug whitespace-pre bg-[#18191c]">
                  {originalCode}
                </div>
              </div>

              {/* Right Column: Deobfuscated */}
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 bg-[#2b2d31] border-b border-[#383a40] text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span>Deobfuscated Result ({lines.length} lines)</span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400">Cleaned & Restructured</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] text-neutral-200 leading-snug whitespace-pre bg-[#1e1f22]">
                  {deobfuscatedCode}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple syntax colorizer for Lua preview
function renderLuaSyntaxLine(line: string) {
  if (line.trim().startsWith('--')) {
    return <span className="text-emerald-500/80 italic">{line}</span>;
  }

  // Highlight keywords
  const parts = line.split(/(\b(?:local|function|return|if|then|else|elseif|end|while|do|for|in|repeat|until|true|false|nil|and|or|not)\b|"[^"]*"|'[^']*'|\b\d+\b)/g);

  return parts.map((part, i) => {
    if (/^(local|function|return|if|then|else|elseif|end|while|do|for|in|repeat|until|and|or|not)$/.test(part)) {
      return <span key={i} className="text-purple-400 font-semibold">{part}</span>;
    }
    if (/^(true|false|nil)$/.test(part)) {
      return <span key={i} className="text-amber-400">{part}</span>;
    }
    if (/^["'].*["']$/.test(part)) {
      return <span key={i} className="text-emerald-300">{part}</span>;
    }
    if (/^\d+$/.test(part)) {
      return <span key={i} className="text-sky-300">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}
