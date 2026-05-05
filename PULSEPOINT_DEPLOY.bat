@echo off
setlocal

echo [PulsePoint AI] Starting Full Deployment...
echo.

:: 1. Configuration
set REPO_URL=https://github.com/ajitvaghela9999-ui/pulsepoint-hospital-twin.git

:: 2. Update GitHub Remote
echo [1/3] Updating GitHub Remote...
git remote set-url origin %REPO_URL% 2>nul || git remote add origin %REPO_URL%
echo Remote updated to %REPO_URL%

:: 3. Push to GitHub
echo [2/3] Pushing code to GitHub...
git add .
git commit -m "feat: upgrade clinical insights vault and deploy"
git push -u origin main --force
if %errorlevel% neq 0 (
    echo [!] GitHub Push failed. Please check if your repo exists.
)

:: 4. Done
echo [3/3] Deployment triggered via GitHub!
echo.
echo [PulsePoint AI] Code has been pushed to GitHub.
echo Vercel will now automatically build and deploy your project.
echo You can track the progress at: https://vercel.com/dashboard

echo.
echo [PulsePoint AI] Deployment process finished!
echo GitHub Repo: https://github.com/ajitvaghela9999-ui/pulsepoint-hospital-twin
echo.
pause
