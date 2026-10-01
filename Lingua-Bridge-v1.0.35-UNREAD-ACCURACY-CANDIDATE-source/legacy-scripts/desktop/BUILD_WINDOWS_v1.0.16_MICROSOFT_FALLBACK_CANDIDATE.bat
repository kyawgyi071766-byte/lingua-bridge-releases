@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo Lingua Bridge v1.0.16 Microsoft Fallback Candidate
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

echo [4/5] Building Windows candidate installer...
call npm run build:win:candidate || (echo ERROR: installer build failed.& pause & exit /b 1)

echo [5/5] Complete.
echo.
echo Installer folder:
echo   release-v1.0.16-microsoft-fallback-candidate\
echo.
echo IMPORTANT: Microsoft fallback requires server-side Azure credentials.
echo This candidate does NOT change stable v1.0.9 or Vercel production.
start "" explorer "%CD%\release-v1.0.16-microsoft-fallback-candidate"
pause
