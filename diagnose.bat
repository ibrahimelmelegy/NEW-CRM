@echo off
echo ========================================
echo CRM Server Diagnostic Tool
echo ========================================
echo.

echo [Diagnostic 1] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
) else (
    node --version
)

echo.
echo [Diagnostic 2] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found!
) else (
    npm --version
)

echo.
echo [Diagnostic 3] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not installed!
) else (
    docker --version
    docker ps
)

echo.
echo [Diagnostic 4] Checking Ports...
netstat -ano | findstr ":5000" >nul
if errorlevel 1 (
    echo Port 5000: FREE
) else (
    echo Port 5000: IN USE
    netstat -ano | findstr ":5000"
)

netstat -ano | findstr ":3060" >nul
if errorlevel 1 (
    echo Port 3060: FREE
) else (
    echo Port 3060: IN USE
    netstat -ano | findstr ":3060"
)

netstat -ano | findstr ":5433" >nul
if errorlevel 1 (
    echo Port 5433: FREE (Database should use this!)
) else (
    echo Port 5433: IN USE
    netstat -ano | findstr ":5433"
)

echo.
echo [Diagnostic 5] Checking Backend dependencies...
cd "leadify-backend-main"
if not exist "node_modules" (
    echo ERROR: Backend node_modules not found!
    echo Run: npm install
) else (
    echo OK: Backend dependencies installed
)
cd ..

echo.
echo [Diagnostic 6] Checking Frontend dependencies...
cd "leadify-frontend-main"
if not exist "node_modules" (
    echo ERROR: Frontend node_modules not found!
    echo Run: npm install
) else (
    echo OK: Frontend dependencies installed
)
cd ..

echo.
echo [Diagnostic 7] Checking .env files...
if exist "leadify-backend-main\.env" (
    echo OK: Backend .env found
    type "leadify-backend-main\.env"
) else (
    echo ERROR: Backend .env NOT found!
)

echo.
if exist "leadify-frontend-main\.env" (
    echo OK: Frontend .env found
    type "leadify-frontend-main\.env"
) else (
    echo ERROR: Frontend .env NOT found!
)

echo.
echo ========================================
echo Diagnostic Complete
echo ========================================
pause
