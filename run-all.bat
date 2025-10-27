@echo off
echo ========================================
echo  Starting PriceCal System
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "PriceCal Backend" cmd /k "cd server && npm run start:dev"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Client...
start "PriceCal Frontend" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo  Both servers are starting...
echo ========================================
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to close this window...
pause > nul
