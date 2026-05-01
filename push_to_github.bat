@echo off
echo.
echo [PulsePoint] Initializing GitHub Push...
echo.

git init
git remote add origin https://github.com/ajitvaghela9999-ui/DR.git
git add .
git commit -m "feat: upgrade AI diagnostic experience with premium UI and product visuals"
git branch -M main
git push -u origin main --force

echo.
echo [PulsePoint] Code pushed successfully to https://github.com/ajitvaghela9999-ui/DR.git
echo.
pause
