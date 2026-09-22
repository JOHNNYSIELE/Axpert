import React from 'react';
import { Layers, ShieldAlert, Cpu, HardDrive, CheckCircle2, Music, Zap } from 'lucide-react';

export type ActiveTab = 'converter' | 'ocr' | 'audio' | 'metadata' | 'architecture';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  queueCount: number;
  metadataFileLoaded: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  queueCount,
  metadataFileLoaded
}) => {
  return (
    <aside
      id="desktop-sidebar"
      className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none"
    >
      {/* Top Header & Brand Icon */}
      <div>
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-900/30 text-white font-bold tracking-tight">
            <span className="text-base font-mono">AX</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
              AXpert
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Desktop Suite v2.4
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5" aria-label="Desktop Navigation">
          {/* File Converter */}
          <button
            id="nav-tab-converter"
            type="button"
            onClick={() => onSelectTab('converter')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'converter'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-700/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>File Converter</span>
            </div>
            {queueCount > 0 && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                  activeTab === 'converter'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}
              >
                {queueCount}
              </span>
            )}
          </button>

          {/* Instant PDF OCR */}
          <button
            id="nav-tab-ocr"
            type="button"
            onClick={() => onSelectTab('ocr')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'ocr'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-700/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instant PDF OCR</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                activeTab === 'ocr'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
              }`}
            >
              TXT/DOCX
            </span>
          </button>

          {/* Audio Extractor */}
          <button
            id="nav-tab-audio"
            type="button"
            onClick={() => onSelectTab('audio')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'audio'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-700/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Music className="w-4 h-4 text-cyan-400" />
              <span>Audio Extractor</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                activeTab === 'audio'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-800 text-cyan-300 border border-slate-700'
              }`}
            >
              VIDEO
            </span>
          </button>

          {/* Metadata Tool */}
          <button
            id="nav-tab-metadata"
            type="button"
            onClick={() => onSelectTab('metadata')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'metadata'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-700/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Metadata Tool</span>
            </div>
            {metadataFileLoaded && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeTab === 'metadata' ? 'bg-cyan-300' : 'bg-emerald-400'
                }`}
                title="File loaded in metadata tool"
              />
            )}
          </button>

          {/* Engine Architecture */}
          <button
            id="nav-tab-architecture"
            type="button"
            onClick={() => onSelectTab('architecture')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'architecture'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-700/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4" />
              <span>Engine Architecture</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">LIVE</span>
          </button>
        </nav>
      </div>

      {/* Bottom Desktop System Info Box */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              AXpert Core
            </span>
            <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 leading-tight">
            Native Desktop IPC Engine
            <div className="text-slate-400 mt-0.5">Hardware Concurrency Enabled</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

