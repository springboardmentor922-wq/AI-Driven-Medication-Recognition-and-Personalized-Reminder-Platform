@echo off
title PillSync Launcher
echo Starting PillSync Services...
start "PillSync Backend" /D "%~dp0" powershell.exe -NoExit -Command "& '.\backend\venv\Scripts\python.exe' 'backend\run.py'"
start "PillSync Frontend" /D "%~dp0frontend" powershell.exe -NoExit -Command "npm run dev"
timeout /t 2 >nul
start http://127.0.0.1:5173/
echo All services launched!
