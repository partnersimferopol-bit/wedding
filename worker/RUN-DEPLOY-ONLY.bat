@echo off
cd /d "%~dp0"
echo Loading credentials and deploying...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\deploy-only.ps1"
pause
