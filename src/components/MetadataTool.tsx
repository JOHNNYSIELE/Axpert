import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Upload,
  FileText,
  AlertTriangle,
  Download,
  Info,
  CheckCircle,
  FileCheck2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { MetadataInspectionResult, MetadataStripResult } from '../types';
import { ipc } from '../lib/ipcBridge';
import { getMimeType } from '../services/fileService';

interface MetadataToolProps {
  onFileLoadedChange?: (loaded: boolean) => void;
}

export const MetadataTool: React.FC<MetadataToolProps> = ({ onFileLoadedChange }) => {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
    path?: string;
    lastModified?: number;
    file?: File;
  } | null>(null);

  const [inspection, setInspection] = useState<MetadataInspectionResult | null>(null);
  const [stripResult, setStripResult] = useState<MetadataStripResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isStripping, setIsStripping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // File selection for metadata tool
  const handleSelectFile = async () => {
    try {
      setErrorMessage(null);
      setStatusMessage(null);
      const fileData = await ipc.selectMetadataFile();
      if (fileData) {
        await processLoadedFile(fileData);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to select file';
      setErrorMessage(message);
    }
  };

  const processLoadedFile = async (fileData: {
    name: string;
    size: number;
    type: string;
    path?: string;
    lastModified?: number;
    file?: File;
  }) => {
    setSelectedFile(fileData);
    setStripResult(null);
    setIsInspecting(true);
    if (onFileLoadedChange) onFileLoadedChange(true);

    try {
      const result = await ipc.inspectMetadata(fileData);
      setInspection(result);
      setStatusMessage(`Inspected ${result.properties.length} metadata properties.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error reading metadata properties';
      setErrorMessage(message);
    } finally {
      setIsInspecting(false);
    }
  };

  // Drag and drop into metadata tool
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0];
      await processLoadedFile({
        name: f.name,
        size: f.size,
        type: f.type || getMimeType(f.name),
        file: f,
        path: f.name,
        lastModified: f.lastModified
      });
    }
  };

  // Remove Metadata Action
  const handleRemoveMetadata = async () => {
    if (!selectedFile) return;

    setIsStripping(true);
    setErrorMessage(null);

    try {
      const result = await ipc.stripMetadata(selectedFile);
      setStripResult(result);
      setStatusMessage(`Metadata removal complete. Created clean copy: ${result.cleanFileName}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to strip metadata';
      setErrorMessage(message);
    } finally {
      setIsStripping(false);
    }
  };

  // Save Clean Copy Action
  const handleSaveCleanCopy = async () => {
    if (!stripResult) return;

    try {
      const saveRes = await ipc.saveCleanFile({
        fileName: stripResult.cleanFileName,
        blob: stripResult.cleanBlob,
        cleanDataUrl: stripResult.cleanDataUrl
      });

      if (saveRes.success) {
        setStatusMessage(`Clean copy saved successfully.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save clean copy';
      setErrorMessage(message);
    }
  };

  // Reset / Unload
  const handleReset = () => {
    setSelectedFile(null);
    setInspection(null);
    setStripResult(null);
    setErrorMessage(null);
    setStatusMessage(null);
    if (onFileLoadedChange) onFileLoadedChange(false);
  };

  return (
    <div id="metadata-tool-view" className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            Metadata Inspection & Stripping Tool
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Isolated Service: Reads embedded document tags and creates sanitized copies
          </p>
        </div>

        {selectedFile && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Select Different File
          </button>
        )}
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-slate-200">Metadata Isolation Policy</div>
          <p className="text-slate-400 leading-relaxed">
            This tool operates strictly on the selected document. It does not convert file formats, perform OCR,
            or alter the active conversion queue. Removing metadata creates a separate cleaned copy (e.g.{' '}
            <span className="font-mono text-cyan-300">document_clean.pdf</span>) without overwriting your original.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* SECTION 1: INPUT FILE SELECTION */}
      {!selectedFile ? (
        <div
          id="metadata-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectFile}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-700/80 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900/80'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400 mb-4">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            SELECT FILE FOR METADATA INSPECTION
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Click to browse or drop an individual PDF, DOCX, XLSX, or image file
          </p>
          <div className="mt-4 inline-block px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-400">
            Dedicated Single-Document Sanitizer
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 font-mono">
                {selectedFile.name}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {inspection?.formattedSize || `${Math.round(selectedFile.size / 1024)} KB`} •{' '}
                {inspection?.mimeType || selectedFile.type}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              {inspection ? `${inspection.detectedCount} Properties Detected` : 'Inspecting...'}
            </span>
          </div>
        </div>
      )}

      {/* SECTION 2: METADATA INFORMATION TABLE */}
      {selectedFile && inspection && (
        <section aria-label="Detected Metadata Table" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Detected Metadata
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                ({inspection.strippableCount} strippable tags)
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Strippable Tag
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Container Attribute
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Property</th>
                  <th className="py-2.5 px-4 font-semibold">Value</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Removal Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inspection.properties.map((prop) => (
                  <tr key={prop.key} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 text-slate-300 font-medium">
                      {prop.label}
                    </td>
                    <td className="py-2.5 px-4 text-cyan-300 truncate max-w-xs">
                      {prop.value}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 capitalize">
                      {prop.category}
                    </td>
                    <td className="py-2.5 px-4">
                      {prop.canBeStripped ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/60">
                          Strippable
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                          Preserved (Core)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action: REMOVE METADATA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200 block">Sanitization Process</span>
              Stripping metadata purges creator names, revision history, and GPS/camera tags while leaving document text intact.
            </div>

            <button
              id="btn-remove-metadata"
              type="button"
              disabled={isStripping}
              onClick={handleRemoveMetadata}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-rose-900/20 active:scale-[0.99] shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isStripping ? 'STRIPPING METADATA...' : 'REMOVE METADATA'}</span>
            </button>
          </div>
        </section>
      )}

      {/* SECTION 3: CLEANED COPY RESULT & SAVE */}
      {stripResult && (
        <section aria-label="Cleaned Copy Result" className="p-5 rounded-xl bg-slate-900 border border-emerald-800/60 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <FileCheck2 className="w-5 h-5" />
            <h3 className="text-sm font-bold tracking-tight">
              Clean Document Copy Created
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {stripResult.notice}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Original File</span>
              <span className="text-slate-200 font-semibold">{stripResult.originalFileName}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-900/60">
              <span className="text-emerald-400 block text-[11px]">Sanitized Clean File</span>
              <span className="text-emerald-300 font-semibold">{stripResult.cleanFileName}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="text-slate-400 font-semibold">Removed Tags ({stripResult.strippedFields.length}):</div>
            <div className="flex flex-wrap gap-1.5">
              {stripResult.strippedFields.map((field) => (
                <span key={field} className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-[10px]">
                  ✓ {field}
                </span>
              ))}
            </div>
          </div>

          {/* Action: SAVE CLEAN COPY */}
          <div className="flex justify-end pt-2">
            <button
              id="btn-save-clean-copy"
              type="button"
              onClick={handleSaveCleanCopy}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
            >
              <Download className="w-4 h-4" />
              <span>SAVE CLEAN COPY</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
