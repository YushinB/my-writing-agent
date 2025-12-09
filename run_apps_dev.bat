rem run development apps in Windows environment
@echo off
setlocal

rem Navigate to the project root directory
cd /d %~dp0..

echo "Running development applications..."

rem Open frontend dev in a new PowerShell window and pause after script ends
start "Frontend Dev" powershell -NoExit -Command "Set-Location -Path '%~dp0'; & '.\scripts\frontend_dev.ps1'; Read-Host 'Press Enter to close Frontend window...'"

rem Open backend dev in a new PowerShell window and pause after script ends
start "Backend Dev" powershell -NoExit -Command "Set-Location -Path '%~dp0'; & '.\scripts\backend_dev.ps1'; Read-Host 'Press Enter to close Backend window...'"