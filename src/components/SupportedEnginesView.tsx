import React from 'react';
import { ShieldCheck, Cpu, Code2, Sparkles, Terminal, FileCheck, Layers } from 'lucide-react';
import { INITIAL_ENGINES } from '../services/engineManager';

export const SupportedEnginesView: React.FC = () => {
  return (
    <div className="flex-1 bg-[#1e1f22] p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              All 7 Supported Deobfuscation Engines & Reverse Architectures
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-950 border border-purple-500/50 text-purple-300">
              7/7 Active
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Complete technical specifications of all 7 reverse-engineering engines integrated into the RONI Discord Bot.
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Luraph v15 */}
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚀</span>
                <div>
                  <h3 className="text-sm font-bold text-white">1. Luraph v15 Devirtualizer</h3>
                  <span className="text-xs text-purple-400 font-mono">github.com/caomod2077/Deobfuscator-Luraph-V15</span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 font-mono">
                v15.2-RELEASE
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Designed specifically for unpacking Luraph v15 bytecode. Features state machine flattening reversal, bitwise XOR string decryption, constant table relocation, and translation of virtual registers (R0..Rn) into high-level Luau syntax.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-neutral-400 border-t border-[#383a40]">
              <div>• Bitwise XOR recovery</div>
              <div>• Jump-table unroller</div>
              <div>• Stack frame lifter</div>
              <div>• LPH_ wrapper elimination</div>
            </div>
          </div>

          {/* 2. Prometheus */}
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <h3 className="text-sm font-bold text-white">2. Prometheus Deobfuscator Pipeline</h3>
                  <span className="text-xs text-purple-400 font-mono">Prometheus-Deobfuscator-main.zip</span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono">
                11-Stage AST Pipeline
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Comprehensive 11-stage pipeline: <code>01-wrap</code>, <code>02-fold</code> (constant arithmetic folding), <code>03-str</code> (string decoding), <code>04-lift</code> (scope lifting), <code>05-if</code> (conditional branch reduction), <code>06-proxy</code> (proxy function inlining), <code>07-opt</code> (dead store elimination), <code>08-vars</code>, <code>09-fmt</code>, <code>10-name</code>, and <code>11-scope</code>.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-neutral-400 border-t border-[#383a40]">
              <div>• Constant folding</div>
              <div>• Dead-code pruning</div>
              <div>• Proxy inlining</div>
              <div>• Lexer/Parser AST</div>
            </div>
          </div>

          {/* 3. Clyde */}
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <div>
                  <h3 className="text-sm font-bold text-white">3. Clyde VM Deobfuscator</h3>
                  <span className="text-xs text-purple-400 font-mono">ClydeDeobfuscator-main.zip</span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300 font-mono">
                Symbolic Exec (CFG)
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Uses Control Flow Graph (CFG) analysis, canonicalization (<code>canon.js</code>), block collapse (<code>collapse.js</code>), register skeleton resolution (<code>regskel.js</code>), and symbolic execution (<code>symexec.js</code>) to restore clean Lua AST representations.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-neutral-400 border-t border-[#383a40]">
              <div>• CFG block collapse</div>
              <div>• Symbolic execution</div>
              <div>• Register resugaring</div>
              <div>• Lua emitter</div>
            </div>
          </div>

          {/* 4. Moonsec */}
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌙</span>
                <div>
                  <h3 className="text-sm font-bold text-white">4. Moonsec v2 / v3 Decompiler</h3>
                  <span className="text-xs text-purple-400 font-mono">MoonsecDeobfuscator-master.zip</span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 font-mono">
                Bytecode Rewriter
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Disassembles Moonsec custom bytecode strings, handles <code>frexp</code>/<code>ldexp</code> floating-point numbers, maps virtual opcode permutation tables, and rewrites AST structures through CST to AST visitor passes.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-neutral-400 border-t border-[#383a40]">
              <div>• Bytecode deserializer</div>
              <div>• Float reconstruction</div>
              <div>• Opcode decompiler</div>
              <div>• Constant replacer</div>
            </div>
          </div>

          {/* 5. Ironveil */}
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <h3 className="text-sm font-bold text-white">5. Ironveil v1 Deobfuscator</h3>
                  <span className="text-xs text-purple-400 font-mono">Ironveil-Deobfuscator-V1-main.zip</span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono">
                XOR Unpack Engine
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Decodes numeric array buffers and multi-layered XOR encryption keys, extracts intermediate IR instructions, and emits formatted Luau scripts via the Ironveil beautifier.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-neutral-400 border-t border-[#383a40]">
              <div>• XOR array reversing</div>
              <div>• IR instruction parser</div>
              <div>• String recovery</div>
              <div>• AST beautifier</div>
            </div>
          </div>

          {/* 6. 77fuscator */}
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📦</span>
                <div>
                  <h3 className="text-sm font-bold text-white">6. 77fuscator Layer Peeler</h3>
                  <span className="text-xs text-purple-400 font-mono">77fuscatorDeobfuscator-main.zip</span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-teal-950/60 border border-teal-500/40 text-teal-300 font-mono">
                Loretta Chunk Reader
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Specialized for peeling multi-stage 77fuscator binary layers. Uses Loretta Lua AST chunk parsing, multi-pass byte blob decoding, and rotation table unrolling to restore raw Lua scripts.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-neutral-400 border-t border-[#383a40]">
              <div>• Layered blob peeling</div>
              <div>• Loretta chunk decoder</div>
              <div>• Rotation table solver</div>
              <div>• Clean statement generator</div>
            </div>
          </div>

          {/* 7. FlowAuth */}
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌊</span>
                <div>
                  <h3 className="text-sm font-bold text-white">7. FlowAuth Devirtualizer</h3>
                  <span className="text-xs text-purple-400 font-mono">FlowAuth-Deobfuscator-main (1).zip</span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 font-mono">
                Two-Phase Devirtualizer
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Devirtualizes FlowAuth protected payloads. Strips two-phase challenge response loops, bypasses shadow verification routines, resolves dynamic tokens, and extracts original clean Luau logic.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-neutral-400 border-t border-[#383a40]">
              <div>• Challenge gate bypass</div>
              <div>• Shadow verification stripper</div>
              <div>• Two-phase payload devirt</div>
              <div>• Pure Luau reconstruction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
