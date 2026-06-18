@echo off
cd /d "%~dp0"
echo Testing connection to Cloudflare...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { $r = Invoke-WebRequest -Uri 'https://api.cloudflare.com/client/v4/' -UseBasicParsing -TimeoutSec 20; Write-Host 'OK - status' $r.StatusCode -ForegroundColor Green } catch { Write-Host 'FAIL:' $_.Exception.Message -ForegroundColor Red }"
echo.
echo Open in browser: https://api.cloudflare.com/client/v4/
echo.
pause
