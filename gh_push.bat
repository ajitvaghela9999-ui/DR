@echo off
echo [PulsePoint] Deploying to GitHub using GitHub CLI (gh)...
echo.

:: 1. Check if gh is installed
gh --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: GitHub CLI (gh) is not installed. 
    echo Please install it from: https://cli.github.com/
    pause
    exit /b
)

:: 2. Check if logged in
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: You are not logged in to GitHub CLI.
    echo Running 'gh auth login'...
    gh auth login
)

:: 3. Create repository if it doesn't exist
echo Creating/Checking repository on GitHub...
:: Using folder name as repo name, sanitized
gh repo create pulsepoint-hospital-twin --public --source=. --remote=origin --push
if %errorlevel% neq 0 (
    echo.
    echo Repo might already exist. Trying to push to current remote...
    git add .
    git commit -m "feat: upgrade hospital digital twin experience"
    git push -u origin main --force
)

echo.
echo [PulsePoint] Done! Your code should be live on GitHub.
echo View it here: gh repo view --web
pause
