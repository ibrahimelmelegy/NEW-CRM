@echo off
echo ========================================
echo Starting CRM Application
echo ========================================
echo.

REM Check if Docker is running
echo [1/4] Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)
echo OK: Docker is running

REM Check database container
echo.
echo [2/4] Checking Database...
docker ps | findstr "leadify-backend-main-db-1" >nul
if errorlevel 1 (
    echo WARNING: Database container not found!
    echo Starting database...
    cd "leadify-backend-main"
    docker-compose up -d
    timeout /t 5 >nul
    cd ..
)
echo OK: Database is running

REM Start Backend
echo.
echo [3/4] Starting Backend on port 5000...
echo Opening new terminal for Backend...
start "CRM Backend" cmd /k "cd /d %~dp0leadify-backend-main && npm run dev"
timeout /t 3 >nul

REM Start Frontend
echo.
echo [4/4] Starting Frontend on port 3060...
echo Opening new terminal for Frontend...
start "CRM Frontend" cmd /k "cd /d %~dp0leadify-frontend-main && npm run dev"

echo.
echo ========================================
echo Application Starting...
echo ========================================
echo Backend will be on: http://localhost:5000
echo Frontend will be on: http://localhost:3060
echo.
echo Login with the credentials configured in your .env file
echo (ADMIN_EMAIL / ADMIN_PASSWORD)
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
