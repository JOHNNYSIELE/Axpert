import React from 'react';
import {
  Layers,
  ShieldAlert,
  Cpu,
  HardDrive,
  CheckCircle2,
  Music,
  Zap,
  Sun,
  Moon,
  Palette,
  Check
} from 'lucide-react';
import { useTheme, THEME_PRESETS, ThemePreset } from '../context/ThemeContext';

export type ActiveTab = 'converter' | 'ocr' | 'audio' | 'metadata' | 'architecture';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  queueCount: number;
  metadataFileLoaded: boolean;
  onOpenThemeModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  queueCount,
  metadataFileLoaded,
  onOpenThemeModal
}) => {
  const { mode, toggleMode, preset, setPreset, currentPreset } = useTheme();

  return (
    <aside
      id="desktop-sidebar"
      className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none overflow-y-auto"
    >
      {/* Top Header & Navigation */}
      <div>
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white font-bold tracking-tight transition-all duration-300 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${currentPreset.secondary}, ${currentPreset.primary})`,
              boxShadow: `0 4px 14px ${currentPreset.primary}40`
            }}
          >
            <span className="text-base font-mono">AX</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight truncate">
              AXpert
            </h1>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 truncate">
              <span>Desktop v2.4</span>
              <span className="w-1 h-1 rounded-full bg-cyan-400 inline-block" />
              <span className="text-cyan-400 capitalize">{currentPreset.name.split(' ')[0]}</span>
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'converter'
                ? 'text-white shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            style={
              activeTab === 'converter'
                ? {
                    background: `linear-gradient(135deg, ${currentPreset.secondary}, ${currentPreset.primary})`,
                    boxShadow: `0 4px 12px ${currentPreset.primary}33`
                  }
                : undefined
            }
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'ocr'
                ? 'text-white shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            style={
              activeTab === 'ocr'
                ? {
                    background: `linear-gradient(135deg, ${currentPreset.secondary}, ${currentPreset.primary})`,
                    boxShadow: `0 4px 12px ${currentPreset.primary}33`
                  }
                : undefined
            }
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'text-white shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            style={
              activeTab === 'audio'
                ? {
                    background: `linear-gradient(135deg, ${currentPreset.secondary}, ${currentPreset.primary})`,
                    boxShadow: `0 4px 12px ${currentPreset.primary}33`
                  }
                : undefined
            }
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'metadata'
                ? 'text-white shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            style={
              activeTab === 'metadata'
                ? {
                    background: `linear-gradient(135deg, ${currentPreset.secondary}, ${currentPreset.primary})`,
                    boxShadow: `0 4px 12px ${currentPreset.primary}33`
                  }
                : undefined
            }
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'text-white shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            style={
              activeTab === 'architecture'
                ? {
                    background: `linear-gradient(135deg, ${currentPreset.secondary}, ${currentPreset.primary})`,
                    boxShadow: `0 4px 12px ${currentPreset.primary}33`
                  }
                : undefined
            }
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4" />
              <span>Engine Architecture</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">LIVE</span>
          </button>
        </nav>
      </div>

      {/* Bottom Controls: Appearance Engine & Desktop System Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2.5">
        {/* Appearance & Color Palette Section */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              Appearance & Theme
            </span>
            {onOpenThemeModal && (
              <button
                type="button"
                id="sidebar-open-theme-btn"
                onClick={onOpenThemeModal}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
              >
                Customize
              </button>
            )}
          </div>

          {/* Dark / Light Mode Switch */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/70 rounded-lg border border-slate-800/80">
            <button
              type="button"
              id="sidebar-mode-dark-btn"
              onClick={() => mode !== 'dark' && toggleMode()}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                mode === 'dark'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3 h-3 text-cyan-400" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              id="sidebar-mode-light-btn"
              onClick={() => mode !== 'light' && toggleMode()}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                mode === 'light'
                  ? 'bg-slate-800 text-amber-300 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Light</span>
            </button>
          </div>

          {/* 5 Color Presets Interactive Dots */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Preset:</span>
              <span className="text-slate-200 font-mono font-medium truncate max-w-[120px]">
                {currentPreset.name}
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              {THEME_PRESETS.map((p) => {
                const isSelected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id as ThemePreset)}
                    title={`${p.name} - ${p.tagline}`}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-white scale-110 shadow-sm'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${p.secondary}, ${p.primary})`
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Telemetry Box */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              AXpert Core
            </span>
            <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Active
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-500 leading-tight">
            Native Desktop IPC Engine
            <div className="text-slate-400 mt-0.5">Reference UI Styles Calibrated</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
