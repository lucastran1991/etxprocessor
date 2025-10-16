@echo off
REM ETX Processor - Windows Restart Script
REM This script restarts both the backend and frontend services on Windows

setlocal enabledelayedexpansion

echo 🔄 Restarting ETX Processor on Windows...

REM Colors for output
set "RED=[ERROR]"
set "GREEN=[SUCCESS]"
set "YELLOW=[WARNING]"
set "BLUE=[INFO]"

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo %GREEN% 🔄 ETX Processor - Restarting Services
echo %GREEN% =====================================

REM Stop services first
echo %BLUE% 🛑 Stopping services...
if exist "window_stop.bat" (
    call window_stop.bat
) else (
    echo %RED% ❌ window_stop.bat not found
    pause
    exit /b 1
)

REM Wait a moment for processes to fully stop
echo %BLUE% ⏳ Waiting for processes to stop...
timeout /t 3 /nobreak >nul

REM Start services
echo %BLUE% 🚀 Starting services...
if exist "window_start.bat" (
    call window_start.bat
) else (
    echo %RED% ❌ window_start.bat not found
    pause
    exit /b 1
)

echo %GREEN% ✅ Restart completed!
pause
