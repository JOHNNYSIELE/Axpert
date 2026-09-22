/**
 * @file preload.js
 * Secure Electron Preload Script.
 * Bridges renderer with main process via contextBridge.
 * Strict adherence to Electron security recommendations:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - No direct exposure of Node.js modules or unrestricted ipcRenderer
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Triggers native file selection dialog for conversion queue
   */
  selectFiles: () => ipcRenderer.invoke('converter:select-files'),

  /**
   * Starts a conversion job in the main process
   */
  startConversion: (payload) => ipcRenderer.invoke('converter:start', payload),

  /**
   * Safely cancels an active conversion job
   */
  cancelConversion: (jobId) => ipcRenderer.invoke('converter:cancel', jobId),

  /**
   * Subscribes to conversion progress events emitted by the main process
   */
  onConversionProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('converter:progress', handler);
    // Return unsubscribe function
    return () => ipcRenderer.removeListener('converter:progress', handler);
  },

  /**
   * Subscribes to conversion completion events emitted by the main process
   */
  onConversionComplete: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('converter:complete', handler);
    // Return unsubscribe function
    return () => ipcRenderer.removeListener('converter:complete', handler);
  },

  /**
   * Triggers native file selection dialog for single file metadata tool
   */
  selectMetadataFile: () => ipcRenderer.invoke('metadata:select-file'),

  /**
   * Inspects metadata for a selected file via metadata service
   */
  inspectMetadata: (fileInfo) => ipcRenderer.invoke('metadata:inspect', fileInfo),

  /**
   * Strips metadata from file and prepares clean copy
   */
  stripMetadata: (fileInfo) => ipcRenderer.invoke('metadata:strip', fileInfo),

  /**
   * Triggers desktop native save dialog to save cleaned file copy
   */
  saveCleanFile: (payload) => ipcRenderer.invoke('metadata:save-clean', payload),

  /**
   * Retrieves host runtime diagnostics and registered engine pipelines
   */
  getSystemInfo: () => ipcRenderer.invoke('system:get-info')
});
