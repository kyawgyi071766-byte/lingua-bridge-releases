@echo off
setlocal
cd /d "%~dp0"
if not exist "desktop-bridge\BUILD_WINDOWS_v1.0.16_MICROSOFT_FALLBACK_CANDIDATE.bat" (
  echo ERROR: desktop-bridge build script was not found.
  pause
  exit /b 1
)
cd /d "%~dp0desktop-bridge"
call BUILD_WINDOWS_v1.0.16_MICROSOFT_FALLBACK_CANDIDATE.bat
exit /b %errorlevel%
