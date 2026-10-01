@echo off
setlocal
cd /d "%~dp0"
echo === Lingua v1.0.20 Gemini Rate-Limit Stability - Vercel Production Deploy ===
where node >nul 2>nul || (echo ERROR: Node.js is required.& pause & exit /b 1)
if not exist .vercel\project.json (
  echo ERROR: .vercel\project.json is missing. Do not deploy from the wrong folder.
  pause
  exit /b 1
)
if not exist .vercelignore (
  echo ERROR: .vercelignore is missing. Deployment stopped to avoid uploading desktop binaries.
  pause
  exit /b 1
)
echo Project link found. Desktop build artifacts will be excluded by .vercelignore.
echo.
call npx vercel --prod --yes
if errorlevel 1 (
  echo.
  echo ERROR: Vercel deployment failed. Production was not replaced by a failed deployment.
  pause
  exit /b 1
)
echo.
echo SUCCESS: Vercel production deployment completed.
pause
