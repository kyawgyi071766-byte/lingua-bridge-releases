@echo off
setlocal
cd /d "%~dp0"
echo === Lingua Bridge v1.0.28 COMPOSER + ACCOUNT DETAILS + TRANSLATION CARD FIX ===
where node >nul 2>nul || (echo ERROR: Node.js is not installed.& pause & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm is not available.& pause & exit /b 1)

REM Prefer D: for npm/electron caches and temp files when available, because C: may be nearly full.
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

echo [0/15] Installing dependencies...
call npm install || (echo ERROR: npm install failed. Check free disk space and the npm error shown above.& pause & exit /b 1)

echo [1/10] Preflight...
node scripts\preflight.cjs || goto :qafail
echo [2/10] Validate...
node scripts\validate.cjs || goto :qafail
echo [3/10] Admin/custom audit...
node scripts\admin-custom-audit.cjs || goto :qafail
echo [4/10] v1.0.28 audit...
node scripts\ux-v1.0.28-audit.cjs || goto :qafail
echo [5/10] Syntax checks...
node --check electron\main.cjs || goto :qafail
node --check electron\host-preload.cjs || goto :qafail
node --check electron\service-preload.cjs || goto :qafail
node --check src\app.js || goto :qafail
node --check scripts\build-static.cjs || goto :qafail

echo [6/10] Building renderer...
node scripts\build-static.cjs || (echo ERROR: Renderer build failed.& pause & exit /b 1)
if exist release-v1.0.28-public rmdir /s /q release-v1.0.28-public

echo [7/10] Building Windows ZIP fallback...
call npx electron-builder --config electron-builder.public-zip.json --win zip --x64 || (echo ERROR: ZIP build failed.& pause & exit /b 1)

echo [8/10] Building Windows installer...
call npx electron-builder --config electron-builder.public-installer.json --win nsis --x64
if errorlevel 1 (
  echo WARNING: NSIS installer build failed. The ZIP fallback is still available.
) else (
  echo Installer build complete.
)

echo [9/10] SHA-256 checksums...
for %%F in (release-v1.0.28-public\*.exe release-v1.0.28-public\*.zip) do if exist "%%F" powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 '%%F').Hash.ToLower(); Write-Host ('  '+$h+'  %%~nxF')"

echo [10/10] Complete.
echo Output: %CD%\release-v1.0.28-public
start "" explorer "%CD%\release-v1.0.28-public"
pause
exit /b 0

:qafail
echo ERROR: Desktop QA failed at the step shown above.
pause
exit /b 1
