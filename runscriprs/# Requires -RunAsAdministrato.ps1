# Requires -RunAsAdministrator
$ErrorActionPreference = "SilentlyContinue"

function Write-Banner {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "   🚀  SAUD - HPT CRM | DEV ENVIRONMENT LAUNCHER  🚀           " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "   • Backend Port:  5000" -ForegroundColor Gray
    Write-Host "   • Frontend Port: 3060" -ForegroundColor Gray
    Write-Host "   • Proposal Port: 3001" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Kill-Port-Process ($port) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Write-Host "   ⚡ Killing process on port $port (PID: $process)..." -ForegroundColor Red
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    }
}

function Check-And-Install-Deps ($path) {
    if (-not (Test-Path "$path\node_modules")) {
        Write-Host "   📦 Missing node_modules in $path. Installing..." -ForegroundColor Yellow
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
Write-Host "   🗑️  Purging cache files..." -ForegroundColor DarkGray
Remove-Item -Recurse -Force "d:\SAUD - HPT CRM\leadify-frontend-main\.nuxt" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "d:\SAUD - HPT CRM\leadify-frontend-main\.output" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "d:\SAUD - HPT CRM\leadify-frontend-main\node_modules\.cache" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "d:\SAUD - HPT CRM\React proposal\node_modules\.cache" -ErrorAction SilentlyContinue

# 2. HEALTH & DEPS
Write-Host "[2/5] 🏥 Checking Dependencies..." -ForegroundColor Green
Check-And-Install-Deps "d:\SAUD - HPT CRM\leadify-backend-main"
Check-And-Install-Deps "d:\SAUD - HPT CRM\leadify-frontend-main"
Check-And-Install-Deps "d:\SAUD - HPT CRM\React proposal"

Write-Host "   🛠️  Syncing Nuxt types..." -ForegroundColor DarkGray
Set-Location "d:\SAUD - HPT CRM\leadify-frontend-main"
npx nuxi prepare | Out-Null

# 3. DATABASE
Write-Host "[3/5] 🐘 Checking Database..." -ForegroundColor Green
Set-Location "d:\SAUD - HPT CRM\leadify-backend-main"
if (Get-Service "com.docker.service" -ErrorAction SilentlyContinue | Where-Object Status -eq 'Running') {
    docker-compose up -d | Out-Null
    Write-Host "   ✅ Database services ensured." -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  Docker is NOT running. Skipping DB start." -ForegroundColor Yellow
}

# 4. LAUNCH SERVERS (Enhanced RAM)
Write-Host "[4/5] 🚀 Launching Servers (4GB RAM Mode)..." -ForegroundColor Green

$env:NODE_OPTIONS='--max-old-space-size=4096'

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$env:NODE_OPTIONS='--max-old-space-size=4096'; cd 'd:\SAUD - HPT CRM\leadify-backend-main'; Write-Host '🔙 Backend Starting...'; npm run dev"
Write-Host "   • Backend launched."

# React Proposal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$env:NODE_OPTIONS='--max-old-space-size=4096'; cd 'd:\SAUD - HPT CRM\React proposal'; Write-Host '⚛️ Proposal App Starting...'; npm run dev"
Write-Host "   • Proposal App launched."

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$env:NODE_OPTIONS='--max-old-space-size=4096'; cd 'd:\SAUD - HPT CRM\leadify-frontend-main'; Write-Host '🎨 Frontend Starting...'; npm run dev"
Write-Host "   • Frontend launched."

# 5. AUTO BROWSER
Write-Host "[5/5] 🌐 Opening Browser..." -ForegroundColor Green
Start-Sleep -Seconds 5 # Give servers a moment to bind
Start-Process "http://localhost:3060"
Start-Process "http://localhost:3001"

Write-Banner
Write-Host "✅ ENVIRONMENT IS READY!" -ForegroundColor Green
Write-Host "   ------------------------------------------------"
Write-Host "   Dashboard: http://localhost:3060" -ForegroundColor White
Write-Host "   Proposals: http://localhost:3001" -ForegroundColor White
Write-Host "   API:       http://localhost:5000" -ForegroundColor White
Write-Host "   ------------------------------------------------"
Write-Host ""
