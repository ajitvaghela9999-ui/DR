@echo off
echo [PulsePoint] Deploying to Vercel...
echo.

:: 1. Build
echo [1/2] Building project...
call npm run build

:: 2. Deploy
echo [2/2] Sending to Vercel...
call npx vercel --prod

echo.
echo Deployment attempt finished. Check the output above for your Vercel URL.
echo Note: You may need to login if you haven't already.
pause
