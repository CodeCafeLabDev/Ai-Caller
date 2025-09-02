@echo off
echo ========================================
echo    AI Caller Backend Startup Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found
    echo Please copy env.example to .env and configure your settings
    echo.
    echo Creating .env from template...
    copy env.example .env
    echo.
    echo Please edit .env file with your actual configuration values
    echo Then run this script again
    pause
    exit /b 1
)

echo Environment file found: .env
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully
    echo.
) else (
    echo Dependencies already installed
    echo.
)

REM Start the server
echo Starting AI Caller Backend Server...
echo.
echo Server will be available at: http://localhost:5000
echo Health check: http://localhost:5000/api/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm start

pause