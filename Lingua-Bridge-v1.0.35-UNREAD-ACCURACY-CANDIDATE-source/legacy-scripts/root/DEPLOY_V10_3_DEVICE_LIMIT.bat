@echo off
setlocal
cd /d "%~dp0"
set "DEPLOY_CACHE=%~d0\LinguaVercelDeployCache"
if not exist "%DEPLOY_CACHE%" mkdir "%DEPLOY_CACHE%"
set "npm_config_cache=%DEPLOY_CACHE%\npm"
set "TEMP=%DEPLOY_CACHE%\temp"
set "TMP=%DEPLOY_CACHE%\temp"
if not exist "%TEMP%" mkdir "%TEMP%"

echo === Lingua v10.3 Device Limit PRODUCTION deploy ===
echo Target: lingua-github-import

echo.
where node >nul 2>nul || (
  echo ERROR: Node.js is required.
  pause
  exit /b 1
)
if not exist ".vercel\project.json" (
  echo ERROR: .vercel\project.json is missing. Deployment cancelled.
  pause
  exit /b 1
)

echo Step 1/2: Deploying server to Vercel production...
call npx --yes vercel@latest --prod --yes
if errorlevel 1 (
  echo.
  echo DEPLOY FAILED. Take a screenshot of this window for ChatGPT.
  pause
  exit /b 1
)

echo.
echo Step 2/2: Quick endpoint verification...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$urls=@('https://lingua-github-import.vercel.app/api/devices','https://lingua-github-import.vercel.app/api/access-code/redeem','https://lingua-github-import.vercel.app/api/voice/usage','https://lingua-github-import.vercel.app/api/desktop/update?platform=win32^&arch=x64^&current=1.0.6^&channel=stable'); foreach($u in $urls){ try { $r=Invoke-WebRequest -Uri $u -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop; Write-Host $r.StatusCode $u } catch { if($_.Exception.Response){ Write-Host ([int]$_.Exception.Response.StatusCode) $u } else { Write-Host 'ERR' $u $_.Exception.Message } } }"

echo.
echo Expected: the API routes should no longer be 404.
echo Auth-protected routes may return 401/403 without a signed-in session; that is normal.
echo.
echo DEPLOY COMMAND FINISHED.
pause
