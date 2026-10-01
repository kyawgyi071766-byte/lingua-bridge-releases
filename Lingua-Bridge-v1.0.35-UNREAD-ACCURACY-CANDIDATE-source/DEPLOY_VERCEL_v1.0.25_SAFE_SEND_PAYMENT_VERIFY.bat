@echo off
setlocal
cd /d "%~dp0"
echo === Lingua Bridge v1.0.25 server deploy: payment verification + support state ===
where node >nul 2>nul || (echo ERROR: Node.js is not installed.& pause & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm is not available.& pause & exit /b 1)
call npm install || (echo ERROR: npm install failed.& pause & exit /b 1)
call npm run audit:safe-send-payment || (echo ERROR: Safe-send/payment audit failed.& pause & exit /b 1)
call npm run audit:static || (echo ERROR: Static security audit failed.& pause & exit /b 1)
call npx vercel --prod --yes || (echo ERROR: Vercel production deploy failed.& pause & exit /b 1)
echo.
echo SUCCESS: v1.0.25 server changes deployed. Prisma migration runs through vercel-build.
pause
