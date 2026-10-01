@echo off
setlocal
cd /d "%~dp0"
echo === Lingua Bridge v1.0.21 PUBLIC RELEASE server deploy ===
where npx >nul 2>nul || (echo ERROR: npx is unavailable. Install Node.js 20+.& pause & exit /b 1)
if not exist .vercel\project.json (echo ERROR: This folder is not linked to the Lingua Vercel project.& pause & exit /b 1)
call npx vercel --prod --yes
if errorlevel 1 (echo ERROR: Vercel production deploy failed.& pause & exit /b 1)
echo SUCCESS: Production deploy command completed.
pause
