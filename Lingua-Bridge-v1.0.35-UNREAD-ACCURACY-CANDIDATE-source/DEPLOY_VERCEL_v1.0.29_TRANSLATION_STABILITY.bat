@echo off
setlocal
cd /d "%~dp0"
echo === Lingua Bridge v1.0.29 translation stability PRODUCTION deploy ===
where node >nul 2>nul || (echo ERROR: Node.js is not installed.& pause & exit /b 1)
where npx >nul 2>nul || (echo ERROR: npx is not available.& pause & exit /b 1)

if exist D:\ (
  if not exist D:\npm-cache mkdir D:\npm-cache >nul 2>nul
  if not exist D:\npm-temp mkdir D:\npm-temp >nul 2>nul
  set npm_config_cache=D:\npm-cache
  set TEMP=D:\npm-temp
  set TMP=D:\npm-temp
)

echo [1/3] Server translation stability audit...
node scripts\translation-stability-v1.0.29-audit.cjs || (echo ERROR: server translation audit failed.& pause & exit /b 1)
echo [2/3] Verifying linked Vercel project...
if not exist .vercel\project.json (echo ERROR: .vercel\project.json is missing.& pause & exit /b 1)
type .vercel\project.json
echo [3/3] Deploying linked project to Vercel Production...
call npx vercel --prod --yes
if errorlevel 1 (echo ERROR: Vercel production deploy failed.& pause & exit /b 1)
echo SUCCESS: v1.0.29 server translation stability code deployed.
pause
