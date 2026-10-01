@echo off
setlocal
cd /d "%~dp0"
echo === Lingua Bridge v1.0.27 SIGNAL COMPANION + ESC BACK candidate build ===
where node >nul 2>nul || (echo ERROR: Node.js is not installed.& pause & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm is not available.& pause & exit /b 1)

REM Use D:\npm-cache when available so a nearly-full C: drive does not block npm.
if exist D:\ (
  if not exist D:\npm-cache mkdir D:\npm-cache >nul 2>nul
  set npm_config_cache=D:\npm-cache
)

call npm install || (echo ERROR: npm install failed. Free at least 10 GB on the drive used by npm/electron-builder and try again.& pause & exit /b 1)
call npm run qa || (echo ERROR: Desktop QA failed.& pause & exit /b 1)
call npm run build:web || (echo ERROR: Renderer build failed.& pause & exit /b 1)
if exist release-v1.0.27-public rmdir /s /q release-v1.0.27-public

echo.
echo [1/2] Building Windows ZIP fallback...
call npx electron-builder --config electron-builder.public-zip.json --win zip --x64 || (echo ERROR: ZIP build failed.& pause & exit /b 1)

echo.
echo [2/2] Building Windows installer...
call npx electron-builder --config electron-builder.public-installer.json --win nsis --x64
if errorlevel 1 (
  echo WARNING: NSIS installer build failed. The ZIP fallback is still available.
) else (
  echo Installer build complete.
)

echo.
echo SHA-256 checksums:
for %%F in (release-v1.0.27-public\*.exe release-v1.0.27-public\*.zip) do if exist "%%F" powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 '%%F').Hash.ToLower(); Write-Host ('  '+$h+'  %%~nxF')"
echo.
echo Output: %CD%\release-v1.0.27-public
start "" explorer "%CD%\release-v1.0.27-public"
pause
