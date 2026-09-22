/**
 * @file scripts/package-desktop.js
 * Automated Desktop Packaging Script for AXpert System.
 * Packages the built React + Vite application with the Electron Windows x64 runtime,
 * producing AXpert.exe, Windows installer batch, desktop shortcuts, and downloadable ZIP.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const cacheDir = path.join(rootDir, '.cache');
const releaseDir = path.join(rootDir, 'release');
const winAppDir = path.join(releaseDir, 'AXpert-win32-x64');
const targetWindowsDir = path.join(rootDir, 'C:\\Users\\Admin\\Desktop\\PP\\AXpert System');
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');
const zipSourceUrl = 'https://github.com/electron/electron/releases/download/v30.0.0/electron-v30.0.0-win32-x64.zip';
const cachedZipPath = path.join(cacheDir, 'electron-v30.0.0-win32-x64.zip');

function log(msg) {
  console.log(`[AXpert Packager] ${msg}`);
}

async function packageDesktopApp() {
  log('Starting AXpert Desktop Packaging Pipeline...');

  // 1. Ensure dist is built
  log('Step 1: Building production web bundle via Vite...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Ensure cache directory exists and download electron binary if needed
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  if (!fs.existsSync(cachedZipPath)) {
    log(`Step 2: Downloading Electron Windows x64 runtime (${zipSourceUrl})...`);
    execSync(`curl -L -o "${cachedZipPath}" "${zipSourceUrl}"`, { stdio: 'inherit' });
  } else {
    log('Step 2: Using cached Electron Windows x64 runtime.');
  }

  // 3. Prepare release directory
  log('Step 3: Extracting runtime into release directory...');
  if (fs.existsSync(winAppDir)) {
    fs.rmSync(winAppDir, { recursive: true, force: true });
  }
  fs.mkdirSync(winAppDir, { recursive: true });

  execSync(`unzip -q "${cachedZipPath}" -d "${winAppDir}"`);

  // 4. Rename electron.exe to AXpert.exe
  const defaultExe = path.join(winAppDir, 'electron.exe');
  const axpertExe = path.join(winAppDir, 'AXpert.exe');
  if (fs.existsSync(defaultExe)) {
    fs.renameSync(defaultExe, axpertExe);
    log('Step 4: Renamed electron.exe to AXpert.exe');
  }

  // 5. Populate resources/app
  log('Step 5: Staging application payload in resources/app...');
  const appDir = path.join(winAppDir, 'resources', 'app');
  fs.mkdirSync(appDir, { recursive: true });

  // Embedded package.json (CommonJS)
  const appPackageJson = {
    name: 'axpert-system',
    productName: 'AXpert System',
    version: '2.4.0',
    description: 'AXpert - Desktop File & Media Suite',
    main: 'main.js',
    author: 'AXpert Desktop Team'
  };
  fs.writeFileSync(
    path.join(appDir, 'package.json'),
    JSON.stringify(appPackageJson, null, 2),
    'utf-8'
  );

  // Copy main process and preload scripts
  fs.copyFileSync(path.join(rootDir, 'main.js'), path.join(appDir, 'main.js'));
  fs.copyFileSync(path.join(rootDir, 'preload.js'), path.join(appDir, 'preload.js'));

  // Copy services directory
  copyRecursiveSync(path.join(rootDir, 'services'), path.join(appDir, 'services'));

  // Copy dist directory
  copyRecursiveSync(path.join(rootDir, 'dist'), path.join(appDir, 'dist'));

  // 6. Create Installer Batch Script (Install-AXpert.bat)
  log('Step 6: Creating Windows automated installer script (Install-AXpert.bat)...');
  const installerScript = `@echo off
chcp 65001 >nul
title AXpert System - Windows Desktop Installer
cls
echo ======================================================================
echo                AXPERT SYSTEM - DESKTOP SUITE INSTALLER
echo ======================================================================
echo.
echo Installing AXpert Desktop Suite to:
echo   C:\\Users\\Admin\\Desktop\\PP\\AXpert System
echo.

set "TARGET_DIR=C:\\Users\\Admin\\Desktop\\PP\\AXpert System"

echo [1/3] Preparing target directory...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [2/3] Copying application files and binaries...
xcopy /E /Y /I /Q "%~dp0*" "%TARGET_DIR%\\" >nul

echo [3/3] Creating Windows Desktop Shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\AXpert System.lnk'); $Shortcut.TargetPath = '%TARGET_DIR%\\AXpert.exe'; $Shortcut.WorkingDirectory = '%TARGET_DIR%'; $Shortcut.Description = 'AXpert Desktop Suite'; $Shortcut.Save()"

echo.
echo ======================================================================
echo                  INSTALLATION COMPLETED SUCCESSFULLY!
echo ======================================================================
echo Location : %TARGET_DIR%
echo Executable: %TARGET_DIR%\\AXpert.exe
echo Shortcut  : Desktop\\AXpert System.lnk
echo ======================================================================
echo.
echo Launching AXpert System...
start "" "%TARGET_DIR%\\AXpert.exe"
timeout /t 3 >nul
exit
`;
  fs.writeFileSync(path.join(winAppDir, 'Install-AXpert.bat'), installerScript, 'utf-8');

  // Quick Launcher (Run-AXpert.bat)
  const launcherScript = `@echo off
start "" "%~dp0AXpert.exe"
exit
`;
  fs.writeFileSync(path.join(winAppDir, 'Run-AXpert.bat'), launcherScript, 'utf-8');

  // README Instructions
  const readmeText = `======================================================================
AXPERT SYSTEM - DESKTOP FILE & MEDIA SUITE (v2.4)
======================================================================

HOW TO RUN:
1. OPTION A (One-Click Installer):
   Double-click "Install-AXpert.bat"
   - Automatically installs to: C:\\Users\\Admin\\Desktop\\PP\\AXpert System
   - Creates a Desktop shortcut named "AXpert System"
   - Launches AXpert.exe immediately.

2. OPTION B (Standalone / Portable):
   Double-click "AXpert.exe" directly in this folder.

FEATURES INCLUDED:
- Multi-file Format Converter (PDF, Word, Excel, CSV, Images)
- Instant Client-Side PDF OCR (Export to TXT & DOCX)
- Soundtrack Demuxer (Video Audio Extractor)
- Forensic Document Metadata Inspector & Sanitizer
- Embedded Offline SQLite Engine & Account Management

======================================================================
`;
  fs.writeFileSync(path.join(winAppDir, 'README.txt'), readmeText, 'utf-8');

  // 7. Copy to local workspace destination folder "C:\Users\Admin\Desktop\PP\AXpert System"
  log(`Step 7: Copying to local workspace path "${targetWindowsDir}"...`);
  if (!fs.existsSync(targetWindowsDir)) {
    fs.mkdirSync(targetWindowsDir, { recursive: true });
  }
  copyRecursiveSync(winAppDir, targetWindowsDir);

  // 8. Generate downloadable ZIP package for the user
  log('Step 8: Compressing package into downloadable ZIP archive...');
  if (!fs.existsSync(publicDownloadsDir)) {
    fs.mkdirSync(publicDownloadsDir, { recursive: true });
  }

  const zipOutputPath = path.join(publicDownloadsDir, 'AXpert-Windows-x64.zip');
  const releaseZipPath = path.join(releaseDir, 'AXpert-Windows-x64.zip');

  if (fs.existsSync(releaseZipPath)) fs.unlinkSync(releaseZipPath);
  if (fs.existsSync(zipOutputPath)) fs.unlinkSync(zipOutputPath);

  // Use python3 zipfile to create the compressed archive directly from winAppDir
  execSync(
    `python3 -c "
import shutil
shutil.make_archive('${path.join(releaseDir, 'AXpert-Windows-x64')}', 'zip', '${winAppDir}')
"`,
    { stdio: 'inherit' }
  );

  if (fs.existsSync(releaseZipPath)) {
    fs.copyFileSync(releaseZipPath, zipOutputPath);
    const stats = fs.statSync(zipOutputPath);
    log(`Generated downloadable ZIP: ${zipOutputPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
  }

  log('======================================================================');
  log('AXpert Desktop Packaging Completed Successfully!');
  log(`Windows Executable: ${axpertExe}`);
  log(`Installer: ${path.join(winAppDir, 'Install-AXpert.bat')}`);
  log(`Target Folder Copied: ${targetWindowsDir}`);
  log(`Downloadable ZIP: /downloads/AXpert-Windows-x64.zip`);
  log('======================================================================');
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

packageDesktopApp().catch((err) => {
  console.error('[AXpert Packager Error]', err);
  process.exit(1);
});
