import React from 'react';
import { Minus, Square, X, Zap, Music, Sun, Moon, Palette, LogOut, User, Eye, Lock, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface TitleBarProps {
  platform?: string;
  onOpenQuickOcr?: () => void;
  onOpenAudioExtractor?: () => void;
  onOpenThemeModal?: () => void;
  onOpenDesktopPackageModal?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  platform = 'win32',
  onOpenQuickOcr,
  onOpenAudioExtractor,
  onOpenThemeModal,
  onOpenDesktopPackageModal
}) => {
  const { mode, toggleMode, currentPreset } = useTheme();
  const { user, isGuest, logout, openAuthModal } = useAuth();

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

          {onOpenDesktopPackageModal && (
            <button
              type="button"
              id="titlebar-desktop-package-btn"
              onClick={onOpenDesktopPackageModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700/60 text-[11px] font-mono transition-colors shadow-sm"
              title="Download Desktop App (.exe & Installer)"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Desktop App (.exe)</span>
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

      {/* Center status info & User Profile */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            {isGuest ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#2b2438] border border-[#52446f] text-[11px] font-mono text-[#c5b5ee]">
                  <Eye className="w-3 h-3 text-[#9b82ff]" />
                  <span className="font-semibold">Guest Preview</span>
                  <span className="text-[9px] text-[#a998d4] px-1 rounded bg-[#3b2e54] uppercase">
                    View Only
                  </span>
                </div>
                <button
                  type="button"
                  id="titlebar-btn-create-account"
                  onClick={() => openAuthModal('register', 'unlock all file actions and conversions')}
                  className="px-2.5 py-1 rounded bg-[#7354f5] hover:bg-[#8063f9] text-white text-[11px] font-medium transition-colors cursor-pointer shadow-sm"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  id="titlebar-btn-exit-guest"
                  onClick={logout}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 text-[11px] font-mono transition-colors cursor-pointer"
                  title="Exit Guest Mode & Return to Auth Screen"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <User className="w-3 h-3 text-cyan-400" />
                  <span className="text-slate-200 font-semibold">{user.username}</span>
                  <span className="text-[10px] text-slate-400 px-1 rounded bg-slate-800 border border-slate-700/60 uppercase">
                    {user.role}
                  </span>
                </div>
                <button
                  id="titlebar-btn-logout"
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/90 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800/80 text-[11px] font-mono transition-colors cursor-pointer"
                  title="Sign Out of SQLite Session"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SQLite: Ready</span>
          </div>
        )}
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
