Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PORT=5000; `$env:NODE_ENV='development'; cd 'E:\NEW-CRM\leadify-backend-main'; npm run dev; Read-Host 'Press Enter to exit'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PORT=3060; `$env:NODE_ENV='development'; `$env:NODE_OPTIONS='--max-old-space-size=4096'; cd 'E:\NEW-CRM\leadify-frontend-main'; npm run dev; Read-Host 'Press Enter to exit'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PORT=3001; cd 'E:\NEW-CRM\React proposal'; npm run dev -- --host 0.0.0.0 --port 3001; Read-Host 'Press Enter to exit'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PORT=8888; cd 'E:\NEW-CRM\leadify-frontend-main'; npm run health:ui; Read-Host 'Press Enter to exit'"
