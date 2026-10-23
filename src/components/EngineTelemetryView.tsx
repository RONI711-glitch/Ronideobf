import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  AlertOctagon,
  Clock,
  Server,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Shield,
  Play,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { EngineStatus } from '../types';
import { INITIAL_ENGINES } from '../services/engineManager';
import { RoniTagBadge } from './RoniTagBadge';

interface EngineTelemetryViewProps {
  onBackToBot: () => void;
}

export const EngineTelemetryView: React.FC<EngineTelemetryViewProps> = ({ onBackToBot }) => {
  const [engines, setEngines] = useState<EngineStatus[]>(INITIAL_ENGINES);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logs, setLogs] = useState<{ id: string; time: string; engine: string; text: string; type: 'info' | 'warn' | 'success' | 'error' }[]>([
    {
      id: '1',
      time: new Date().toLocaleTimeString(),
      engine: 'LURAPH-V15',
      text: 'Opcode mapper synchronized (256 instruction set mapped)',
      type: 'info'
    },
    {
      id: '2',
      time: new Date().toLocaleTimeString(),
      engine: 'PROMETHEUS',
      text: 'AST constant folding pool warm and idle',
      type: 'info'
    },
    {
      id: '3',
      time: new Date().toLocaleTimeString(),
      engine: 'RONI-SYSTEM',
      text: 'Server tag validator active: [RONI] tag verified on Discord gateway',
      type: 'success'
    }
  ]);

  // Periodic metric jitter simulation to show real-time live heartbeat
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setEngines(prev =>
        prev.map(eng => {
          if (eng.status === 'offline') return eng;
          const jitterLoad = Math.max(5, Math.min(95, eng.currentLoadPercent + (Math.floor(Math.random() * 9) - 4)));
          const jitterMem = Math.max(180, Math.min(800, eng.memoryMb + (Math.floor(Math.random() * 7) - 3)));
          return {
            ...eng,
            currentLoadPercent: jitterLoad,
            memoryMb: jitterMem
          };
        })
      );

      // Occasionally add a live event
      if (Math.random() > 0.6) {
        const randomEng = engines[Math.floor(Math.random() * engines.length)];
        const actions = [
          'Deobfuscation queue heartbeat OK',
          'Garbage collector cycle executed (-14MB)',
          'String lookup table indexed',
          'Bytecode verification passed',
          'Register lifter frame allocated'
        ];
        const newLog = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          engine: randomEng.id.toUpperCase(),
          text: actions[Math.floor(Math.random() * actions.length)],
          type: 'info' as const
        };
        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [autoRefresh, engines]);

  // Toggle engine status to simulate engine fall / failure ("if ther falling or not")
  const toggleEngineStatus = (id: string) => {
    setEngines(prev =>
      prev.map(eng => {
        if (eng.id !== id) return eng;
        let nextStatus: EngineStatus['status'] = 'operational';
        if (eng.status === 'operational') nextStatus = 'degraded';
        else if (eng.status === 'degraded') nextStatus = 'offline';
        else nextStatus = 'operational';

        const statusLog = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          engine: eng.id.toUpperCase(),
          text: `Engine status transitioned to [${nextStatus.toUpperCase()}]`,
          type: nextStatus === 'operational' ? ('success' as const) : nextStatus === 'degraded' ? ('warn' as const) : ('error' as const)
        };
        setLogs(l => [statusLog, ...l.slice(0, 19)]);

        return {
          ...eng,
          status: nextStatus
        };
      })
    );
  };

  const operationalCount = engines.filter(e => e.status === 'operational').length;
  const degradedCount = engines.filter(e => e.status === 'degraded').length;
  const offlineCount = engines.filter(e => e.status === 'offline').length;
  const totalProcessed = engines.reduce((acc, curr) => acc + curr.processedCount, 0);

  return (
    <div className="flex-1 bg-[#1e1f22] p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2b2d31]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                Live Engine Telemetry & Cluster Status
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 font-mono">
                Real-Time Stream
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Live monitor for all Lua deobfuscation workers. Test engine degradation and monitor node failovers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                autoRefresh
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-[#2b2d31] border-[#383a40] text-neutral-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{autoRefresh ? 'Live Sync Active' : 'Paused'}</span>
            </button>

            <button
              onClick={onBackToBot}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Return to Discord Bot
            </button>
          </div>
        </div>

        {/* Global Cluster Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40]">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Operational Engines</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {operationalCount} <span className="text-xs text-neutral-400 font-normal">/ {engines.length}</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              {offlineCount > 0 ? `⚠️ ${offlineCount} node(s) falling` : 'All primary engines healthy'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40]">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Total Deobfuscations</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {totalProcessed.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Scripts devirtualized
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40]">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Avg Latency</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              980 <span className="text-xs font-normal text-neutral-400">ms</span>
            </div>
            <div className="text-[11px] text-sky-400 mt-1">
              P95 AST transformation speed
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40]">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Tag Enforcement</span>
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <RoniTagBadge equipped={true} size="sm" />
              <span className="text-xs font-bold text-emerald-400">ENFORCED</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Blocks unauthorized non-tag queries
            </div>
          </div>
        </div>

        {/* Engine Grid Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              Engine Cluster Nodes ({engines.length})
            </h2>
            <span className="text-xs text-neutral-400">
              Click &quot;Simulate Fail / Fall&quot; on any engine card to test live node status transitions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {engines.map(engine => {
              const statusColor = {
                operational: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
                busy: 'text-sky-400 bg-sky-950/60 border-sky-500/30',
                degraded: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
                offline: 'text-red-400 bg-red-950/60 border-red-500/30'
              }[engine.status];

              return (
                <div
                  key={engine.id}
                  className={`p-4 rounded-xl bg-[#2b2d31] border transition-all ${
                    engine.status === 'offline'
                      ? 'border-red-500/40 bg-red-950/10'
                      : engine.status === 'degraded'
                      ? 'border-amber-500/40'
                      : 'border-[#383a40] hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{engine.name}</h3>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {engine.version}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${statusColor}`}
                    >
                      {engine.status}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                    {engine.description}
                  </p>

                  {/* Engine Stats */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-[#383a40] text-center text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Uptime</span>
                      <span className="font-mono font-bold text-neutral-200 tabular-nums">
                        {engine.uptime}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Load</span>
                      <span className="font-mono font-bold text-purple-300 tabular-nums">
                        {engine.currentLoadPercent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">RAM</span>
                      <span className="font-mono font-bold text-neutral-200 tabular-nums">
                        {engine.memoryMb}MB
                      </span>
                    </div>
                  </div>

                  {/* Load bar */}
                  <div className="w-full bg-[#1e1f22] h-1.5 rounded-full overflow-hidden my-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        engine.currentLoadPercent > 80
                          ? 'bg-red-500'
                          : engine.currentLoadPercent > 50
                          ? 'bg-amber-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${engine.currentLoadPercent}%` }}
                    />
                  </div>

                  {/* Simulation toggle button */}
                  <button
                    onClick={() => toggleEngineStatus(engine.id)}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg bg-[#383a40] hover:bg-[#43464d] text-neutral-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Cycle Status ({engine.status})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-Time Terminal Log Stream */}
        <div className="rounded-xl bg-[#2b2d31] border border-[#383a40] overflow-hidden">
          <div className="px-4 py-3 bg-[#1e1f22] border-b border-[#383a40] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Live Deobfuscation Event Stream</span>
            </div>
            <span className="text-neutral-500 font-mono text-[11px]">
              gateway.roni.internal · stream socket connected
            </span>
          </div>

          <div className="p-4 bg-[#141517] font-mono text-xs space-y-1.5 max-h-60 overflow-y-auto">
            {logs.map(log => {
              const typeColor = {
                info: 'text-neutral-400',
                warn: 'text-amber-400',
                success: 'text-emerald-400',
                error: 'text-red-400'
              }[log.type];

              return (
                <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <span className="text-neutral-600 select-none tabular-nums">[{log.time}]</span>
                  <span className="text-purple-400 font-semibold shrink-0">[{log.engine}]</span>
                  <span className={typeColor}>{log.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
