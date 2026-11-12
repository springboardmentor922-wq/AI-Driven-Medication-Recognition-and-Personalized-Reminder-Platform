@echo off
title PillSync Launcher
echo Starting PillSync Services...
start "PillSync - Backend API" powershell -NoExit -Command "Write-Host 'FastAPI Backend running on http://127.0.0.1:8000'; .\backend\venv\Scripts\python.exe backend\run.py"
start "PillSync - React Frontend" powershell -NoExit -Command "Write-Host 'React Frontend running on http://127.0.0.1:5173'; cd frontend; npm run dev"
timeout /t 2 >nul
start http://127.0.0.1:5173/
echo All services launched!
