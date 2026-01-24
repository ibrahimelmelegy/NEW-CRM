# Requires -RunAsAdministrator
$ErrorActionPreference = "SilentlyContinue"

Write-Host "🚀 Installing/Updating PM2..." -ForegroundColor Cyan
npm install -g pm2 --no-audit --no-fund --loglevel=error

Write-Host "🧹 Cleaning Old Processes..." -ForegroundColor Yellow
npx pm2 kill
taskkill /F /IM node.exe

Write-Host "⚡ Starting CRM Ecosystem with PM2..." -ForegroundColor Green
npx pm2 start ecosystem.config.js

Write-Host "📊 Opening Monitor..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx pm2 monit"

Write-Host "✅ Systems Online!" -ForegroundColor Green
Start-Sleep -Seconds 5
# Open default browser safely
Start-Process "http://localhost:3060"
