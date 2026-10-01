$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20+ is required.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'npm is required.' }

npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
npm run qa
if ($LASTEXITCODE -ne 0) { throw 'Desktop QA failed. No installer was released.' }
npm run build:win:public
if ($LASTEXITCODE -ne 0) { throw 'Windows installer build failed.' }

$installer = Join-Path $PSScriptRoot 'release-v1.0.35-public/Lingua-Bridge-Setup-1.0.35.exe'
if (-not (Test-Path $installer)) { throw "Installer not found: $installer" }
$hash = (Get-FileHash -Path $installer -Algorithm SHA256).Hash.ToLowerInvariant()
$sumFile = Join-Path (Split-Path $installer) 'SHA256SUMS.txt'
"$hash  Lingua-Bridge-Setup-1.0.35.exe" | Set-Content -Path $sumFile -Encoding ascii
Write-Host "Installer: $installer"
Write-Host "SHA-256: $hash"
Write-Host "Checksum file: $sumFile"
Write-Host 'Test the installed app on Windows before publishing these files.'
