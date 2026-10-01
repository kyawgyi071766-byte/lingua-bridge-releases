@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo Lingua Bridge v1.0.17 - No Refresh + Multilang Candidate
echo NO-NSIS ZIP build (avoids WinShell.dll installer extraction)
echo ============================================================

where node >nul 2>nul || (echo ERROR: Node.js is required.& pause & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm is required.& pause & exit /b 1)

if not exist node_modules (
  echo [1/5] Installing dependencies...
  call npm install --no-audit --no-fund || (echo ERROR: npm install failed.& pause & exit /b 1)
) else (
  echo [1/5] Dependencies already installed.
)

echo [2/5] Running QA...
call npm run qa || (echo ERROR: QA failed. Stable Lingua was not changed.& pause & exit /b 1)

echo [3/5] Building static renderer...
call npm run build:web || (echo ERROR: renderer build failed.& pause & exit /b 1)

echo [4/5] Building Windows ZIP package without NSIS...
call npm run build:win:no-nsis || (echo ERROR: ZIP build failed.& pause & exit /b 1)

echo [5/5] Complete.
echo.
echo Output folder:
echo   release-v1.0.17-norefresh-multilang-no-installer\
echo.
echo IMPORTANT:
echo - Messaging webviews stay mounted when switching accounts; no normal switch reload.
echo - Broad languages require Microsoft Translator or Google Translate on the Lingua server.
echo - This build does NOT use NSIS, so it avoids the WinShell.dll installer issue.
echo - Stable Lingua v1.0.9 and Vercel production are not changed.
start "" explorer "%CD%\release-v1.0.17-norefresh-multilang-no-installer"
pause
