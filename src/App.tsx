/**
 * @file src/App.tsx
 * AXpert Desktop Suite - Root Application Frame.
 * Native IPC architecture with multi-format file conversion, instant PDF OCR,
 * audio extraction, metadata inspection, engine telemetry, and full dark/light theme customization.
 */

import React, { useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { FileConverter } from './components/FileConverter';
import { MetadataTool } from './components/MetadataTool';
import { EngineInspector } from './components/EngineInspector';
import { QuickPdfOcrTool } from './components/QuickPdfOcrTool';
import { AudioExtractor } from './components/AudioExtractor';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ThemeSelectorModal } from './components/ThemeSelector';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthLandingWindow } from './components/AuthLandingWindow';

function MainDesktopWindow() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('converter');
  const [queueCount, setQueueCount] = useState<number>(0);
  const [metadataFileLoaded, setMetadataFileLoaded] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const { mode } = useTheme();

  return (
    <div
      className={`w-screen h-screen flex flex-col font-sans overflow-hidden antialiased ${
        mode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Native-style Windows Title Bar with Dark/Light & Palette Toggles */}
      <TitleBar
        platform="win32"
        onOpenQuickOcr={() => setActiveTab('ocr')}
        onOpenAudioExtractor={() => setActiveTab('audio')}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
      />

      {/* Main Desktop Window Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Dock with Appearance Switcher */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          queueCount={queueCount}
          metadataFileLoaded={metadataFileLoaded}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
        />

        {/* Primary Functional Workspace */}
        <main
          className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
            mode === 'dark' ? 'bg-[#0b0f17]' : 'bg-slate-50'
          }`}
        >
          {activeTab === 'converter' && (
            <FileConverter
              onQueueChange={setQueueCount}
              onOpenOcr={() => setActiveTab('ocr')}
              onOpenAudioExtractor={() => setActiveTab('audio')}
            />
          )}
          {activeTab === 'ocr' && <QuickPdfOcrTool />}
          {activeTab === 'audio' && <AudioExtractor />}
          {activeTab === 'metadata' && (
            <MetadataTool onFileLoadedChange={setMetadataFileLoaded} />
          )}
          {activeTab === 'architecture' && <EngineInspector />}
        </main>
      </div>

      {/* Theme & Palette Selection Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-[#0b0f17] flex flex-col items-center justify-center text-slate-100 font-mono space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold text-lg animate-pulse">
          AX
        </div>
        <div className="text-center space-y-1">
          <div className="text-sm font-semibold tracking-wide text-slate-200">
            Initializing AXpert Offline SQLite Workstation...
          </div>
          <div className="text-xs text-slate-500">
            Mounting local WebAssembly database & validating session...
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the Auth Landing Window
  if (!user) {
    return <AuthLandingWindow />;
  }

  // Once authenticated, render the full workstation application
  return <MainDesktopWindow />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

