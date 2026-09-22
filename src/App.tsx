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

export default function App() {
  return (
    <ThemeProvider>
      <MainDesktopWindow />
    </ThemeProvider>
  );
}
