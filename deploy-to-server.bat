@echo off
echo ========================================
echo Mubarak Fresh Chicken - Deploy to Server
echo ========================================
echo.

set SERVER=192.168.0.6
set USER=mdaya

echo Connecting to %SERVER%...
echo.
echo Please enter your server password when prompted.
echo.
echo The deployment script will:
echo  - Install all required software
echo  - Clone your GitHub repository
echo  - Build and deploy the application
echo  - Configure Nginx web server
echo  - Start the backend service
echo.

ssh %USER%@%SERVER% "bash -c 'curl -fsSL https://raw.githubusercontent.com/1Ayaz/mubarak-fresh-chicken/master/auto-deploy.sh | bash'"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo Deployment failed! Trying alternative method...
    echo ========================================
    echo.
    
    ssh %USER%@%SERVER% "cd ~ && git clone https://github.com/1Ayaz/mubarak-fresh-chicken.git mubarak-temp 2>/dev/null || (cd mubarak-temp && git pull) && cd mubarak-temp && chmod +x auto-deploy.sh && ./auto-deploy.sh"
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your app is now running at:
echo   Local: http://192.168.0.6
echo.
echo To make it publicly accessible:
echo 1. Configure port forwarding on your router
echo 2. Forward port 80 to 192.168.0.6
echo.
echo Press any key to exit...
pause >nul
