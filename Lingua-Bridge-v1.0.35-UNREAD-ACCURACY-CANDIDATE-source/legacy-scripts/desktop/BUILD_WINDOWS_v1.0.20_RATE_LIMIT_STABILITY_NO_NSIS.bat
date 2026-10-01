@echo off
setlocal
cd /d "%~dp0"
echo === Lingua v1.0.20 Rate Limit Stability Candidate - NO NSIS ZIP ===
where node >nul 2>nul || (echo ERROR: Node.js is required.& pause & exit /b 1)
if not exist node_modules call npm install
call npm run qa || (echo ERROR: Desktop QA failed.& pause & exit /b 1)
call npm run build:win:no-nsis || (echo ERROR: Windows ZIP build failed.& pause & exit /b 1)
echo.
echo Build complete. Output:
echo   release-v1.0.20-rate-limit-stability-no-installer\
start "" explorer "%CD%\release-v1.0.20-rate-limit-stability-no-installer"
pause
