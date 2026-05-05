# PulsePoint AI Full Deployment Script

Write-Host "Starting Full Deployment for PulsePoint AI..." -ForegroundColor Cyan

# 1. Update GitHub Remote
$RepoUrl = "https://github.com/ajitvaghela9999-ui/pulsepoint-hospital-twin.git"
Write-Host "[1/3] Updating GitHub Remote to $RepoUrl..." -ForegroundColor Yellow
git remote set-url origin $RepoUrl

# 2. Push to GitHub
Write-Host "[2/3] Pushing code to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "feat: upgrade clinical insights vault and deploy"
git push -u origin main --force

# 3. Deploy to Vercel
Write-Host "[3/3] Deploying to Vercel..." -ForegroundColor Yellow
npm run build
npx vercel --prod --yes

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "Live Project: https://dr-pi-mocha.vercel.app/ (or your new Vercel URL)"
Write-Host "GitHub Repo: https://github.com/ajitvaghela9999-ui/pulsepoint-hospital-twin"
