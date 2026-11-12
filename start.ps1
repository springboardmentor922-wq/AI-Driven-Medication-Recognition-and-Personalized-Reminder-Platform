# ==========================================
# PillSync - All-in-One Service Launcher
# ==========================================

Write-Host "`n🚀 Starting PillSync Services (Backend + Frontend)...`n" -ForegroundColor Cyan

# 1. Launch FastAPI Backend in a dedicated window
Write-Host " [1/2] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'PillSync - Backend API'; Write-Host '⚡ FastAPI Backend Server Running on http://127.0.0.1:8000' -ForegroundColor Green; Write-Host '📖 Swagger Docs: http://127.0.0.1:8000/docs`n' -ForegroundColor Yellow; .\backend\venv\Scripts\python.exe backend\run.py"

# 2. Launch React Frontend in a dedicated window
Write-Host " [2/2] Launching React Frontend on http://127.0.0.1:5173..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'PillSync - React Frontend'; Write-Host '⚛️ React Frontend Running on http://127.0.0.1:5173`n' -ForegroundColor Magenta; Set-Location frontend; npm run dev"

# 3. Allow services 2 seconds to initialize, then launch the browser
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:5173/"

Write-Host "`n✅ All services started successfully!" -ForegroundColor Green
Write-Host "   • Web App:     http://127.0.0.1:5173/" -ForegroundColor White
Write-Host "   • API Docs:    http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "   • Healthcheck: http://127.0.0.1:8000/api/v1/health`n" -ForegroundColor White
