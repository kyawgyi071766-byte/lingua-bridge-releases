@echo off
setlocal
cd /d "%~dp0"
echo =========================================================
echo Lingua Bridge v1.0.15 Chrome In-App + Fast Add Candidate
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
echo   release-v1.0.15-chrome-inapp-fastadd-candidate\
echo.
echo Opening installer folder now...
start "" explorer.exe "%CD%\release-v1.0.15-chrome-inapp-fastadd-candidate"
echo.
echo Chrome/Web behavior in this candidate:
echo - Add New ^> Chrome / Web opens inside Lingua.
echo - Back/Forward/Home/Reload/address-search controls are built in.
echo - Chrome/Web uses its own persistent session and skips messenger translation scanning for speed.
echo - Existing Signal, Telegram, WhatsApp and other services are unchanged.
echo.
echo Actual website speed still depends on your network and the destination website.
pause
exit /b 0

:fail
echo.
echo BUILD FAILED. Stable Lingua Bridge v1.0.9 was not changed.
pause
exit /b 1
