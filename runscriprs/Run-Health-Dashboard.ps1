# Requires -RunAsAdministrator
$ErrorActionPreference = "SilentlyContinue"

function Write-Banner {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "    🏥  SAUD - HPT CRM | HEALTH DASHBOARD MANAGER  🏥    " -ForegroundColor Cyan
    Write-Host "    Mode: [STANDALONE] | Port: [8888] | Status: [LIVE]    " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
}

$frontendPath = "D:\SAUD - HPT CRM\leadify-frontend-main"

Write-Banner

# 1. إيقاف أي نسخة قديمة
Write-Host "[1/3] 🛑 Stopping background instances..." -ForegroundColor Yellow
npx pm2 stop CRM-Health-Dash 2>$null
$procId = Get-NetTCPConnection -LocalPort 8888 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($procId) { Stop-Process -Id $procId -Force }

# 2. تشغيل السيرفر
Write-Host "[2/3] 🚀 Launching Dashboard Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; `$Host.UI.RawUI.WindowTitle = 'Health Dashboard (Test Server)'; npm run health:ui"

# 3. فتح المتصفح
Write-Host "[3/3] 🌐 Opening Browser..." -ForegroundColor Green
Start-Sleep -Seconds 5
Start-Process "http://localhost:8888"

Write-Host "`n✅ DASHBOARD IS RUNNING!" -ForegroundColor Cyan
