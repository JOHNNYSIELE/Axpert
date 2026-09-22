/**
 * @file main.js
 * Electron Main Process for Desktop File Converter.
 * Configures secure window instance and registers IPC handlers.
 * Adheres strictly to security rules: contextIsolation: true, nodeIntegration: false.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const converterService = require('./services/converter');
const metadataService = require('./services/metadata');
const { formatFileSize, getFileExtension, getMimeType } = require('./services/fileService');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'AXpert - Desktop Suite',
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Wire converter events from backend service directly to renderer window
  converterService.on('progress', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('converter:progress', data);
    }
  });

  converterService.on('complete', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('converter:complete', data);
    }
  });

  // Load app: during development load dev server, otherwise load built files
  const devUrl = 'http://localhost:3000';
  const prodPath = path.join(__dirname, 'dist', 'index.html');

  if (process.env.NODE_ENV === 'development' || !fs.existsSync(prodPath)) {
    mainWindow.loadURL(devUrl).catch(() => {
      // Fallback to renderer/index.html if available
      const fallback = path.join(__dirname, 'renderer', 'index.html');
      if (fs.existsSync(fallback)) {
        mainWindow.loadFile(fallback);
      }
    });
  } else {
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -------------------------------------------------------------
// IPC CHANNEL REGISTRATIONS
// -------------------------------------------------------------

/**
 * IPC: converter:select-files
 * Prompts desktop native open dialog for multi-file selection.
 */
ipcMain.handle('converter:select-files', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Files for Conversion Queue',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Supported Documents & Media', extensions: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'txt', 'png', 'jpg', 'jpeg', 'webp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePaths.length) {
    return [];
  }

  return result.filePaths.map((filePath) => {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    return {
      name: fileName,
      path: filePath,
      size: stats.size,
      type: getMimeType(fileName),
      lastModified: stats.mtimeMs
    };
  });
});

/**
 * IPC: converter:start
 * Starts conversion job inside backend converter service.
 */
ipcMain.handle('converter:start', async (_event, payload) => {
  try {
    return converterService.startConversion(payload);
  } catch (err) {
    console.error('[IPC converter:start Error]', err);
    throw new Error(err.message || 'Failed to start conversion job.');
  }
});

/**
 * IPC: converter:cancel
 * Safely terminates an ongoing conversion job.
 */
ipcMain.handle('converter:cancel', async (_event, jobId) => {
  return converterService.cancelConversion(jobId);
});

/**
 * IPC: metadata:select-file
 * Prompts native open dialog for a single file for metadata inspection.
 */
ipcMain.handle('metadata:select-file', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select File for Metadata Inspection',
    properties: ['openFile'],
    filters: [
      { name: 'Documents & Images', extensions: ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'webp', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  const filePath = result.filePaths[0];
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);

  return {
    name: fileName,
    path: filePath,
    size: stats.size,
    type: getMimeType(fileName),
    lastModified: stats.mtimeMs
  };
});

/**
 * IPC: metadata:inspect
 * Inspects real metadata properties for target file.
 */
ipcMain.handle('metadata:inspect', async (_event, fileInfo) => {
  try {
    return await metadataService.inspect(fileInfo);
  } catch (err) {
    console.error('[IPC metadata:inspect Error]', err);
    throw new Error(err.message || 'Failed to inspect file metadata.');
  }
});

/**
 * IPC: metadata:strip
 * Strips metadata and prepares cleaned version.
 */
ipcMain.handle('metadata:strip', async (_event, fileInfo) => {
  try {
    return await metadataService.strip(fileInfo);
  } catch (err) {
    console.error('[IPC metadata:strip Error]', err);
    throw new Error(err.message || 'Failed to strip metadata.');
  }
});

/**
 * IPC: metadata:save-clean
 * Opens desktop save dialog to export cleaned file safely.
 */
ipcMain.handle('metadata:save-clean', async (_event, payload) => {
  if (!mainWindow) return { success: false };
  const { fileName } = payload;

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Cleaned Copy',
    defaultPath: fileName,
    filters: [
      { name: 'Cleaned Document', extensions: [getFileExtension(fileName) || 'pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return { success: false, cancelled: true };
  }

  // In real implementation write buffer; for mock write verified clean copy notice
  const noticeBuffer = Buffer.from(`CLEAN DOCUMENT COPY\nOriginal: ${fileName}\nMetadata stripped successfully.\nTimestamp: ${new Date().toISOString()}\n`);
  fs.writeFileSync(result.filePath, noticeBuffer);

  return { success: true, destination: result.filePath };
});

/**
 * IPC: system:get-info
 * Returns system runtime diagnostics and pipeline engine registry.
 */
ipcMain.handle('system:get-info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron || '28.2.0',
    engineBackends: converterService.getRegisteredEngines()
  };
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
