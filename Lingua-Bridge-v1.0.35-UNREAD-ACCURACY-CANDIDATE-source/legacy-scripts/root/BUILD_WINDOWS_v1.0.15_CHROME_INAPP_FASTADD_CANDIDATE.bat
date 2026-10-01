@echo off
setlocal
cd /d "%~dp0desktop-bridge"
if not exist "BUILD_WINDOWS_v1.0.15_CHROME_INAPP_FASTADD_CANDIDATE.bat" (
  echo ERROR: desktop-bridge build helper was not found.
  pause
  exit /b 1
)
call BUILD_WINDOWS_v1.0.15_CHROME_INAPP_FASTADD_CANDIDATE.bat
