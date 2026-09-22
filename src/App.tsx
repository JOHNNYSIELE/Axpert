/**
 * @file src/App.tsx
 * AXpert Desktop Suite - Root Application Frame.
 * Windows desktop application architecture with native IPC bridge,
 * multi-format file conversion, instant PDF OCR, audio extraction, metadata inspection, and live engine telemetry.
 */

import React, { useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { FileConverter } from './components/FileConverter';
import { MetadataTool } from './components/MetadataTool';
import { EngineInspector } from './components/EngineInspector';
import { QuickPdfOcrTool } from './components/QuickPdfOcrTool';
import { AudioExtractor } from './components/AudioExtractor';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('converter');
  const [queueCount, setQueueCount] = useState<number>(0);
  const [metadataFileLoaded, setMetadataFileLoaded] = useState<boolean>(false);

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden antialiased">
      {/* Native-style Windows Title Bar */}
      <TitleBar
        platform="win32"
        onOpenQuickOcr={() => setActiveTab('ocr')}
        onOpenAudioExtractor={() => setActiveTab('audio')}
      />

      {/* Main Desktop Window Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Dock */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          queueCount={queueCount}
          metadataFileLoaded={metadataFileLoaded}
        />

        {/* Primary Functional Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0b0f17] overflow-hidden">
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
    </div>
  );
}

