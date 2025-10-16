@echo off
REM ETX Processor - Windows Stop Script
REM This script stops both the backend and frontend services on Windows

setlocal enabledelayedexpansion

echo 🛑 Stopping ETX Processor...

REM Colors for output
set "RED=[ERROR]"
set "GREEN=[SUCCESS]"
set "YELLOW=[WARNING]"
set "BLUE=[INFO]"

echo %BLUE% 🛑 Stopping Backend...
REM Kill processes by window title
taskkill /f /fi "WINDOWTITLE eq ETX Backend*" >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN% ✅ Backend stopped
) else (
    echo %YELLOW% ⚠️  Backend was not running
)

echo %BLUE% 🛑 Stopping Frontend...
taskkill /f /fi "WINDOWTITLE eq ETX Frontend*" >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN% ✅ Frontend stopped
) else (
    echo %YELLOW% ⚠️  Frontend was not running
)

REM Also kill by port (backup method)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8888" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo %GREEN% ✅ All services stopped!
echo.
echo Press any key to continue...
pause >nul
