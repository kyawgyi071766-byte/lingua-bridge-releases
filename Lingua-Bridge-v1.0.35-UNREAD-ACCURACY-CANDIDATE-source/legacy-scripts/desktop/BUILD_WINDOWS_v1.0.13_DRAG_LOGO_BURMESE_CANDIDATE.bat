@echo off
setlocal
cd /d "%~dp0"
echo =========================================================
echo Lingua Bridge v1.0.13 Drag + Logo + Burmese Candidate
echo =========================================================
echo.
echo SAFE TEST BUILD: separate app ID/name.
echo Stable Lingua Bridge v1.0.9 is NOT replaced or modified.
echo.
where node >nul 2>&1 || (echo ERROR: Node.js is not installed.& pause & exit /b 1)
where npm >nul 2>&1 || (echo ERROR: npm is not installed.& pause & exit /b 1)
echo [1/4] Installing dependencies...
call npm install --no-audit --no-fund || goto :fail
echo [2/4] Running static QA...
call npm run qa || goto :fail
echo [3/4] Building candidate Windows installer...
call npm run build:win:candidate || goto :fail
echo [4/4] Complete.
echo.
echo Installer folder:
echo   release-v1.0.13-drag-logo-burmese-candidate\
echo.
echo Opening installer folder now...
start "" explorer.exe "%CD%\release-v1.0.13-drag-logo-burmese-candidate"
echo.
echo Test this Candidate side-by-side with stable Lingua Bridge v1.0.9.
echo IMPORTANT: Myanmar/Burmese incoming display needs the Lingua server
echo Google Cloud Translation provider to be configured and the matching
echo server language patch deployed. The stable production server is NOT
echo changed by this builder.
pause
exit /b 0

:fail
echo.
echo BUILD FAILED. Stable Lingua Bridge v1.0.9 was not changed.
pause
exit /b 1
