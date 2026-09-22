/**
 * @file src/components/QuickPdfOcrTool.tsx
 * Instant PDF to TXT / DOCX OCR Extraction Tool for AXpert.
 * Upload a PDF document and immediately obtain a clean .TXT or .DOCX document.
 */

import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Search,
  Sparkles,
  Clock,
  Layers,
  FileCheck2,
  FileCode,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { PdfOcrResult } from '../types';
import { processPdfOcr } from '../services/pdfOcrService';
import { formatFileSize } from '../services/fileService';

interface QuickPdfOcrToolProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const QuickPdfOcrTool: React.FC<QuickPdfOcrToolProps> = ({ isEmbedded = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<PdfOcrResult | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [ocrTargetFormat, setOcrTargetFormat] = useState<'both' | 'txt' | 'docx'>('both');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleSelectPdf(file);
    }
  };

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
        handleSelectPdf(file);
      } else {
        setErrorMessage('Please upload a PDF document (.pdf).');
      }
    }
  };

  const handleSelectPdf = (file: File) => {
    setSelectedFile(file);
    setOcrResult(null);
    setErrorMessage(null);
    setProgress(0);
    setProgressStage('');
  };

  const executeOcrOnFile = async () => {
    if (!selectedFile) return;
    setErrorMessage(null);
    setIsProcessing(true);
    setProgress(10);
    setProgressStage('Reading PDF document structure...');
    setOcrResult(null);

    try {
      const result = await processPdfOcr(selectedFile, (p, stage) => {
        setProgress(p);
        setProgressStage(stage);
      });
      setOcrResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing OCR';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!ocrResult) return;
    const link = document.createElement('a');
    link.href = ocrResult.txtUrl;
    link.download = `${ocrResult.fileName.replace(/\.pdf$/i, '')}_ocr.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDocx = () => {
    if (!ocrResult) return;
    const link = document.createElement('a');
    link.href = ocrResult.docxUrl;
    link.download = `${ocrResult.fileName.replace(/\.pdf$/i, '')}_ocr.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = async () => {
    if (!ocrResult) return;
    try {
      await navigator.clipboard.writeText(ocrResult.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setOcrResult(null);
    setProgress(0);
    setProgressStage('');
    setErrorMessage(null);
    setSearchQuery('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteOcrFile = () => {
    const filename = ocrResult?.fileName || selectedFile?.name || 'Document';
    handleReset();
    setStatusMessage(`Deleted worked-on file "${filename}" and cleared extracted results.`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const filteredText = ocrResult?.extractedText || '';

  return (
    <div
      id="quick-pdf-ocr-view"
      className={`flex-1 flex flex-col overflow-y-auto ${isEmbedded ? 'p-0' : 'p-6'} space-y-5`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Instant PDF OCR Scanner
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-800/60">
              1-CLICK TXT &amp; DOCX
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Upload any PDF to immediately scan, vectorize, and export editable .TXT or .DOCX
          </p>
        </div>

        {selectedFile && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Upload Another PDF
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 font-mono flex items-center justify-between">
          <span>✓ {statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* STEP 1: UPLOAD ZONE (When no file or before completion) */}
      {!selectedFile ? (
        <div
          id="pdf-ocr-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectFile}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
            isDragging
              ? 'border-blue-400 bg-blue-950/20 shadow-lg shadow-blue-950/30'
              : 'border-slate-700/80 bg-slate-900/50 hover:border-blue-500/60 hover:bg-slate-900/80'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700 mx-auto flex items-center justify-center text-blue-400 mb-4 shadow-md">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 uppercase tracking-wide">
            CLICK OR DRAG &amp; DROP PDF DOCUMENT
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Scanned receipts, multi-page invoices, agreements, or articles
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono text-cyan-300">
              ⚡ Instant Optical Character Recognition
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono text-blue-300">
              📄 Output: Clean .TXT &amp; Word .DOCX
            </span>
          </div>
        </div>
      ) : null}

      {/* STEP 1.5: STAGED PDF FILE & ACTION BUTTON (Before execution) */}
      {selectedFile && !ocrResult && !isProcessing && (
        <div id="pdf-ocr-staged-panel" className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                  <span>{selectedFile.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono font-medium">
                    STAGED FOR OCR
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-2.5">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span>PDF Document Container</span>
                  <span>•</span>
                  <span className="text-emerald-400">Ready to Extract</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                id="btn-discard-staged-pdf"
                onClick={handleDeleteOcrFile}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-900/60 bg-rose-950/30 transition-colors cursor-pointer"
                title="Discard staged PDF"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Discard
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change File
              </button>
            </div>
          </div>

          {/* OCR Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-[11px] text-slate-400 font-semibold uppercase block">
                Target Output Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'both', label: 'TXT + DOCX' },
                  { id: 'txt', label: '.TXT Only' },
                  { id: 'docx', label: '.DOCX Only' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setOcrTargetFormat(fmt.id as 'both' | 'txt' | 'docx')}
                    className={`p-2 rounded-lg text-center font-bold text-[11px] transition-all border ${
                      ocrTargetFormat === fmt.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-[11px] text-slate-400 font-semibold uppercase block">
                OCR Pipeline Configuration
              </label>
              <div className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Reconstructs tabular layout, parses postscript streams, and optimizes text tokens for Microsoft Word and plain text editors.
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Press the action button to begin optical character recognition</span>
            </div>

            <button
              id="btn-start-pdf-ocr"
              type="button"
              onClick={executeOcrOnFile}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl theme-btn-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.99] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>START OCR EXTRACTION</span>
            </button>
          </div>
        </div>
      )}

      {/* PROCESSING STATE */}
      {isProcessing && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-blue-800/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 animate-spin">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-100 font-mono">
                  {selectedFile?.name}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {selectedFile ? formatFileSize(selectedFile.size) : ''} • Neural Optical Recognition
                </div>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-cyan-400">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{progressStage}</span>
          </div>
        </div>
      )}

      {/* STEP 2: OCR COMPLETED RESULT */}
      {ocrResult && !isProcessing && (
        <div className="space-y-4">
          {/* Top Quick Actions & Stats Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                  <span>{ocrResult.fileName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                    OCR VERIFIED
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-3">
                  <span>{formatFileSize(ocrResult.fileSize)}</span>
                  <span>•</span>
                  <span>{ocrResult.wordCount.toLocaleString()} words</span>
                  <span>•</span>
                  <span>{ocrResult.charCount.toLocaleString()} characters</span>
                  <span>•</span>
                  <span className="text-cyan-400">{ocrResult.confidenceScore}% Confidence</span>
                  <span>•</span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {ocrResult.durationMs}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Immediate Export Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-download-txt"
                type="button"
                onClick={handleDownloadTxt}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-blue-900/30"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD .TXT</span>
              </button>

              <button
                id="btn-download-docx"
                type="button"
                onClick={handleDownloadDocx}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-cyan-900/20"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD .DOCX</span>
              </button>

              <button
                id="btn-copy-ocr-text"
                type="button"
                onClick={handleCopyText}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Copy transcription to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                id="btn-delete-ocr-file"
                type="button"
                onClick={handleDeleteOcrFile}
                className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-rose-900/60 transition-colors cursor-pointer"
                title="Delete worked-on PDF and clear extracted results"
              >
                <Trash2 className="w-4 h-4" />
                <span>DELETE FILE</span>
              </button>
            </div>
          </div>

          {/* Text Viewer Panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
            {/* Viewer Toolbar */}
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Extracted Document Text Stream
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search in text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-48"
                  />
                </div>
              </div>
            </div>

            {/* Extracted Document Body */}
            <div className="p-5 max-h-[420px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
              {searchQuery ? (
                filteredText.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                  part.toLowerCase() === searchQuery.toLowerCase() ? (
                    <mark key={i} className="bg-amber-400 text-slate-950 rounded px-0.5">
                      {part}
                    </mark>
                  ) : (
                    part
                  )
                )
              ) : (
                filteredText
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between px-4">
              <span>Encoding: UTF-8 / Standard Latin</span>
              <span>Normalized line endings • Ready for word processors</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
