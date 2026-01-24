# Requires -RunAsAdministrator
$ErrorActionPreference = "SilentlyContinue"

function Write-Banner {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "    🚀  SAUD - HPT CRM | ULTIMATE DEV LAUNCHER (4GB RAM) 🚀    " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "    • Backend Port:  5000 | RAM: 4GB" -ForegroundColor Gray
    Write-Host "    • Frontend Port: 3060 | RAM: 4GB" -ForegroundColor Gray
    Write-Host "    • Proposal Port: 3001 | RAM: 4GB" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Cyan
}

# تحديد المسارات الأساسية
$basePath = "D:\SAUD - HPT CRM"
$backendPath = Join-Path $basePath "leadify-backend-main"
$frontendPath = Join-Path $basePath "leadify-frontend-main"
$proposalPath = Join-Path $basePath "React proposal"

Write-Banner

# 1. تنظيف المنافذ (Ports) لضمان عدم حدوث تعارض
Write-Host "[1/4] 🧹 Clearing Ports..." -ForegroundColor Green
$ports = @(5000, 3060, 3001, 3000)
foreach ($port in $ports) {
    $procId = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($procId) {
        Write-Host "   - Killing process on port $port..." -ForegroundColor Red
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

# 2. إعداد أمر تشغيل الرامات (NODE_OPTIONS)
# تم ضبط الذاكرة على 4096 ميجابايت (4GB)
$ramLimit = "`$env:NODE_OPTIONS='--max-old-space-size=4096'"

# 3. تشغيل السيرفرات في نوافذ منفصلة
Write-Host "[2/4] 🚀 Launching Servers with 4GB RAM Boost..." -ForegroundColor Green

# تشغيل الـ Backend
Write-Host "   • Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; $ramLimit; Write-Host '--- BACKEND SERVER ---' -ForegroundColor Yellow; npm run dev"

# تشغيل الـ Proposal (الذي طلبته)
Write-Host "   • Starting Proposal App..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$proposalPath'; $ramLimit; Write-Host '--- PROPOSAL SERVER ---' -ForegroundColor Yellow; npm run dev"

# 4. ميزة [PM2 & ecosystem]: إعداد مدير العمليات
Write-Host "[3/5] ⚙️  Setting up PM2 Process Manager..." -ForegroundColor Green
npm install -g pm2 --no-audit --no-fund --loglevel=error
npx pm2 delete all

# 5. تشغيل النظام عبر PM2 (Backend + Frontend + Proposal + Health)
Write-Host "[4/5] 🚀 Launching Ecosystem (4 Servers)..." -ForegroundColor Cyan
npx pm2 start ecosystem.config.js

# فتح شاشة المراقبة
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx pm2 monit"
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



# تشغيل الـ Frontend
Write-Host "   • Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; $ramLimit; Write-Host '--- FRONTEND SERVER ---' -ForegroundColor Yellow; npm run dev"

# 4. فتح المتصفح تلقائياً
Write-Host "[3/4] 🌐 Opening Browser..." -ForegroundColor Green
Start-Sleep -Seconds 8 # ننتظر قليلاً حتى تبدأ السيرفرات في العمل
Start-Process "http://localhost:3060" # لوحة التحكم
Start-Process "http://localhost:3001" # البروبوزال

Write-Host "`n✅ ALL SYSTEMS GO! Happy Coding." -ForegroundColor Green
Start-Sleep -Seconds 5