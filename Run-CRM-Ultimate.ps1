# Run-CRM-Ultimate.ps1

Write-Host "STARTING ULTIMATE CRM ENVIRONMENT..." -ForegroundColor Cyan

# 1. CLEAN PORTS
Write-Host "Cleaning ports..." -ForegroundColor Yellow
$ports = @(5000, 3060, 3001, 8888, 51204)
foreach ($port in $ports) {
    $pid_tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($pid_tcp) {
        Stop-Process -Id $pid_tcp -Force -ErrorAction SilentlyContinue
        Write-Host " - Killed process on port $port" -ForegroundColor Red
    }
}

# 2. SET MEMORY
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# 3. LAUNCH BACKEND
Write-Host "Launching Backend (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\SAUD - HPT CRM\leadify-backend-main'; npm run dev"

# 4. LAUNCH REACT PROPOSAL APP
Write-Host "Launching React Proposal App (Port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\SAUD - HPT CRM\React proposal'; npm run dev"

# 5. LAUNCH FRONTEND
Write-Host "Launching Nuxt Frontend (Port 3060)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\SAUD - HPT CRM\leadify-frontend-main'; npm run dev"

# 6. LAUNCH HEALTH DASHBOARD
Write-Host "Launching Health Dashboard (Port 8888)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\SAUD - HPT CRM\leadify-frontend-main'; npm run health:ui"

# 7. OPEN BROWSERS
Start-Sleep -Seconds 5
Start-Process "http://localhost:3060"
Start-Process "http://localhost:8888"

Write-Host "DONE! Check the popup windows." -ForegroundColor Cyan
