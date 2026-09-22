import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileCode,
  FileText,
  Trash2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Loader2,
  Sliders,
  Settings2,
  StopCircle
} from 'lucide-react';
import {
  FileQueueItem,
  AdvancedConversionOptions,
  ConversionJobPayload,
  ConversionProgressEvent,
  ConversionCompleteEvent
} from '../types';
import { ipc } from '../lib/ipcBridge';
import { formatFileSize, getFileExtension, getMimeType } from '../services/fileService';
import { engineTelemetry } from '../services/engineTelemetry';
import { Zap, Music, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_FORMATS = [
  { value: 'pdf', label: 'PDF — Portable Document Format' },
  { value: 'docx', label: 'DOCX — Microsoft Word Document' },
  { value: 'txt', label: 'TXT — Plain Text File' },
  { value: 'csv', label: 'CSV — Comma-Separated Values' },
  { value: 'png', label: 'PNG — High-Resolution Raster Image' }
];

interface FileConverterProps {
  onQueueChange?: (count: number) => void;
  onOpenOcr?: () => void;
  onOpenAudioExtractor?: () => void;
}

export const FileConverter: React.FC<FileConverterProps> = ({
  onQueueChange,
  onOpenOcr,
  onOpenAudioExtractor
}) => {
  const { requireAccount, isGuest } = useAuth();

  // Queue state
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Conversion Parameters
  const [outputFormat, setOutputFormat] = useState<string>('pdf');
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedConversionOptions>({
    ocr: false,
    tableExtraction: false,
    metadataStripper: false
  });

  // UI notification/status
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent of queue count
  useEffect(() => {
    onQueueChange?.(queue.length);
  }, [queue.length, onQueueChange]);

  // Wire IPC event listeners
  useEffect(() => {
    const unsubProgress = ipc.onConversionProgress((data: ConversionProgressEvent) => {
      setQueue((prevQueue) =>
        prevQueue.map((item) => {
          if (item.id === data.fileId) {
            return {
              ...item,
              status: 'PROCESSING',
              progress: data.progress,
              stage: data.stage
            };
          }
          return item;
        })
      );
    });

    const unsubComplete = ipc.onConversionComplete((data: ConversionCompleteEvent) => {
      setQueue((prevQueue) =>
        prevQueue.map((item) => {
          if (item.id === data.fileId) {
            return {
              ...item,
              status: data.success ? 'COMPLETED' : 'FAILED',
              progress: data.success ? 100 : item.progress,
              stage: data.success ? 'Completed' : (data.error || 'Failed'),
              errorMessage: data.error,
              downloadUrl: data.outputDataUrl,
              processedSize: data.convertedSize,
              completedAt: new Date().toLocaleTimeString()
            };
          }
          return item;
        })
      );
    });

    return () => {
      unsubProgress();
      unsubComplete();
    };
  }, []);

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Helper to add files into queue safely
  const addFilesToQueue = (files: Array<{ name: string; path?: string; size: number; type: string; file?: File }>) => {
    if (!files.length) return;

    const newItems: FileQueueItem[] = files.map((f) => {
      const ext = getFileExtension(f.name).toUpperCase() || 'FILE';
      return {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: f.name,
        type: ext,
        size: f.size,
        formattedSize: formatFileSize(f.size),
        status: 'QUEUED',
        progress: 0,
        stage: 'Queued',
        file: f.file,
        path: f.path,
        outputFormat: outputFormat.toUpperCase()
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
    showNotification(`Queued ${newItems.length} file(s) for conversion.`, 'info');
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!requireAccount('drag and drop files for conversion')) {
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type || getMimeType(f.name),
        file: f,
        path: f.name
      }));
      addFilesToQueue(droppedFiles);
    }
  };

  // Browse file button via IPC or input
  const handleBrowseFiles = async () => {
    if (!requireAccount('browse and upload files for conversion')) {
      return;
    }

    try {
      const selected = await ipc.selectFiles();
      if (selected && selected.length > 0) {
        addFilesToQueue(selected);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error selecting files';
      showNotification(message, 'error');
    }
  };

  // Safe file removal, deletion of worked-on file, or cancellation
  const handleRemoveItem = async (item: FileQueueItem) => {
    if (item.status === 'PROCESSING') {
      if (activeJobId) {
        await ipc.cancelConversion(activeJobId);
      }
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'CANCELLED', stage: 'Cancelled by user' } : q))
      );
      showNotification(`Cancelled processing for ${item.name}`, 'info');
    } else {
      if (item.downloadUrl) {
        engineTelemetry.revokeBlob(item.downloadUrl);
      }
      setQueue((prev) => prev.filter((q) => q.id !== item.id));
      if (item.status === 'COMPLETED') {
        showNotification(`Deleted worked-on file "${item.name}" and removed output artifact.`, 'info');
      } else {
        showNotification(`Removed "${item.name}" from queue.`, 'info');
      }
    }
  };

  // Delete all completed / finished items
  const handleClearCompleted = () => {
    const completedItems = queue.filter(
      (item) => item.status === 'COMPLETED' || item.status === 'FAILED' || item.status === 'CANCELLED'
    );
    completedItems.forEach((item) => {
      if (item.downloadUrl) {
        engineTelemetry.revokeBlob(item.downloadUrl);
      }
    });
    setQueue((prev) => prev.filter((item) => item.status === 'QUEUED' || item.status === 'PROCESSING'));
    showNotification(`Deleted ${completedItems.length} finished file(s) from session.`, 'info');
  };

  // Execute Converter
  const handleExecuteConverter = async () => {
    if (!requireAccount('execute batch file conversion')) {
      return;
    }

    const queuedItems = queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED');

    if (queuedItems.length === 0) {
      showNotification('No queued files ready for conversion. Add files above.', 'error');
      return;
    }

    if (!outputFormat) {
      showNotification('Please select a valid output format.', 'error');
      return;
    }

    setIsProcessingAll(true);

    try {
      // Process files sequentially through IPC
      for (const item of queuedItems) {
        const jobId = `job_${Date.now()}_${item.id}`;
        setActiveJobId(jobId);

        // Update item to processing
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: 'PROCESSING', progress: 5, stage: 'Connecting to conversion engine...' } : q
          )
        );

        const payload: ConversionJobPayload = {
          jobId,
          fileId: item.id,
          fileName: item.name,
          filePath: item.path,
          fileSize: item.size,
          inputFormat: item.type,
          outputFormat,
          options: advancedOptions
        };

        // Trigger IPC execution
        await ipc.startConversion(payload);

        // Wait until this file reaches completed, failed, or cancelled
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            setQueue((latestQueue) => {
              const current = latestQueue.find((q) => q.id === item.id);
              if (current && (current.status === 'COMPLETED' || current.status === 'FAILED' || current.status === 'CANCELLED')) {
                clearInterval(checkInterval);
                resolve();
              }
              return latestQueue;
            });
          }, 200);
        });
      }

      showNotification('Batch conversion routine completed.', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error during conversion execution';
      showNotification(message, 'error');
    } finally {
      setIsProcessingAll(false);
      setActiveJobId(null);
    }
  };

  // Convert single item explicitly
  const handleConvertSingleItem = async (item: FileQueueItem) => {
    if (!requireAccount('convert this file')) {
      return;
    }
    if (item.status === 'PROCESSING') return;
    try {
      const jobId = `job-single-${item.id}-${Date.now()}`;
      setActiveJobId(jobId);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'PROCESSING', progress: 5, stage: 'Starting conversion...' }
            : q
        )
      );

      const payload: ConversionJobPayload = {
        jobId,
        fileId: item.id,
        fileName: item.name,
        filePath: item.path,
        fileSize: item.size,
        inputFormat: item.type,
        outputFormat,
        options: advancedOptions
      };

      await ipc.startConversion(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error converting file';
      showNotification(message, 'error');
    }
  };

  // Safe Cancel All
  const handleCancelAll = async () => {
    if (activeJobId) {
      await ipc.cancelConversion(activeJobId);
      setActiveJobId(null);
    }
    setQueue((prev) =>
      prev.map((item) =>
        item.status === 'PROCESSING' ? { ...item, status: 'CANCELLED', stage: 'Aborted by user' } : item
      )
    );
    setIsProcessingAll(false);
    showNotification('Conversion cancelled by user.', 'info');
  };

  const getStatusBadge = (status: FileQueueItem['status']) => {
    switch (status) {
      case 'QUEUED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-amber-300 border border-slate-700/80 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Queued
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 flex items-center gap-1 shadow-sm shadow-cyan-900/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-950/80 text-rose-300 border border-rose-700/60 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700/80 flex items-center gap-1">
            <StopCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div id="file-converter-view" className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Batch File Converter
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            IPC Pipeline: Document & Media Transcoder Service
          </p>
        </div>

        {notification && (
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 ${
              notification.type === 'error'
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : notification.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-cyan-300'
            }`}
          >
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      {/* Quick Dedicated Tools Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {onOpenOcr && (
          <button
            type="button"
            onClick={onOpenOcr}
            className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-800/60 hover:border-blue-500/80 transition-all text-left flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <span>Instant PDF OCR</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-900/60 text-blue-300 font-mono">
                    TXT &amp; DOCX
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Upload PDF and immediately download OCR transcribed .txt or formatted .docx
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
              Launch →
            </span>
          </button>
        )}

        {onOpenAudioExtractor && (
          <button
            type="button"
            onClick={onOpenAudioExtractor}
            className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/60 hover:border-cyan-500/80 transition-all text-left flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <span>Audio Extractor from Video</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-900/60 text-cyan-300 font-mono">
                    PCM DEMUXER
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Demux high-fidelity audio streams (WAV, MP3, AAC) from MP4 / WebM videos
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
              Launch →
            </span>
          </button>
        )}
      </div>

      {/* SECTION 1: DOMINANT DRAG-AND-DROP AREA */}
      <section aria-label="Drop Files Area">
        <div
          id="converter-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseFiles}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-all duration-200 flex flex-col items-center justify-center text-center ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20 shadow-xl shadow-cyan-950/30 scale-[0.995]'
              : 'border-slate-700/80 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900/80'
          }`}
        >
          {/* Hidden input for standard file browsing */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                if (!requireAccount('upload files for conversion')) {
                  e.target.value = '';
                  return;
                }
                const files = Array.from(e.target.files).map((f) => ({
                  name: f.name,
                  size: f.size,
                  type: f.type || getMimeType(f.name),
                  file: f,
                  path: f.name
                }));
                addFilesToQueue(files);
              }
            }}
          />

          {isGuest && (
            <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-700/60 text-purple-300 text-[11px] font-mono shadow-xs">
              <Lock className="w-3 h-3 text-purple-400" />
              <span>Guest Preview Mode • Uploads require account</span>
            </div>
          )}

          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${
              isDragging
                ? 'bg-cyan-500/20 text-cyan-300 scale-110'
                : 'bg-slate-800/80 text-slate-300 group-hover:text-cyan-400 group-hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base font-semibold text-slate-200 tracking-tight">
            DROP FILES HERE
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            or <span className="text-cyan-400 font-medium underline underline-offset-2">click to browse files</span> from your computer
          </p>

          {/* Supported Format Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
            {['PDF', 'DOCX', 'XLSX', 'CSV', 'TXT', 'PNG', 'JPG', 'WEBP'].map((ext) => (
              <span
                key={ext}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/70 border border-slate-700/60 text-slate-400"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: FILE QUEUE */}
      <section aria-label="Queued Files" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Queued Files
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {queue.length}
            </span>
          </div>

          {queue.some((i) => i.status === 'COMPLETED' || i.status === 'FAILED' || i.status === 'CANCELLED') && (
            <button
              type="button"
              id="btn-clear-completed"
              onClick={handleClearCompleted}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-900/60 flex items-center gap-1.5 transition-colors font-mono cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Worked Files ({queue.filter((i) => i.status === 'COMPLETED').length})</span>
            </button>
          )}
        </div>

        {/* Queue Items List */}
        {queue.length === 0 ? (
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-8 text-center text-slate-500 text-xs font-mono">
            No files currently queued. Drop files above or click browse to start.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                id={`queue-item-${item.id}`}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.status === 'PROCESSING'
                    ? 'border-cyan-500/60 bg-slate-900 shadow-md shadow-cyan-950/20'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* File Metadata */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-cyan-400">
                      {['PNG', 'JPG', 'WEBP'].includes(item.type) ? (
                        <FileCode className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div
                        className="text-xs font-medium text-slate-200 truncate max-w-xs sm:max-w-md"
                        title={item.name}
                      >
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{item.type}</span>
                        <span>•</span>
                        <span>{item.formattedSize}</span>
                        {item.status === 'COMPLETED' && item.processedSize && (
                          <>
                            <span>→</span>
                            <span className="text-emerald-400 font-medium">
                              {formatFileSize(item.processedSize)} ({outputFormat.toUpperCase()})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {getStatusBadge(item.status)}

                    {item.status === 'QUEUED' && (
                      <button
                        type="button"
                        id={`btn-convert-item-${item.id}`}
                        onClick={() => handleConvertSingleItem(item)}
                        disabled={isProcessingAll}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/35 text-cyan-300 text-[11px] font-mono font-semibold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Convert this file only"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Convert</span>
                      </button>
                    )}

                    {item.status === 'COMPLETED' && (
                      <>
                        {item.downloadUrl && (
                          <a
                            href={item.downloadUrl}
                            download={`${item.name.replace(/\.[^/.]+$/, '')}_converted.${outputFormat}`}
                            className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                            title="Download converted file"
                            aria-label="Download converted file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          id={`btn-delete-worked-${item.id}`}
                          onClick={() => handleRemoveItem(item)}
                          className="px-2 py-1 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/60 text-rose-300 hover:text-rose-200 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                          title="Delete worked-on file and purge from session"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}

                    {item.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title={item.status === 'PROCESSING' ? 'Cancel conversion' : 'Remove from queue'}
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Stage Indicator */}
                {(item.status === 'PROCESSING' || item.progress > 0) && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span className="truncate max-w-md">{item.stage || 'Processing...'}</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-400'
                            : item.status === 'FAILED'
                            ? 'bg-rose-500'
                            : 'bg-cyan-400'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: OUTPUT FORMAT SELECTOR */}
      <section aria-label="Output Format Configuration" className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <label
          htmlFor="output-format-select"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Output Format
        </label>
        <div className="max-w-md">
          <select
            id="output-format-select"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            disabled={isProcessingAll}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
          >
            {AVAILABLE_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* SECTION 4: ADVANCED EXTRACTION OPTIONS (EXACTLY 3 CONTROLS) */}
      <section aria-label="Advanced Extraction Options" className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Advanced Options
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Toggle 1: OCR TEXT EXTRACTION */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between">
            <div className="space-y-1 mb-3">
              <span className="text-xs font-semibold text-slate-200">
                OCR TEXT EXTRACTION
              </span>
              <p className="text-[11px] text-slate-400">
                Scan bitmap images and convert raster text layers into selectable text.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-mono text-slate-400">
                {advancedOptions.ocr ? 'ENABLED' : 'DISABLED'}
              </span>
              <button
                type="button"
                id="toggle-ocr"
                role="switch"
                aria-checked={advancedOptions.ocr}
                onClick={() =>
                  setAdvancedOptions((prev) => ({ ...prev, ocr: !prev.ocr }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  advancedOptions.ocr ? 'bg-cyan-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    advancedOptions.ocr ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Toggle 2: STRUCTURED TABLE EXTRACTION (CSV/XLSX) */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between">
            <div className="space-y-1 mb-3">
              <span className="text-xs font-semibold text-slate-200">
                STRUCTURED TABLE EXTRACTION (CSV/XLSX)
              </span>
              <p className="text-[11px] text-slate-400">
                Isolate tabular data coordinates and generate clean grid cell exports.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-mono text-slate-400">
                {advancedOptions.tableExtraction ? 'ENABLED' : 'DISABLED'}
              </span>
              <button
                type="button"
                id="toggle-table-extraction"
                role="switch"
                aria-checked={advancedOptions.tableExtraction}
                onClick={() =>
                  setAdvancedOptions((prev) => ({
                    ...prev,
                    tableExtraction: !prev.tableExtraction
                  }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  advancedOptions.tableExtraction ? 'bg-cyan-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    advancedOptions.tableExtraction ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Toggle 3: AUTOMATIC METADATA STRIPPER */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between">
            <div className="space-y-1 mb-3">
              <span className="text-xs font-semibold text-slate-200">
                AUTOMATIC METADATA STRIPPER
              </span>
              <p className="text-[11px] text-slate-400">
                Sanitize author, revision dates, and software tags during the conversion cycle.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-mono text-slate-400">
                {advancedOptions.metadataStripper ? 'ENABLED' : 'DISABLED'}
              </span>
              <button
                type="button"
                id="toggle-metadata-stripper"
                role="switch"
                aria-checked={advancedOptions.metadataStripper}
                onClick={() =>
                  setAdvancedOptions((prev) => ({
                    ...prev,
                    metadataStripper: !prev.metadataStripper
                  }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  advancedOptions.metadataStripper ? 'bg-cyan-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    advancedOptions.metadataStripper ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* IPC Request Payload preview */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>IPC Payload Request Preview:</span>
          <span className="text-cyan-400">
            {JSON.stringify({
              outputFormat,
              ocr: advancedOptions.ocr,
              tableExtraction: advancedOptions.tableExtraction,
              metadataStripper: advancedOptions.metadataStripper
            })}
          </span>
        </div>
      </section>

      {/* SECTION 5: EXECUTE CONVERTER BUTTON */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {isProcessingAll && (
          <button
            type="button"
            onClick={handleCancelAll}
            className="px-5 py-3 rounded-xl border border-rose-800 bg-rose-950/50 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold tracking-wider flex items-center gap-2 transition-all"
          >
            <StopCircle className="w-4 h-4" />
            CANCEL ALL
          </button>
        )}

        <button
          id="btn-execute-converter"
          type="button"
          disabled={isProcessingAll || queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED').length === 0}
          onClick={handleExecuteConverter}
          className={`px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-lg ${
            isProcessingAll || queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED').length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'theme-btn-primary cursor-pointer active:scale-[0.99]'
          }`}
        >
          {isProcessingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>CONVERTING QUEUE...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>
                EXECUTE CONVERTER{' '}
                {queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED').length > 0
                  ? `(${queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED').length} QUEUED)`
                  : ''}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
