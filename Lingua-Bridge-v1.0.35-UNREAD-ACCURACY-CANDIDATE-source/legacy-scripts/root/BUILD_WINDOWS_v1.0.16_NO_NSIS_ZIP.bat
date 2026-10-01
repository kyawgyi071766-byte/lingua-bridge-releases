@echo off
setlocal
cd /d "%~dp0"
if not exist "desktop-bridge\BUILD_WINDOWS_v1.0.16_NO_NSIS_ZIP.bat" (
  echo ERROR: desktop-bridge no-NSIS build script was not found.
  pause
  exit /b 1
)
cd /d "%~dp0desktop-bridge"
call BUILD_WINDOWS_v1.0.16_NO_NSIS_ZIP.bat
exit /b %errorlevel%
