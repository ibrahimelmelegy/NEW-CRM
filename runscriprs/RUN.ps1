# تعيين سياسة التنفيذ وتجاوز التحذيرات
$ErrorActionPreference = "SilentlyContinue"

# التحقق من صلاحيات المسؤول وإعادة التشغيل كمسؤول إذا لزم الأمر
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "⚠️  يتم الآن طلب صلاحيات المسؤول..." -ForegroundColor Yellow
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

function Write-Banner {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "    🚀  SAUD - HPT CRM | DEV ENVIRONMENT LAUNCHER  🚀            " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "    • Backend Port:  5000" -ForegroundColor Gray
    Write-Host "    • Frontend Port: 3060" -ForegroundColor Gray
    Write-Host "    • Proposal Port: 3001" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Kill-Port-Process ($port) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Write-Host "    ⚡ Killing process on port $port (PID: $process)..." -ForegroundColor Red
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    }
}

function Check-And-Install-Deps ($path) {
    if (-not (Test-Path "$path\node_modules")) {
        Write-Host "    📦 Missing node_modules in $path. Installing..." -ForegroundColor Yellow
        Push-Location $path
        npm install
        Pop-Location
    }
}

Write-Banner

# 1. SMART CLEANUP
Write-Host "[1/5] 🧹 Performing Smart Cleanup..." -ForegroundColor Green
Kill-Port-Process 5000 # Backend
Kill-Port-Process 3060 # Frontend
Kill-Port-Process 3000 # Nuxt Default
Kill-Port-Process 3001 # React Proposal

# Deep Clean Caches
Write-Host "    🗑️  Purging cache files..." -ForegroundColor DarkGray
$pathsToClean = @(
    "d:\SAUD - HPT CRM\leadify-frontend-main\.nuxt",
    "d:\SAUD - HPT CRM\leadify-frontend-main\.output",
    "d:\SAUD - HPT CRM\leadify-frontend-main\node_modules\.cache",
    "d:\SAUD - HPT CRM\React proposal\node_modules\.cache"
)
foreach ($p in $pathsToClean) { Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue }

# 2. HEALTH & DEPS
Write-Host "[2/5] 🏥 Checking Dependencies..." -ForegroundColor Green
Check-And-Install-Deps "d:\SAUD - HPT CRM\leadify-backend-main"
Check-And-Install-Deps "d:\SAUD - HPT CRM\leadify-frontend-main"
Check-And-Install-Deps "d:\SAUD - HPT CRM\React proposal"

Write-Host "    🛠️  Syncing Nuxt types..." -ForegroundColor DarkGray
Set-Location "d:\SAUD - HPT CRM\leadify-frontend-main"
npx nuxi prepare | Out-Null

# 3. DATABASE
Write-Host "[3/5] 🐘 Checking Database..." -ForegroundColor Green
if (Get-Service "com.docker.service" -ErrorAction SilentlyContinue | Where-Object Status -eq 'Running') {
    Set-Location "d:\SAUD - HPT CRM\leadify-backend-main"
    docker-compose up -d | Out-Null
    Write-Host "    ✅ Database services ensured." -ForegroundColor Cyan
} else {
    Write-Host "    ⚠️  Docker is NOT running. Skipping DB start." -ForegroundColor Yellow
}

# 4. LAUNCH SERVERS
Write-Host "[4/5] 🚀 Launching Servers (4GB RAM Mode)..." -ForegroundColor Green
$envOpt = "`$env:NODE_OPTIONS='--max-old-space-size=4096'"

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$envOpt; cd 'd:\SAUD - HPT CRM\leadify-backend-main'; npm run dev"
# React Proposal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$envOpt; cd 'd:\SAUD - HPT CRM\React proposal'; npm run dev"
# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$envOpt; cd 'd:\SAUD - HPT CRM\leadify-frontend-main'; npm run dev"

# 5. AUTO BROWSER
Write-Host "[5/5] 🌐 Opening Browser..." -ForegroundColor Green
Start-Sleep -Seconds 7
Start-Process "http://localhost:3060"
Start-Process "http://localhost:3001"

Write-Banner
Write-Host "✅ ENVIRONMENT IS READY!" -ForegroundColor Green
Write-Host "   Dashboard: http://localhost:3060"
Write-Host "   Proposals: http://localhost:3001"
Write-Host "   API:       http://localhost:5000"
Write-Host ""
Start-Sleep -Seconds 5