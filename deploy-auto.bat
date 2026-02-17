@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Mubarak Fresh Chicken - Auto Deploy
echo ========================================
echo.

set SERVER=192.168.0.6
set USER=ayaz1
set PASSWORD=ayaz2006

echo Deploying to %USER%@%SERVER%...
echo.

REM Using sshpass equivalent for Windows (plink from PuTTY)
REM If you have plink installed, uncomment the line below
REM echo %PASSWORD% | plink -ssh %USER%@%SERVER% -pw %PASSWORD% "curl -fsSL https://raw.githubusercontent.com/1Ayaz/mubarak-fresh-chicken/master/auto-deploy.sh | bash"

REM Alternative: Using PowerShell with password
powershell -Command "$password = ConvertTo-SecureString 'ayaz2006' -AsPlainText -Force; $cred = New-Object System.Management.Automation.PSCredential ('ayaz1', $password); Invoke-Command -HostName 192.168.0.6 -Credential $cred -ScriptBlock { curl -fsSL https://raw.githubusercontent.com/1Ayaz/mubarak-fresh-chicken/master/auto-deploy.sh | bash }"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo PowerShell method failed. Trying SSH with password prompt...
    echo.
    echo Please enter password: ayaz2006
    echo.
    ssh %USER%@%SERVER% "bash -c 'curl -fsSL https://raw.githubusercontent.com/1Ayaz/mubarak-fresh-chicken/master/auto-deploy.sh | bash'"
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
pause
