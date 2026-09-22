import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';
export type ThemePreset = 'cyan' | 'cobalt' | 'emerald' | 'amber' | 'violet';

export interface ThemePresetOption {
  id: ThemePreset;
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  isReference?: boolean;
}

export const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'cyan',
    name: 'Electric Cyan',
    tagline: 'Reference UI / Electron Default',
    primary: '#06b6d4',
    secondary: '#2563eb',
    isReference: true
  },
  {
    id: 'cobalt',
    name: 'Cobalt Studio',
    tagline: 'Deep Royal Tech & Indigo',
    primary: '#3b82f6',
    secondary: '#6366f1'
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    tagline: 'High-Contrast Terminal Green',
    primary: '#10b981',
    secondary: '#06b6d4'
  },
  {
    id: 'amber',
    name: 'Obsidian Amber',
    tagline: 'Warm Industrial Gold & Slate',
    primary: '#f59e0b',
    secondary: '#f97316'
  },
  {
    id: 'violet',
    name: 'Neon Violet',
    tagline: 'Cyber Orchid & Cyan Accents',
    primary: '#a855f7',
    secondary: '#06b6d4'
  }
];

interface ThemeContextType {
  mode: ThemeMode;
  preset: ThemePreset;
  currentPreset: ThemePresetOption;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
  presets: ThemePresetOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_MODE_KEY = 'axpert_theme_mode';
const STORAGE_PRESET_KEY = 'axpert_theme_preset';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_MODE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  const [preset, setPresetState] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem(STORAGE_PRESET_KEY);
    const validPresets: ThemePreset[] = ['cyan', 'cobalt', 'emerald', 'amber', 'violet'];
    return saved && validPresets.includes(saved as ThemePreset) ? (saved as ThemePreset) : 'cyan';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme-mode', mode);
    root.setAttribute('data-theme-preset', preset);
    localStorage.setItem(STORAGE_MODE_KEY, mode);
    localStorage.setItem(STORAGE_PRESET_KEY, preset);
  }, [mode, preset]);

  const toggleMode = () => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setPreset = (newPreset: ThemePreset) => {
    setPresetState(newPreset);
  };

  const currentPreset = THEME_PRESETS.find((p) => p.id === preset) || THEME_PRESETS[0];

  return (
    <ThemeContext.Provider
      value={{
        mode,
        preset,
        currentPreset,
        toggleMode,
        setMode,
        setPreset,
        presets: THEME_PRESETS
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
