@echo off
setlocal
cd /d "%~dp0desktop-bridge"
call BUILD_WINDOWS_v1.0.13_DRAG_LOGO_BURMESE_CANDIDATE.bat
exit /b %ERRORLEVEL%
