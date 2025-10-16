@echo off
REM ETX Processor - Windows Start Script
REM This script starts both the backend and frontend services on Windows

setlocal enabledelayedexpansion

echo 🚀 Starting ETX Processor on Windows...

REM Colors for output (Windows doesn't support ANSI colors in batch, so we'll use text)
set "RED=[ERROR]"
set "GREEN=[SUCCESS]"
set "YELLOW=[WARNING]"
set "BLUE=[INFO]"

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Check if we're in the right directory
if not exist "backend" (
    echo %RED% ❌ backend directory not found. Please run this script from the project root directory
    pause
    exit /b 1
)
if not exist "frontend" (
    echo %RED% ❌ frontend directory not found. Please run this script from the project root directory
    pause
    exit /b 1
)

echo %GREEN% 🎯 ETX Processor - Windows Development Environment
echo %GREEN% ================================================

REM Function to check if a port is in use
call :check_port 8000
if !errorlevel! equ 0 (
    echo %YELLOW% ⚠️  Port 8000 is already in use. Backend might already be running.
) else (
    call :start_backend
)

call :check_port 8888
if !errorlevel! equ 0 (
    echo %YELLOW% ⚠️  Port 8888 is already in use. Frontend might already be running.
) else (
    call :start_frontend
)

REM Wait for services to be ready
call :wait_for_services

echo %GREEN% 🎉 ETX Processor is now running!
echo %GREEN% ================================
echo %BLUE% Backend API:  http://127.0.0.1:8000
echo %BLUE% Frontend UI:  http://localhost:8888
echo %BLUE% API Docs:     http://127.0.0.1:8000/docs
echo.
echo %YELLOW% 📝 Logs:
echo %YELLOW%   Backend:  type backend.log
echo %YELLOW%   Frontend: type frontend.log
echo.
echo %YELLOW% 🛑 To stop: window_stop.bat
echo %YELLOW% 🔄 To restart: window_restart.bat
echo.
echo Press any key to continue...
pause >nul
goto :eof

REM Function to check if a port is in use
:check_port
set "port=%1"
netstat -an | findstr ":%port% " | findstr "LISTENING" >nul
if !errorlevel! equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Function to start backend
:start_backend
echo %BLUE% 📦 Starting Backend...

cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo %YELLOW% ⚠️  Virtual environment not found. Creating one...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if requirements.txt exists
if not exist "requirements.txt" (
    echo %RED% ❌ requirements.txt not found in backend directory
    pause
    exit /b 1
)

echo %BLUE% 📥 Installing backend dependencies...
pip install -r requirements.txt

echo %BLUE% 🗄️  Running database migrations...
alembic upgrade head

echo %BLUE% 🔧 Starting FastAPI server...
start "ETX Backend" /min cmd /c "call venv\Scripts\activate.bat && python -m uvicorn main:app --host 127.0.0.1 --port 8000 > ..\backend.log 2>&1"

REM Wait a moment for the process to start
timeout /t 2 /nobreak >nul

echo %GREEN% ✅ Backend started successfully on http://127.0.0.1:8000

cd ..
goto :eof

REM Function to start frontend
:start_frontend
echo %BLUE% 🎨 Starting Frontend...

cd frontend

REM Check if package.json exists
if not exist "package.json" (
    echo %RED% ❌ package.json not found in frontend directory
    pause
    exit /b 1
)

echo %BLUE% 📥 Installing frontend dependencies...
call npm install

echo %BLUE% 🔧 Starting Next.js development server...
start "ETX Frontend" /min cmd /c "set PORT=8888 && npm run dev > ..\frontend.log 2>&1"

REM Wait a moment for the process to start
timeout /t 2 /nobreak >nul

echo %GREEN% ✅ Frontend started successfully on http://localhost:8888

cd ..
goto :eof

REM Function to wait for services to be ready
:wait_for_services
echo %BLUE% ⏳ Waiting for services to be ready...

REM Wait for backend
for /l %%i in (1,1,30) do (
    curl -s http://127.0.0.1:8000/health >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN% ✅ Backend is ready
        goto :backend_ready
    )
    timeout /t 1 /nobreak >nul
)
echo %RED% ❌ Backend failed to start within 30 seconds
pause
exit /b 1

:backend_ready

REM Wait for frontend
for /l %%i in (1,1,30) do (
    curl -s http://localhost:8888 >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN% ✅ Frontend is ready
        goto :frontend_ready
    )
    timeout /t 1 /nobreak >nul
)
echo %RED% ❌ Frontend failed to start within 30 seconds
pause
exit /b 1

:frontend_ready
goto :eof
