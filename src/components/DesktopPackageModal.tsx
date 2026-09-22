import React, { useState } from 'react';
import {
  Download,
  Folder,
  CheckCircle2,
  Terminal,
  FileCode,
  Layers,
  X,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

interface DesktopPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopPackageModal: React.FC<DesktopPackageModalProps> = ({ isOpen, onClose }) => {
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const targetPath = 'C:\\Users\\Admin\\Desktop\\PP\\AXpert System';
  const downloadUrl = '/downloads/AXpert-Windows-x64.zip';

  const handleDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'AXpert-Windows-x64.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="desktop-package-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="desktop-package-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-700/70 flex items-center justify-center text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <span>AXpert Desktop Package</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-[10px] font-mono">
                  v2.4 Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Windows x64 Executable (.exe) &amp; Automated Installer Package
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target Location Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                Target Windows Installation Folder
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono">
                Pre-configured
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 font-mono text-xs text-emerald-400 break-all select-all flex items-center justify-between">
              <span>{targetPath}</span>
            </div>
          </div>

          {/* Package Contents Checklist */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2.5">
              Packaged Assets &amp; Binaries
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">AXpert.exe</div>
                  <div className="text-[11px] text-slate-400">
                    Standalone 64-bit Windows executable runtime
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Install-AXpert.bat</div>
                  <div className="text-[11px] text-slate-400">
                    Auto-installs to folder &amp; creates Desktop shortcut
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Run-AXpert.bat</div>
                  <div className="text-[11px] text-slate-400">
                    Instant portable launch without installation
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">resources/app</div>
                  <div className="text-[11px] text-slate-400">
                    Full offline UI, Vite bundle, IPC bridge &amp; services
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/50 space-y-2.5">
            <h4 className="text-xs font-bold text-blue-300 font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              How to Deploy &amp; Run
            </h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside font-sans">
              <li>
                Click <strong className="text-white">"Download Package (.zip)"</strong> below to get{' '}
                <code className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">
                  AXpert-Windows-x64.zip
                </code>
                .
              </li>
              <li>Extract the ZIP file anywhere on your computer.</li>
              <li>
                Double-click <strong className="text-white">Install-AXpert.bat</strong>:
                <p className="ml-5 text-[11px] text-slate-400 font-mono mt-0.5">
                  → Automatically copies everything into{' '}
                  <span className="text-emerald-400">{targetPath}</span> and creates your desktop
                  shortcut.
                </p>
              </li>
              <li>
                Or simply double-click <strong className="text-white">AXpert.exe</strong> to run it
                portably!
              </li>
            </ol>
          </div>

          {/* Download Notification if triggered */}
          {downloadStarted && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/80 text-xs text-emerald-300 font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Download started for AXpert-Windows-x64.zip (105 MB). Check your browser downloads!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Standalone Electron v30 • No external node runtime required</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer w-full sm:w-auto"
            >
              Close
            </button>
            <button
              type="button"
              id="btn-download-desktop-pkg"
              onClick={handleDownload}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold font-mono shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download Package (.zip)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
