/**
 * @file src/services/converter.ts
 * Client/Simulation Conversion Engine.
 * Matches backend converter.js API and architecture for web preview and testing.
 */

import { ConversionJobPayload, ConversionProgressEvent, ConversionCompleteEvent } from '../types';
import { generateConvertedFileName } from './fileService';
import { engineTelemetry } from './engineTelemetry';

type ProgressListener = (event: ConversionProgressEvent) => void;
type CompleteListener = (event: ConversionCompleteEvent) => void;

class ClientConverterService {
  private activeJobs: Map<string, { cancelled: boolean; timerIds: NodeJS.Timeout[] }> = new Map();
  private progressListeners: Set<ProgressListener> = new Set();
  private completeListeners: Set<CompleteListener> = new Set();

  onProgress(callback: ProgressListener): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  onComplete(callback: CompleteListener): () => void {
    this.completeListeners.add(callback);
    return () => this.completeListeners.delete(callback);
  }

  startConversion(job: ConversionJobPayload): { jobId: string } {
    const { jobId, fileId, fileName, outputFormat, options } = job;

    if (this.activeJobs.has(jobId)) {
      throw new Error(`Job ${jobId} is already running.`);
    }

    const state = { cancelled: false, timerIds: [] as NodeJS.Timeout[] };
    this.activeJobs.set(jobId, state);

    engineTelemetry.addLog(
      'CONVERTER',
      'info',
      `Queued job ${jobId.substring(0, 8)}: "${fileName}" -> ${outputFormat.toUpperCase()}`
    );

    // Build stage plan based on user options
    const stages: Array<{ progress: number; label: string }> = [
      { progress: 12, label: 'Initializing conversion pipeline & verifying checksums' },
      { progress: 28, label: 'Decoding input container & parsing stream topology' }
    ];

    if (options.ocr) {
      stages.push({ progress: 42, label: 'Running OCR neural text extraction on raster layers' });
    }

    if (options.tableExtraction) {
      stages.push({ progress: 58, label: 'Isolating cell bounds & structured table extraction' });
    }

    if (options.metadataStripper) {
      stages.push({ progress: 72, label: 'Stripping embedded EXIF, XMP, and author tags' });
    }

    stages.push(
      { progress: 85, label: `Encoding target format (${outputFormat.toUpperCase()})` },
      { progress: 96, label: 'Flushing target stream & verifying output integrity' },
      { progress: 100, label: 'Conversion complete' }
    );

    let stageIndex = 0;
    const intervalTime = 320;

    const runNextStage = () => {
      if (state.cancelled) {
        this.activeJobs.delete(jobId);
        engineTelemetry.addLog('CONVERTER', 'warn', `Job ${jobId.substring(0, 8)} cancelled.`);
        return;
      }

      if (stageIndex < stages.length) {
        const stage = stages[stageIndex];
        const progressEvent: ConversionProgressEvent = {
          jobId,
          fileId,
          progress: stage.progress,
          stage: stage.label
        };

        this.progressListeners.forEach((fn) => fn(progressEvent));
        stageIndex++;

        const timer = setTimeout(runNextStage, intervalTime);
        state.timerIds.push(timer);
      } else {
        // Completed
        this.activeJobs.delete(jobId);
        const outputFileName = generateConvertedFileName(fileName, outputFormat);

        // Generate a real downloadable file
        const mockBlob = this.createConvertedBlob(outputFileName, outputFormat, fileName, options);
        const outputDataUrl = URL.createObjectURL(mockBlob);
        engineTelemetry.registerBlob(outputDataUrl, mockBlob);
        engineTelemetry.recordJobCompletion(job.fileSize || mockBlob.size);
        engineTelemetry.addLog(
          'CONVERTER',
          'success',
          `Successfully converted "${fileName}" -> "${outputFileName}" (${(mockBlob.size / 1024).toFixed(1)} KB)`
        );

        const completeEvent: ConversionCompleteEvent = {
          jobId,
          fileId,
          success: true,
          outputFileName,
          outputDataUrl,
          convertedSize: mockBlob.size
        };

        this.completeListeners.forEach((fn) => fn(completeEvent));
      }
    };

    const initialTimer = setTimeout(runNextStage, 50);
    state.timerIds.push(initialTimer);

    return { jobId };
  }

  cancelConversion(jobId: string): boolean {
    const state = this.activeJobs.get(jobId);
    if (!state) return false;

    state.cancelled = true;
    state.timerIds.forEach((t) => clearTimeout(t));
    this.activeJobs.delete(jobId);
    engineTelemetry.addLog('CONVERTER', 'warn', `Conversion cancelled for job: ${jobId}`);
    return true;
  }

  private createConvertedBlob(
    outputFileName: string,
    format: string,
    originalName: string,
    options: ConversionJobPayload['options']
  ): Blob {
    const cleanFormat = format.toLowerCase();
    const timestamp = new Date().toISOString();

    if (cleanFormat === 'pdf') {
      const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Title (${outputFileName}) /Producer (AXpert Desktop Suite) /CreationDate (D:${timestamp.replace(/[-:TZ]/g, '')}) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n5 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 18 Tf\n50 720 Td\n(CONVERTED DOCUMENT: ${originalName}) Tj\n0 -30 Td\n/F1 12 Tf\n(Converted by AXpert Desktop Suite) Tj\n0 -20 Td\n(Options: OCR=${options.ocr}, Tables=${options.tableExtraction}, Strip=${options.metadataStripper}) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000140 00000 n\n0000000187 00000 n\n0000000244 00000 n\n0000000331 00000 n\ntrailer\n<< /Size 6 /Root 2 0 R /Info 1 0 R >>\nstartxref\n520\n%%EOF`;
      return new Blob([pdfContent], { type: 'application/pdf' });
    }

    if (cleanFormat === 'csv') {
      const csvContent = `Index,Source_File,Target_Format,Timestamp,OCR_Applied,Tables_Extracted,Metadata_Stripped\n1,"${originalName}","${format}","${timestamp}",${options.ocr},${options.tableExtraction},${options.metadataStripper}\n`;
      return new Blob([csvContent], { type: 'text/csv' });
    }

    // Default text document
    const textContent = `AXPERT DESKTOP SUITE EXPORT\n===============================\nSource File: ${originalName}\nTarget Format: ${format.toUpperCase()}\nTimestamp: ${timestamp}\nOptions Applied:\n- OCR Text Extraction: ${options.ocr}\n- Structured Table Extraction: ${options.tableExtraction}\n- Metadata Stripper: ${options.metadataStripper}\n\n[Status: Verified by AXpert Desktop IPC Pipeline]`;
    return new Blob([textContent], { type: 'text/plain' });
  }
}

export const clientConverterService = new ClientConverterService();

