import React from 'react';
import { Minus, Square, X, Zap, Music, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TitleBarProps {
  platform?: string;
  onOpenQuickOcr?: () => void;
  onOpenAudioExtractor?: () => void;
  onOpenThemeModal?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  platform = 'win32',
  onOpenQuickOcr,
  onOpenAudioExtractor,
  onOpenThemeModal
}) => {
  const { mode, toggleMode, currentPreset } = useTheme();

  return (
    <header
      id="desktop-titlebar"
      className="h-10 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between px-3 select-none z-50 text-xs text-slate-300 font-mono tracking-tight"
    >
      {/* App branding & title */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-[11px]">
          AX
        </div>
        <span className="font-semibold text-slate-100 tracking-normal">
          AXPERT DESKTOP SUITE
        </span>
        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[10px] text-cyan-400">
          IPC v2.4 • {platform.toUpperCase()}
        </span>
      </div>

      {/* Center Action & Theme Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Access Tools */}
        <div className="hidden lg:flex items-center gap-2">
          {onOpenQuickOcr && (
            <button
              type="button"
              onClick={onOpenQuickOcr}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950/80 hover:bg-blue-900/90 text-blue-300 border border-blue-800/60 text-[11px] font-mono transition-colors shadow-sm"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Quick PDF OCR (.txt / .docx)</span>
            </button>
          )}

          {onOpenAudioExtractor && (
            <button
              type="button"
              onClick={onOpenAudioExtractor}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px] font-mono transition-colors"
            >
              <Music className="w-3 h-3 text-cyan-400" />
              <span>Extract Audio</span>
            </button>
          )}
        </div>

        {/* Theme Palette & Dark/Light Toggle Controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800/80">
          {/* Dark / Light Toggle */}
          <button
            id="titlebar-mode-toggle"
            type="button"
            onClick={toggleMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700/60 text-[11px] font-mono transition-colors cursor-pointer"
            title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {mode === 'dark' ? (
              <>
                <Sun className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Theme Selector Palette Button */}
          {onOpenThemeModal && (
            <button
              id="titlebar-theme-modal-btn"
              type="button"
              onClick={onOpenThemeModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700/60 text-[11px] font-mono transition-colors cursor-pointer"
              title="Select Color Theme Preset"
            >
              <Palette className="w-3 h-3 text-cyan-400" />
              <span className="hidden md:inline">{currentPreset.name}</span>
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: currentPreset.primary }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Center status info (hidden on narrow screens) */}
      <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-400">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>AXpert Engine: Ready</span>
      </div>

      {/* Window Controls (Simulated native desktop controls) */}
      <div className="flex items-center">
        <button
          id="btn-window-minimize"
          type="button"
          aria-label="Minimize Window"
          title="Minimize"
          className="w-10 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-window-maximize"
          type="button"
          aria-label="Maximize Window"
          title="Maximize"
          className="w-10 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          id="btn-window-close"
          type="button"
          aria-label="Close Window"
          title="Close"
          className="w-10 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
