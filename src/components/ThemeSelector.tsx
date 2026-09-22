import React from 'react';
import { Sun, Moon, Palette, Check, Sparkles, Monitor } from 'lucide-react';
import { useTheme, THEME_PRESETS, ThemePreset } from '../context/ThemeContext';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorProps> = ({ isOpen, onClose }) => {
  const { mode, preset, setMode, setPreset } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      id="theme-selector-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="theme-selector-modal"
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-tight text-slate-100">
                Appearance & Theme Engine
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Reference UI/UX Palette & Color Schemes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Dark / Light Mode Segmented Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            Display Mode
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              type="button"
              id="theme-btn-dark-mode"
              onClick={() => setMode('dark')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all ${
                mode === 'dark'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Mode (Reference)</span>
            </button>
            <button
              type="button"
              id="theme-btn-light-mode"
              onClick={() => setMode('light')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all ${
                mode === 'light'
                  ? 'bg-slate-800 text-amber-400 shadow-sm border border-amber-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </button>
          </div>
        </div>

        {/* Color Palette Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Color Schemes
            </label>
            <span className="text-[10px] text-slate-500 font-mono">5 PRESETS</span>
          </div>

          <div className="space-y-2">
            {THEME_PRESETS.map((p) => {
              const isSelected = preset === p.id;
              return (
                <button
                  key={p.id}
                  id={`preset-${p.id}`}
                  type="button"
                  onClick={() => setPreset(p.id as ThemePreset)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-cyan-500/60 bg-slate-850/90 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Swatch circle */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shadow-inner border border-white/20 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${p.secondary}, ${p.primary})`
                      }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100">{p.name}</span>
                        {p.isReference && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                            REF UI
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {p.tagline}
                      </span>
                    </div>
                  </div>

                  {/* Color dots preview */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.primary }}
                      title="Primary accent"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.secondary }}
                      title="Secondary accent"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold font-mono uppercase tracking-wider transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
