$root = "d:\Crm-Dev\NEW-CRM"
Write-Host "Starting Leadify CRM Servers..."

# Backend (Port 5000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\leadify-backend-main'; `$env:PORT=5000; `$env:NODE_ENV='development'; npm run dev"

# Frontend (Port 3060)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\leadify-frontend-main'; `$env:PORT=3060; `$env:NODE_ENV='development'; npm run dev"

# Health Dashboard (Port 8888)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\leadify-frontend-main'; `$env:PORT=8888; npm run health:ui"

Write-Host "Servers launched in separate windows."
