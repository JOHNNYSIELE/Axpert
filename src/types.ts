export type QueueItemStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface FileQueueItem {
  id: string;
  name: string;
  type: string;
  size: number;
  formattedSize: string;
  status: QueueItemStatus;
  progress: number;
  stage?: string;
  file?: File;
  path?: string;
  errorMessage?: string;
  outputFormat: string;
  downloadUrl?: string;
  convertedBlob?: Blob;
  processedSize?: number;
  completedAt?: string;
}

export interface AdvancedConversionOptions {
  ocr: boolean;
  tableExtraction: boolean;
  metadataStripper: boolean;
}

export interface ConversionJobPayload {
  jobId: string;
  fileId: string;
  fileName: string;
  filePath?: string;
  fileSize: number;
  inputFormat: string;
  outputFormat: string;
  options: AdvancedConversionOptions;
}

export interface ConversionProgressEvent {
  jobId: string;
  fileId: string;
  progress: number;
  stage: string;
}

export interface ConversionCompleteEvent {
  jobId: string;
  fileId: string;
  success: boolean;
  outputFileName?: string;
  outputDataUrl?: string;
  error?: string;
  convertedSize?: number;
}

export interface MetadataProperty {
  key: string;
  label: string;
  value: string;
  category: 'general' | 'document' | 'technical' | 'security';
  canBeStripped: boolean;
}

export interface MetadataInspectionResult {
  fileName: string;
  filePath?: string;
  fileSize: number;
  formattedSize: string;
  mimeType: string;
  properties: MetadataProperty[];
  detectedCount: number;
  strippableCount: number;
  canInspectFully: boolean;
  warning?: string;
}

export interface MetadataStripResult {
  success: boolean;
  originalFileName: string;
  cleanFileName: string;
  strippedFields: string[];
  preservedFields: string[];
  cleanBlob?: Blob;
  cleanDataUrl?: string;
  cleanSize?: number;
  notice: string;
}

// Audio Extraction Types
export interface AudioExtractionOptions {
  format: 'wav' | 'mp3' | 'aac' | 'flac' | 'ogg';
  bitrate: '128k' | '192k' | '320k' | 'pcm16';
  channels: 1 | 2;
  sampleRate: 44100 | 48000;
  normalize: boolean;
}

export interface AudioExtractionResult {
  success: boolean;
  sourceFileName: string;
  sourceFileSize: number;
  outputFileName: string;
  audioBlob: Blob;
  audioUrl: string;
  format: string;
  durationSeconds: number;
  channels: number;
  sampleRate: number;
  outputSize: number;
  waveformPeaks: number[];
}

// Instant PDF OCR Types
export interface PdfOcrResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  pageCount: number;
  extractedText: string;
  wordCount: number;
  charCount: number;
  confidenceScore: number;
  txtBlob: Blob;
  txtUrl: string;
  docxBlob: Blob;
  docxUrl: string;
  durationMs: number;
  pages?: { pageNum: number; text: string; confidence: number }[];
}

// Engine Architecture & Telemetry Types
export interface EngineBenchmarkResult {
  name: string;
  subsystem: string;
  latencyMs: number;
  status: 'passed' | 'warning' | 'failed';
  details: string;
}

export interface EngineTelemetry {
  workerPoolSize: number;
  maxWorkerThreads: number;
  activeJobs: number;
  completedJobs: number;
  totalBytesProcessed: number;
  tempCacheBytes: number;
  processPriority: 'high' | 'normal' | 'power_save';
  hardwareConcurrency: number;
  platform: string;
  userAgent: string;
  hasWebAudio: boolean;
  hasWebAssembly: boolean;
  hasOffscreenCanvas: boolean;
}

export interface EngineLogEntry {
  id: string;
  timestamp: string;
  category: 'IPC' | 'CONVERTER' | 'AUDIO' | 'OCR' | 'METADATA';
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  elapsedMs?: number;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  engineBackends: {
    name: string;
    type: string;
    status: 'ready' | 'active' | 'standby';
    description: string;
  }[];
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'admin' | 'operator' | 'analyst' | 'guest';
  createdAt: string;
  lastLogin?: string;
  isGuest?: boolean;
}

export interface AuthSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  user?: AuthUser;
}

export interface AuthAuditLog {
  id: string;
  userId?: string;
  email?: string;
  eventType: 'REGISTER' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'DB_INIT';
  description: string;
  timestamp: string;
  ipAddress: string;
}

export interface SqliteTableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

export interface IElectronAPI {
  selectFiles: () => Promise<Array<{ name: string; path: string; size: number; type: string; file?: File }>>;
  startConversion: (payload: ConversionJobPayload) => Promise<{ jobId: string }>;
  cancelConversion: (jobId: string) => Promise<boolean>;
  onConversionProgress: (callback: (data: ConversionProgressEvent) => void) => () => void;
  onConversionComplete: (callback: (data: ConversionCompleteEvent) => void) => () => void;
  selectMetadataFile: () => Promise<{ name: string; path: string; size: number; type: string; file?: File } | null>;
  inspectMetadata: (file: { name: string; path?: string; size: number; type: string; file?: File }) => Promise<MetadataInspectionResult>;
  stripMetadata: (file: { name: string; path?: string; size: number; type: string; file?: File }) => Promise<MetadataStripResult>;
  saveCleanFile: (payload: { fileName: string; blob?: Blob; cleanDataUrl?: string }) => Promise<{ success: boolean; destination?: string }>;
  getSystemInfo: () => Promise<SystemInfo>;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
