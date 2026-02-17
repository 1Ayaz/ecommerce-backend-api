# PowerShell Deployment Script for Mubarak Fresh Chicken
# Run this with: powershell -ExecutionPolicy Bypass -File deploy.ps1

$server = "192.168.0.6"
$username = "ayaz1"
$password = "ayaz2006"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mubarak Fresh Chicken - Auto Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Connecting to $username@$server..." -ForegroundColor Yellow
Write-Host ""

# Create deployment command
$deployCommand = "curl -fsSL https://raw.githubusercontent.com/1Ayaz/mubarak-fresh-chicken/master/auto-deploy.sh | bash"

# Method 1: Using SSH with password (requires sshpass or similar)
Write-Host "Starting deployment..." -ForegroundColor Yellow

try {
    # Using plink if available (PuTTY)
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "Using plink for deployment..." -ForegroundColor Green
        echo $password | plink -ssh $username@$server -pw $password $deployCommand
    }
    else {
        # Fallback to regular SSH (will prompt for password)
        Write-Host "Please enter password when prompted: $password" -ForegroundColor Yellow
        ssh $username@$server $deployCommand
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your app at:" -ForegroundColor Cyan
    Write-Host "  Local: http://192.168.0.6" -ForegroundColor White
    Write-Host ""
    Write-Host "Configure port forwarding to make it public!" -ForegroundColor Yellow
}
catch {
    Write-Host ""
    Write-Host "Deployment failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try manual deployment:" -ForegroundColor Yellow
    Write-Host "1. SSH into server: ssh $username@$server" -ForegroundColor White
    Write-Host "2. Password: $password" -ForegroundColor White
    Write-Host "3. Run: curl -fsSL https://raw.githubusercontent.com/1Ayaz/mubarak-fresh-chicken/master/auto-deploy.sh | bash" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
