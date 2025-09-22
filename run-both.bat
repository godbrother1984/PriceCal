@echo off
echo ==========================================
echo  PriceCal Development Environment
echo ==========================================
echo Starting both Backend Server and Frontend Client...
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173 (Vite default)
echo.

:: Start Backend Server in new window
start "PriceCal Backend Server" cmd /k "cd server && npm run start:dev"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend Client in new window
start "PriceCal Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo Press any key to exit this launcher.
pause >nul