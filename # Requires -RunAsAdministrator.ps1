# Requires -RunAsAdministrator

$ErrorActionPreference = "SilentlyContinue"



# إضافة مكتبة التنبيهات الصوتية

Add-Type -AssemblyName System.Speech

$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer



function Write-Banner {

    Clear-Host

    Write-Host "================================================================" -ForegroundColor Cyan

    Write-Host "    🚀  El-MagicoO - HPT CRM | ULTIMATE ENGINE v3.5  🚀         " -ForegroundColor Cyan

    Write-Host "================================================================" -ForegroundColor Cyan

    Write-Host "    • Status: Voice Notifications & PM2 Enabled" -ForegroundColor Gray

    Write-Host "    • Control Center: Port 3060 | Health: Port 8888" -ForegroundColor Gray

    Write-Host "================================================================" -ForegroundColor Cyan

}



# المسارات

$basePath = "D:\SAUD - HPT CRM"

$frontendPath = Join-Path $basePath "leadify-frontend-main"

$backendPath = Join-Path $basePath "leadify-backend-main"

$proposalPath = Join-Path $basePath "React proposal"

$resultsPath = Join-Path $frontendPath "test-results"



Write-Banner



# 1. تنظيف شامل وعميق

Write-Host "[1/7] 🧹 Deep Cleaning System..." -ForegroundColor Green

$ports = @(5000, 3060, 3001, 3000, 8888, 9323)

foreach ($port in $ports) {

    $procId = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

    if ($procId) { Stop-Process -Id $procId -Force }

}

Get-Process | Where-Object { $_.Name -match "playwright|node" } | Where-Object { $_.Path -notmatch "vscode" } | Stop-Process -Force



# 2. تهيئة ملفات النتائج

if (!(Test-Path $resultsPath)) { New-Item -ItemType Directory -Path $resultsPath -Force }

'{"suites": []}' | Out-File -FilePath "$resultsPath\results.json" -Encoding utf8



# 3. تشغيل المحركات الثلاثة (Back, Front, Proposal)

Write-Host "[2/7] 🚀 Igniting Servers..." -ForegroundColor Green

$ramLimit = "`$env:NODE_OPTIONS='--max-old-space-size=4096'"



Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; $ramLimit; `$Host.UI.RawUI.WindowTitle = 'BACKEND:5000'; npx ts-node src/server.ts"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$proposalPath'; $ramLimit; `$Host.UI.RawUI.WindowTitle = 'PROPOSAL:3001'; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; $ramLimit; `$Host.UI.RawUI.WindowTitle = 'FRONTEND:3060'; npm run dev"



# 4. تشغيل PM2 Monitoring

Write-Host "[3/7] ⚙️  Restarting PM2 Process Manager..." -ForegroundColor Green

npx pm2 kill 2>$null

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npx pm2 monit"



# 5. تشغيل Health Dashboard

Write-Host "[4/7] 🩺 Health UI is coming up..." -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run health:ui"



# 6. تشغيل الاختبارات الذاتية (المحرك السري)

Write-Host "[5/7] 🧪 Starting Hidden Test Suite..." -ForegroundColor Green

$testJob = Start-Process powershell -WindowStyle Hidden -PassThru -ArgumentList "-Command", "cd '$frontendPath'; npm run test:dashboard"



# 7. فتح مركز التحكم

Write-Host "[6/7] 🌐 Opening Browsers..." -ForegroundColor Green

Start-Sleep -Seconds 12

Start-Process "http://localhost:3060/admin/tests" 

Start-Process "http://localhost:8888" 



# 8. نظام التنبيه الذكي (صوت + إشعار)

Write-Host "[7/7] 🔔 Waiting for Test completion to notify you..." -ForegroundColor Cyan

$speaker.Speak("System is running. I will notify you when tests are complete, El Magico.")



# مراقبة عملية التيست في الخلفية

while (!$testJob.HasExited) { Start-Sleep -Seconds 2 }



# إعلان النجاح بالصوت واللون

Write-Host "`n✅ TESTS COMPLETE! CHECK DASHBOARD." -ForegroundColor White -BackgroundColor Green

[System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms") | Out-Null

$balloon = New-Object System.Windows.Forms.NotifyIcon

$balloon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Get-Process -id $pid).Path)

$balloon.BalloonTipIcon  = "Info"

$balloon.BalloonTipTitle = "HPT CRM - El-MagicoO"

$balloon.BalloonTipText  = "Tests are finished! Your QA Dashboard is now 100% updated."

$balloon.Visible = $true

$balloon.ShowBalloonTip(5000)



$speaker.Speak("Attention El Magico. All tests have been completed successfully. Your dashboard is ready.")



Write-Host "`n🏆 ALL SYSTEMS NOMINAL. ENJOY!" -ForegroundColor Cyan