# Start All CRM Servers
# This script starts Backend, Frontend (Vue), and React Proposal servers

Write-Host "Starting all CRM servers..." -ForegroundColor Cyan

# Start Backend (Port 5000)
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Crm-Dev\NEW-CRM\leadify-backend-main'; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Frontend Vue/Nuxt (Port 3000)
Write-Host "Starting Frontend (Vue/Nuxt) Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Crm-Dev\NEW-CRM\leadify-frontend-main'; npm run dev"

# Wait a moment
Start-Sleep -Seconds 2

# Start React Proposal (Port 3001)
Write-Host "Starting React Proposal Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Crm-Dev\NEW-CRM\React proposal'; npm run dev"

Write-Host "" -ForegroundColor White
Write-Host "All servers started!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Server URLs:" -ForegroundColor Cyan
Write-Host "  Backend:        http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend (Vue): http://localhost:3000" -ForegroundColor White
Write-Host "  React Proposal: http://localhost:3001" -ForegroundColor White
Write-Host "" -ForegroundColor White
