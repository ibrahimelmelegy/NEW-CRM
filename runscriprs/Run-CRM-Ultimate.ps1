# Requires -RunAsAdministrator
$ErrorActionPreference = "SilentlyContinue"

function Write-Banner {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "    🚀  SAUD - HPT CRM | ULTIMATE DEV LAUNCHER (4GB RAM) 🚀    " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "    • Backend Port:  5000  | RAM: 4GB" -ForegroundColor Gray
    Write-Host "    • Frontend Port: 3060  | RAM: 4GB" -ForegroundColor Gray
    Write-Host "    • Proposal Port: 3001  | RAM: 4GB" -ForegroundColor Gray
    Write-Host "    • Health Dash:   8888  | RAM: 4GB" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Cyan
}

# تحديد المسارات الأساسية
$basePath = "D:\SAUD - HPT CRM"
$backendPath = Join-Path $basePath "leadify-backend-main"
$frontendPath = Join-Path $basePath "leadify-frontend-main"
$proposalPath = Join-Path $basePath "React proposal"
# مسار لوحة التحكم هو نفسه مسار الفرونت إند لأن السكربت بداخله
$healthPath = $frontendPath 

Write-Banner

# 1. تنظيف المنافذ (Ports) لضمان عدم حدوث تعارض
Write-Host "[1/4] 🧹 Clearing Ports..." -ForegroundColor Green
# تمت إضافة 8888 (Health) و 51204 (Vitest UI) للقائمة
$ports = @(5000, 3060, 3001, 3000, 8888, 51204)
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

# تشغيل الـ Proposal
Write-Host "   • Starting Proposal App..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$proposalPath'; $ramLimit; Write-Host '--- PROPOSAL SERVER ---' -ForegroundColor Yellow; npm run dev"

# تشغيل الـ Frontend
Write-Host "   • Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; $ramLimit; Write-Host '--- FRONTEND SERVER ---' -ForegroundColor Yellow; npm run dev"

# تشغيل الـ Health Dashboard (الجديد)
Write-Host "   • Starting Health Dashboard & Tests..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$healthPath'; $ramLimit; Write-Host '--- HEALTH DASHBOARD & TESTS ---' -ForegroundColor Yellow; npm run health:ui"

# 4. فتح المتصفح تلقائياً
Write-Host "[3/4] 🌐 Opening Browser..." -ForegroundColor Green
Start-Sleep -Seconds 10 # ننتظر قليلاً حتى تبدأ السيرفرات

# فتح الروابط الأساسية
Start-Process "http://localhost:3060" # لوحة التحكم الرئيسية
Start-Process "http://localhost:3001" # البروبوزال
Start-Process "http://localhost:8888" # لوحة فحص الأخطاء (Health Dashboard)

Write-Host "`n✅ ALL SYSTEMS GO! Happy Coding." -ForegroundColor Green
Start-Sleep -Seconds 5
