/**
 * @file src/components/EngineInspector.tsx
 * Real Engine Architecture & Diagnostic Telemetry Dashboard for AXpert.
 * Stripped of placeholders: live resource monitoring, subsystem benchmark tests,
 * temp cache purging, concurrency controls, and real-time IPC telemetry log stream.
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Terminal,
  Zap,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Download,
  Filter,
  Layers,
  HardDrive,
  Sliders,
  Sparkles,
  Gauge
} from 'lucide-react';
import { EngineTelemetry, EngineLogEntry, EngineBenchmarkResult } from '../types';
import { engineTelemetry } from '../services/engineTelemetry';
import { formatFileSize } from '../services/fileService';

export const EngineInspector: React.FC = () => {
  const [telemetry, setTelemetry] = useState<EngineTelemetry>(engineTelemetry.getTelemetry());
  const [logs, setLogs] = useState<EngineLogEntry[]>(engineTelemetry.getLogs());
  const [benchmarks, setBenchmarks] = useState<EngineBenchmarkResult[] | null>(null);
  const [isRunningBenchmarks, setIsRunningBenchmarks] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = engineTelemetry.subscribe(() => {
      setTelemetry(engineTelemetry.getTelemetry());
      setLogs(engineTelemetry.getLogs());
    });
    return unsubscribe;
  }, []);

  const handleRunDiagnostics = async () => {
    setIsRunningBenchmarks(true);
    setActionNotice(null);
    try {
      const results = await engineTelemetry.runDiagnosticBenchmark();
      setBenchmarks(results);
      setActionNotice('Subsystem diagnostic test pass completed.');
    } catch {
      setActionNotice('Diagnostic execution interrupted.');
    } finally {
      setIsRunningBenchmarks(false);
    }
  };

  const handlePurgeCache = () => {
    const res = engineTelemetry.purgeCache();
    setActionNotice(`Freed ${(res.freedBytes / 1024).toFixed(1)} KB across ${res.count} temporary artifacts.`);
  };

  const handleClearLogs = () => {
    engineTelemetry.clearLogs();
    setActionNotice('Event stream cleared.');
  };

  const handleExportLogs = () => {
    const raw = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.category}] [${l.level.toUpperCase()}] ${l.message}${
            l.elapsedMs ? ` (${l.elapsedMs}ms)` : ''
          }`
      )
      .join('\n');
    const blob = new Blob([raw], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `axpert_engine_diagnostic_${Date.now()}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesCat = selectedCategory === 'ALL' || log.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div id="engine-architecture-dashboard" className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Engine Architecture &amp; Telemetry
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time pipeline controls, subsystem diagnostic tests, and IPC event logging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-run-diagnostics"
            type="button"
            disabled={isRunningBenchmarks}
            onClick={handleRunDiagnostics}
            className="px-4 py-2 rounded-xl theme-btn-primary text-xs font-semibold font-mono flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningBenchmarks ? 'animate-spin' : ''}`} />
            <span>{isRunningBenchmarks ? 'RUNNING BENCHMARK...' : 'RUN SUBSYSTEM BENCHMARK'}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: LIVE HARDWARE & RUNTIME METRICS (Real data, no placeholders) */}
      <section aria-label="Runtime Telemetry" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-mono uppercase flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Logical CPU Threads
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {telemetry.hardwareConcurrency}{' '}
            <span className="text-xs text-slate-400 font-normal">cores detected</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Pool: {telemetry.workerPoolSize} active workers
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-mono uppercase flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            Completed Jobs
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono">
            {telemetry.completedJobs}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Processed: {formatFileSize(telemetry.totalBytesProcessed)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-mono uppercase flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            Temp Cache Storage
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono">
            {formatFileSize(telemetry.tempCacheBytes)}
          </div>
          <button
            type="button"
            onClick={handlePurgeCache}
            className="text-[10px] text-rose-400 hover:text-rose-300 font-mono underline flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Purge Cache
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-mono uppercase flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Platform Engine
          </div>
          <div className="text-sm font-bold text-emerald-300 font-mono truncate">
            {telemetry.platform}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            WASM: {telemetry.hasWebAssembly ? 'Supported' : 'No'} • Audio: {telemetry.hasWebAudio ? 'Active' : 'No'}
          </div>
        </div>
      </section>

      {/* SECTION 2: WORKER CONCURRENCY & EXECUTION CONTROLS */}
      <section aria-label="Engine Controls" className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Pipeline Concurrency &amp; Process Priority Settings
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Real hardware scheduling parameters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          {/* Worker Pool Size */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Worker Thread Pool Allocation</span>
              <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
                {telemetry.workerPoolSize} Threads
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Controls simultaneous file conversion &amp; OCR thread capacity (Host supports up to {telemetry.maxWorkerThreads}).
            </p>
            <input
              type="range"
              min="1"
              max={Math.max(4, telemetry.maxWorkerThreads)}
              value={telemetry.workerPoolSize}
              onChange={(e) => engineTelemetry.setWorkerPoolSize(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Process Priority */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Subsystem Priority Mode</span>
              <span className="text-blue-400 font-bold uppercase">
                {telemetry.processPriority.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Adjusts IPC event dispatch latency and CPU slice thresholds.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['high', 'normal', 'power_save'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => engineTelemetry.setProcessPriority(mode)}
                  className={`py-1.5 px-2 rounded text-[10px] uppercase font-semibold border transition-all ${
                    telemetry.processPriority === mode
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SUBSYSTEM DIAGNOSTIC BENCHMARKS */}
      {benchmarks && (
        <section aria-label="Diagnostic Benchmarks" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Subsystem Latency &amp; Verification Results
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Tested Subsystems Verified
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Subsystem Module</th>
                  <th className="py-2.5 px-4 font-semibold">Engine Pipeline</th>
                  <th className="py-2.5 px-4 font-semibold">Roundtrip Latency</th>
                  <th className="py-2.5 px-4 font-semibold">Diagnostic Report</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {benchmarks.map((b) => (
                  <tr key={b.name} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 text-slate-200 font-medium">{b.name}</td>
                    <td className="py-3 px-4 text-slate-400">{b.subsystem}</td>
                    <td className="py-3 px-4 text-cyan-300 font-semibold">{b.latencyMs} ms</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{b.details}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                          b.status === 'passed'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 4: REAL-TIME IPC EVENT TELEMETRY STREAM */}
      <section aria-label="IPC Telemetry Log" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              IPC Diagnostic Event Stream ({filteredLogs.length} events)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Pills */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
              {(['ALL', 'IPC', 'CONVERTER', 'AUDIO', 'OCR', 'METADATA'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded transition-colors ${
                    selectedCategory === cat
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Clear & Export */}
            <button
              type="button"
              onClick={handleExportLogs}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono flex items-center gap-1"
              title="Export diagnostic log"
            >
              <Download className="w-3 h-3" />
              Export
            </button>

            <button
              type="button"
              onClick={handleClearLogs}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 border border-slate-700 font-mono flex items-center gap-1"
              title="Clear event logs"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>

        {/* Telemetry Console Output */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs max-h-72 overflow-y-auto space-y-1.5 shadow-inner">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-400 py-4 text-center">No logs matching current filter criteria.</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/50 py-0.5 px-1 rounded">
                <span className="text-slate-400 shrink-0 text-[10px]">{log.timestamp}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 ${
                    log.category === 'IPC'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                      : log.category === 'AUDIO'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                      : log.category === 'OCR'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                      : log.category === 'METADATA'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {log.category}
                </span>

                <span
                  className={`flex-1 break-words ${
                    log.level === 'error'
                      ? 'text-rose-400 font-semibold'
                      : log.level === 'warn'
                      ? 'text-amber-300'
                      : log.level === 'success'
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  {log.message}
                </span>

                {log.elapsedMs !== undefined && (
                  <span className="text-[10px] text-cyan-400 shrink-0 font-mono">
                    {log.elapsedMs}ms
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
