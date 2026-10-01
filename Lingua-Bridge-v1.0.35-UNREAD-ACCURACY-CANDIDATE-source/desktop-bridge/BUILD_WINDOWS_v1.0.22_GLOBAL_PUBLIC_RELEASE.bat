@echo off
setlocal
cd /d "%~dp0"
echo === Lingua Bridge v1.0.22 GLOBAL PUBLIC RELEASE build ===
where node >nul 2>nul || (echo ERROR: Node.js is not installed.& pause & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm is not available.& pause & exit /b 1)
call npm install || (echo ERROR: npm install failed.& pause & exit /b 1)
call npm run qa || (echo ERROR: Desktop QA failed.& pause & exit /b 1)
call npm run build:web || (echo ERROR: Renderer build failed.& pause & exit /b 1)
if exist release-v1.0.22-public rmdir /s /q release-v1.0.22-public

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
for %%F in (release-v1.0.22-public\*.exe release-v1.0.22-public\*.zip) do if exist "%%F" powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 '%%F').Hash.ToLower(); Write-Host ('  '+$h+'  %%~nxF')"
for %%F in (release-v1.0.22-public\*.exe) do if exist "%%F" powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 '%%F').Hash.ToLower(); @('Lingua Bridge v1.0.22','Installer=%%~nxF','SHA256='+$h,'','Vercel Production values:','DOWNLOAD_ACCESS_MODE=public','DOWNLOAD_WINDOWS_URL=<PASTE_DIRECT_HTTPS_RELEASE_ASSET_URL>','DESKTOP_STABLE_VERSION=1.0.22','DESKTOP_STABLE_WINDOWS_URL=<PASTE_SAME_DIRECT_HTTPS_RELEASE_ASSET_URL>','DESKTOP_STABLE_WINDOWS_SHA256='+$h,'DESKTOP_STABLE_RELEASE_NOTES=Lingua Bridge v1.0.22 global public release','DESKTOP_STABLE_MANDATORY=false') ^| Set-Content -Encoding UTF8 'release-v1.0.22-public\PUBLIC_RELEASE_INFO.txt'"
echo.
echo Output: %CD%\release-v1.0.22-public
echo Release helper: %CD%\release-v1.0.22-public\PUBLIC_RELEASE_INFO.txt
start "" explorer "%CD%\release-v1.0.22-public"
pause
