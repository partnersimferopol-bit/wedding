@echo off
cd /d "%~dp0"
echo.
echo Cloudflare Worker setup
echo.

if not exist "cloudflare-credentials.local.txt" (
  echo ERROR: missing cloudflare-credentials.local.txt
  echo Create it: line 1 = API token, line 2 = Account ID
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\setup-with-token.ps1"
echo.
pause
