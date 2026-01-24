@echo off
echo STOPPING PM2 INSTANCE (IF RUNNING)...
call npx pm2 stop CRM-Health-Dash >nul 2>&1

echo LAUNCHING HEALTH DASHBOARD...
echo Open http://localhost:8888 in your browser if not opened automatically.

cd leadify-frontend-main
npm run health:ui
