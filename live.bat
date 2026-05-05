@echo off
echo [PulsePoint] Preparing Live URL...
echo.

:: 1. Build the frontend
echo [1/3] Building frontend assets...
call npm run build

:: 2. Start the server and Localtunnel
echo [2/3] Starting server and generating live URL...
echo.
echo IMPORTANT: Keep this window open to keep the URL active!
echo.

:: Run server and localtunnel in parallel
start /b npx localtunnel --port 3000
npm run dev

pause
