@echo off
setlocal
set "PROJECT_ROOT=C:\Users\aksha\OneDrive\Desktop\ZootechxCRM"

start "ZootechX Backend (Neon)" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%PROJECT_ROOT%\backend'; npm.cmd run dev"
start "ZootechX Frontend" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%PROJECT_ROOT%\frontend'; npm.cmd run dev"

endlocal
