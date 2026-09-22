/**
 * @file src/lib/ipcBridge.ts
 * Unified IPC Client Bridge.
 * Delegates directly to native window.electronAPI when running inside Electron.
 * Transparently falls back to client-side services when running in the web browser preview.
 */

import {
  IElectronAPI,
  ConversionJobPayload,
  ConversionProgressEvent,
  ConversionCompleteEvent,
  MetadataInspectionResult,
  MetadataStripResult,
  SystemInfo
} from '../types';
import { clientConverterService } from '../services/converter';
import { clientMetadataService } from '../services/metadata';
import { getMimeType } from '../services/fileService';

class IPCBridge implements IElectronAPI {
  private isNativeElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }

  async selectFiles(): Promise<Array<{ name: string; path: string; size: number; type: string; file?: File }>> {
    if (this.isNativeElectron()) {
      return window.electronAPI!.selectFiles();
    }

    // Web fallback: native file input trigger
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = () => {
        if (!input.files || input.files.length === 0) {
          resolve([]);
          return;
        }

        const files = Array.from(input.files).map((f) => ({
          name: f.name,
          path: f.name,
          size: f.size,
          type: f.type || getMimeType(f.name),
          file: f
        }));
        resolve(files);
      };
      input.click();
    });
  }

  async startConversion(payload: ConversionJobPayload): Promise<{ jobId: string }> {
    if (this.isNativeElectron()) {
      return window.electronAPI!.startConversion(payload);
    }
    return clientConverterService.startConversion(payload);
  }

  async cancelConversion(jobId: string): Promise<boolean> {
    if (this.isNativeElectron()) {
      return window.electronAPI!.cancelConversion(jobId);
    }
    return clientConverterService.cancelConversion(jobId);
  }

  onConversionProgress(callback: (data: ConversionProgressEvent) => void): () => void {
    if (this.isNativeElectron()) {
      return window.electronAPI!.onConversionProgress(callback);
    }
    return clientConverterService.onProgress(callback);
  }

  onConversionComplete(callback: (data: ConversionCompleteEvent) => void): () => void {
    if (this.isNativeElectron()) {
      return window.electronAPI!.onConversionComplete(callback);
    }
    return clientConverterService.onComplete(callback);
  }

  async selectMetadataFile(): Promise<{ name: string; path: string; size: number; type: string; file?: File } | null> {
    if (this.isNativeElectron()) {
      return window.electronAPI!.selectMetadataFile();
    }

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = false;
      input.onchange = () => {
        if (!input.files || input.files.length === 0) {
          resolve(null);
          return;
        }
        const f = input.files[0];
        resolve({
          name: f.name,
          path: f.name,
          size: f.size,
          type: f.type || getMimeType(f.name),
          file: f
        });
      };
      input.click();
    });
  }

  async inspectMetadata(file: {
    name: string;
    path?: string;
    size: number;
    type: string;
    file?: File;
  }): Promise<MetadataInspectionResult> {
    if (this.isNativeElectron()) {
      return window.electronAPI!.inspectMetadata(file);
    }
    return clientMetadataService.inspect(file);
  }

  async stripMetadata(file: {
    name: string;
    path?: string;
    size: number;
    type: string;
    file?: File;
  }): Promise<MetadataStripResult> {
    if (this.isNativeElectron()) {
      return window.electronAPI!.stripMetadata(file);
    }
    return clientMetadataService.strip(file);
  }

  async saveCleanFile(payload: {
    fileName: string;
    blob?: Blob;
    cleanDataUrl?: string;
  }): Promise<{ success: boolean; destination?: string }> {
    if (this.isNativeElectron()) {
      return window.electronAPI!.saveCleanFile(payload);
    }

    // Web trigger download
    try {
      const link = document.createElement('a');
      link.download = payload.fileName;
      link.href = payload.cleanDataUrl || (payload.blob ? URL.createObjectURL(payload.blob) : '#');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, destination: `Downloads/${payload.fileName}` };
    } catch {
      return { success: false };
    }
  }

  async getSystemInfo(): Promise<SystemInfo> {
    if (this.isNativeElectron()) {
      return window.electronAPI!.getSystemInfo();
    }

    return {
      platform: 'win32',
      arch: 'x64',
      nodeVersion: 'v22.14.0',
      electronVersion: 'v28.2.0',
      engineBackends: [
        {
          name: 'PDF Pipeline (LibreOffice / Ghostscript / PDFKit)',
          type: 'Document & Vector',
          status: 'ready',
          description: 'High-fidelity document rendering and postscript translation'
        },
        {
          name: 'Tesseract OCR Neural Engine',
          type: 'OCR Extraction',
          status: 'ready',
          description: 'Layered text extraction from scanned bitmaps and raster images'
        },
        {
          name: 'Tabula / Camelot Table Extractor',
          type: 'Structured Table',
          status: 'ready',
          description: 'Bounding-box coordinate isolation for CSV and XLSX export'
        },
        {
          name: 'FFmpeg Media Transcoder',
          type: 'Audio / Video',
          status: 'standby',
          description: 'Extensible container remuxing and audio/video transcode'
        },
        {
          name: 'ExifTool / Metadata Stripper',
          type: 'Sanitization',
          status: 'ready',
          description: 'Lossless removal of XMP, EXIF, author tags, and GPS coordinates'
        }
      ]
    };
  }
}

export const ipc = new IPCBridge();
