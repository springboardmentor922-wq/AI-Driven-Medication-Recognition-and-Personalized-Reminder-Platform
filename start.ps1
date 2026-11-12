# PillSync - All-in-One Service Launcher
$Root = $PSScriptRoot

Write-Host ""
Write-Host "Starting PillSync Backend and Frontend services..." -ForegroundColor Cyan
Write-Host ""

# 1. Start FastAPI Backend in a new window
Write-Host " [1/2] Launching Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell.exe -WorkingDirectory $Root -ArgumentList "-NoExit", "-Command", "& '.\backend\venv\Scripts\python.exe' 'backend\run.py'"

# 2. Start React Frontend in a new window
Write-Host " [2/2] Launching Frontend on http://127.0.0.1:5173..." -ForegroundColor Magenta
Start-Process powershell.exe -WorkingDirectory "$Root\frontend" -ArgumentList "-NoExit", "-Command", "npm run dev"

# 3. Wait 2 seconds and launch browser
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:5173/"

Write-Host ""
Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host "  • Frontend Web App: http://127.0.0.1:5173/" -ForegroundColor White
Write-Host "  • Backend Swagger:  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
