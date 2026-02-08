@echo off
REM ================================================================
REM   HP Tech CRM - Automated Setup Script
REM ================================================================
REM   This script will set up the entire development environment
REM ================================================================

echo.
echo ================================================================
echo    HP Tech CRM - Automated Setup
echo ================================================================
echo.

REM Check Node.js
echo [1/7] Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)
echo [OK] Node.js is installed
node --version

REM Check npm
echo.
echo [2/7] Checking npm installation...
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    exit /b 1
)
echo [OK] npm is installed
npm --version

REM Check Docker
echo.
echo [3/7] Checking Docker installation...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Docker is not installed or not running!
    echo You can install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo Continuing without Docker...
) else (
    echo [OK] Docker is installed
    docker --version
)

REM Install root dependencies
echo.
echo [4/7] Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install root dependencies!
    exit /b 1
)
echo [OK] Root dependencies installed

REM Install backend dependencies
echo.
echo [5/7] Installing backend dependencies...
cd leadify-backend-main
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies!
    exit /b 1
)
cd ..
echo [OK] Backend dependencies installed

REM Install frontend dependencies
echo.
echo [6/7] Installing frontend dependencies...
cd leadify-frontend-main
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies!
    exit /b 1
)
cd ..
echo [OK] Frontend dependencies installed

REM Validate environment variables
echo.
echo [7/7] Validating environment variables...
node scripts\validate-env.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Environment validation failed!
    echo Please review and fix the issues above.
    echo.
) else (
    echo [OK] Environment variables validated
)

echo.
echo ================================================================
echo    Setup Complete!
echo ================================================================
echo.
echo Next steps:
echo   1. Review environment variables in:
echo      - leadify-backend-main\.env
echo      - leadify-frontend-main\.env
echo.
echo   2. Start Docker containers:
echo      npm run docker:up
echo.
echo   3. Seed the database:
echo      npm run seed
echo.
echo   4. Start development servers:
echo      npm run dev:all
echo.
echo ================================================================
echo.

pause
