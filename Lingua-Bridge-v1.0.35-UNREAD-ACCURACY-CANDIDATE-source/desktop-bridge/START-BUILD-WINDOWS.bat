@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0BUILD_WINDOWS_v1.0.35_RELEASE.ps1"
set "BUILD_EXIT=%ERRORLEVEL%"
echo.
if not "%BUILD_EXIT%"=="0" echo Build failed. Please send a screenshot of this window.
if "%BUILD_EXIT%"=="0" echo Build finished. Check the release-v1.0.35-public folder.
pause
exit /b %BUILD_EXIT%
