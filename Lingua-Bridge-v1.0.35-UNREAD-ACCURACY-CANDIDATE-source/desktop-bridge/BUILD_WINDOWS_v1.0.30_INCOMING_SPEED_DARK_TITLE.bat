@echo off
setlocal
cd /d "%~dp0"
echo === Lingua Bridge v1.0.30 INCOMING SPEED + DARK TITLE candidate build ===
where node >nul 2>nul || (echo ERROR: Node.js is not installed.& pause & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm is not available.& pause & exit /b 1)
if exist D:\ (
  if not exist D:\npm-cache mkdir D:\npm-cache >nul 2>nul
  if not exist D:\npm-temp mkdir D:\npm-temp >nul 2>nul
  if not exist D:\electron-cache mkdir D:\electron-cache >nul 2>nul
  set npm_config_cache=D:\npm-cache
  set TEMP=D:\npm-temp
  set TMP=D:\npm-temp
  set ELECTRON_CACHE=D:\electron-cache
  set ELECTRON_BUILDER_CACHE=D:\electron-cache
)
echo [0/10] Installing dependencies...
call npm install || (echo ERROR: npm install failed. Keep at least several GB free on C: even with D: caches.& pause & exit /b 1)
echo [1/10] Preflight...
node scripts\preflight.cjs || goto :qafail
echo [2/10] Validate...
node scripts\validate.cjs || goto :qafail
echo [3/10] v1.0.28 retained UX audit...
node scripts\ux-v1.0.28-audit.cjs || goto :qafail
echo [4/10] v1.0.29 retained recovery audit...
node scripts\ux-v1.0.29-audit.cjs || goto :qafail
echo [5/10] v1.0.30 incoming speed audit...
node scripts\ux-v1.0.30-audit.cjs || goto :qafail
echo [6/10] Syntax checks...
node --check electron\main.cjs || goto :qafail
node --check electron\host-preload.cjs || goto :qafail
node --check electron\service-preload.cjs || goto :qafail
node --check src\app.js || goto :qafail
echo [7/10] Building renderer...
node scripts\build-static.cjs || goto :qafail
if exist release-v1.0.30-public rmdir /s /q release-v1.0.30-public
echo [8/10] Building Windows ZIP fallback...
call npx electron-builder --config electron-builder.public-zip.json --win zip --x64 || goto :buildfail
echo [9/10] Building Windows installer...
call npx electron-builder --config electron-builder.public-installer.json --win nsis --x64
if errorlevel 1 (echo WARNING: NSIS installer failed; ZIP fallback remains available.)
echo [10/10] Complete.
for %%F in (release-v1.0.30-public\*.exe release-v1.0.30-public\*.zip) do if exist "%%F" powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 '%%F').Hash.ToLower(); Write-Host ('  '+$h+'  %%~nxF')"
start "" explorer "%CD%\release-v1.0.30-public"
pause
exit /b 0
:qafail
echo ERROR: Desktop QA failed at the step shown above.
pause
exit /b 1
:buildfail
echo ERROR: Windows ZIP build failed.
pause
exit /b 1
