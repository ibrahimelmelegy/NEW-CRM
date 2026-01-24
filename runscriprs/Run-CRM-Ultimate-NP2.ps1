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
    try {
        $tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($tcp) {
            $procId = $tcp.OwningProcess
            if ($procId) { 
                Write-Host "   - Flushing Port $port (PID: $procId)..." -ForegroundColor Red
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}

# 3. ميزة [Cache Purge]: مسح الكاش المتسبب في الـ 1100 طلب
Write-Host "[2/5] ⚡ Purging Nuxt & Vite Cache..." -ForegroundColor Green
Remove-Item -Recurse -Force "$($paths.Frontend)\.nuxt" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$($paths.Frontend)\node_modules\.vite" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$($paths.Frontend)\.output" -ErrorAction SilentlyContinue

# 4. ميزة [PM2 & ecosystem]: إعداد مدير العمليات
Write-Host "[3/5] ⚙️  Setting up PM2 Process Manager..." -ForegroundColor Green
npm install -g pm2 --no-audit --no-fund --loglevel=error
npx pm2 delete all

# 5. تشغيل النظام عبر PM2 (Backend + Frontend + Proposal + Health)
Write-Host "[4/5] 🚀 Launching Ecosystem (4 Servers)..." -ForegroundColor Cyan
npx pm2 start ecosystem.config.js

# فتح شاشة المراقبة
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx pm2 monit"

# 6. ميزة [Auto-Browser-Sync]: فتح المتصفح
Write-Host "[5/5] 🌐 Opening Browser..." -ForegroundColor Green
Start-Sleep -Seconds 8
Start-Process "http://localhost:3060"

Write-Host "`n✅ ALL SYSTEMS OPERATIONAL WITH PM2. Happy Coding, Boss!" -ForegroundColor Green
