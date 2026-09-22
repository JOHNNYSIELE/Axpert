/**
 * @file services/fileService.js
 * Core file utility operations for desktop file converter.
 * Handles size formatting, extension normalization, MIME types, and clean naming.
 */

const MIME_MAP = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv',
  txt: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  json: 'application/json',
  html: 'text/html',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg'
};

function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) return '';
  return filename.substring(lastDotIndex + 1).toLowerCase();
}

function getBaseFileName(filename) {
  if (!filename || typeof filename !== 'string') return 'unnamed';
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) return filename;
  return filename.substring(0, lastDotIndex);
}

function getMimeType(filename) {
  const ext = getFileExtension(filename);
  return MIME_MAP[ext] || 'application/octet-stream';
}

function generateCleanFileName(originalName, targetExt) {
  const base = getBaseFileName(originalName);
  const ext = targetExt ? targetExt.replace(/^\./, '').toLowerCase() : getFileExtension(originalName);
  return `${base}_clean.${ext || 'pdf'}`;
}

function generateConvertedFileName(originalName, targetFormat) {
  const base = getBaseFileName(originalName);
  const cleanExt = targetFormat.replace(/^\./, '').toLowerCase();
  return `${base}_converted.${cleanExt}`;
}

module.exports = {
  formatFileSize,
  getFileExtension,
  getBaseFileName,
  getMimeType,
  generateCleanFileName,
  generateConvertedFileName,
  MIME_MAP
};
