# Requires -RunAsAdministrator
$ErrorActionPreference = "SilentlyContinue"

function Write-Banner {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "    🚀  SAUD - HPT CRM | ULTIMATE DASHBOARD (NP2) 🚀    " -ForegroundColor Cyan
    Write-Host "    System Health: [MONITORING ACTIVE] | RAM Boost: [4GB]    " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
}

# 1. تعريف المسارات
$basePath = "D:\SAUD - HPT CRM"
$paths = @{
    "Backend"  = Join-Path $basePath "leadify-backend-main"
    "Frontend" = Join-Path $basePath "leadify-frontend-main"
    "Proposal" = Join-Path $basePath "React proposal"
}

Write-Banner

# 2. ميزة [Deep Clean]: تنظيف البورتات والعمليات العالقة
Write-Host "[1/5] 🧹 Deep Cleaning Ports & Zombie Processes..." -ForegroundColor Green
$ports = @(5000, 3060, 3001, 8888, 51204)
foreach ($port in $ports) {
    echo "Checking Port $port..."
    $tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($tcp) {
        $procId = $tcp.OwningProcess
        $procId = $procId | Select-Object -Unique
        if ($procId) { 
            Write-Host "   - Flushing Port $port (PID: $procId)..." -ForegroundColor Red
            Stop-Process -Id $procId -Force 
        }
    }
}

# 3. ميزة [Cache Purge]: مسح الكاش المتسبب في الـ 1100 طلب
Write-Host "[2/5] ⚡ Purging Nuxt & Vite Cache..." -ForegroundColor Green
Remove-Item -Recurse -Force "$($paths.Frontend)\.nuxt" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$($paths.Frontend)\node_modules\.vite" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$($paths.Frontend)\.output" -ErrorAction SilentlyContinue

# 4. إعداد بيئة التشغيل
# نستخدم الأمر مباشرة داخل الستارت بروسيس لضمان وصوله
$ramCommand = "`$env:NODE_OPTIONS='--max-old-space-size=4096'"

# 5. ميزة [Smart Sequential Launch]: التشغيل المتسلسل الذكي
Write-Host "[3/5] 🚀 Sequential System Launch..." -ForegroundColor Green

# تشغيل الباك إند
Write-Host "   • Launching Backend API..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($paths.Backend)'; `$Host.UI.RawUI.WindowTitle = 'Backend API (NP2 Boosted)'; $ramCommand; npm run dev"

# تشغيل البروبوزال
Write-Host "   • Launching Proposal (Port 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($paths.Proposal)'; `$Host.UI.RawUI.WindowTitle = 'Proposal App (NP2 Boosted)'; $ramCommand; npm run dev -- --host 0.0.0.0 --port 3001"

# تشغيل لوحة صحة النظام (Health Dashboard)
Write-Host "   • Launching System Health Dashboard..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($paths.Frontend)'; `$Host.UI.RawUI.WindowTitle = 'Health Dashboard'; npm run health:ui"

# ميزة [Port Watcher]: الانتظار حتى استجابة بورت 3001
Write-Host "   • Waiting for API handshake..." -ForegroundColor Yellow
$ready = $false
for($i=0; $i -lt 20; $i++) {
    if (Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet) { $ready = $true; break }
    Start-Sleep -Seconds 2
    Write-Host "     [Attempt $i] Connection pending..." -ForegroundColor Gray
}

# تشغيل الفرونت إند
Write-Host "   • Launching Frontend (Port 3060)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($paths.Frontend)'; `$Host.UI.RawUI.WindowTitle = 'Frontend App (NP2 Boosted)'; $ramCommand; npm run dev"

# 6. ميزة [Auto-Browser-Sync]: فتح المتصفح بوضعية المطور
Write-Host "[4/5] 🌐 Opening Dev-Browser..." -ForegroundColor Green
Start-Sleep -Seconds 10
# فتح الفرونت إند مباشرة
Start-Process "chrome.exe" "http://localhost:3060"

Write-Host "`n✅ ALL SYSTEMS OPERATIONAL. Happy Coding, Boss!" -ForegroundColor Green
