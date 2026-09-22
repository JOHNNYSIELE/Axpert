@echo off
chcp 65001 >nul
title AXpert System - Windows Desktop Installer
cls
echo ======================================================================
echo                AXPERT SYSTEM - DESKTOP SUITE INSTALLER
echo ======================================================================
echo.
echo Installing AXpert Desktop Suite to:
echo   C:\Users\Admin\Desktop\PP\AXpert System
echo.

set "TARGET_DIR=C:\Users\Admin\Desktop\PP\AXpert System"

echo [1/3] Preparing target directory...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [2/3] Copying application files and binaries...
xcopy /E /Y /I /Q "%~dp0*" "%TARGET_DIR%\" >nul

echo [3/3] Creating Windows Desktop Shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\AXpert System.lnk'); $Shortcut.TargetPath = '%TARGET_DIR%\AXpert.exe'; $Shortcut.WorkingDirectory = '%TARGET_DIR%'; $Shortcut.Description = 'AXpert Desktop Suite'; $Shortcut.Save()"

echo.
echo ======================================================================
echo                  INSTALLATION COMPLETED SUCCESSFULLY!
echo ======================================================================
echo Location : %TARGET_DIR%
echo Executable: %TARGET_DIR%\AXpert.exe
echo Shortcut  : Desktop\AXpert System.lnk
echo ======================================================================
echo.
echo Launching AXpert System...
start "" "%TARGET_DIR%\AXpert.exe"
timeout /t 3 >nul
exit
