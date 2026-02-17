#!/bin/bash

# Mubarak Fresh Chicken - Quick Deployment Script
# Run this on your home server after initial setup

set -e  # Exit on error

echo "🚀 Starting Mubarak Fresh Chicken deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/mubarak"
REPO_URL="https://github.com/1Ayaz/mubarak-fresh-chicken.git"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please do not run as root${NC}"
    exit 1
fi

# Navigate to app directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}📁 Creating app directory...${NC}"
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
fi

cd $APP_DIR

# Clone or pull latest code
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone $REPO_URL .
else
    echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
    git pull origin master
fi

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install --production

# Install frontend dependencies and build
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd ../client
npm install
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build

# Create logs directory
mkdir -p ../logs

# Restart backend with PM2
echo -e "${YELLOW}🔄 Restarting backend...${NC}"
cd ..
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
pm2 save

# Reload Nginx
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
sudo systemctl reload nginx

# Check status
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Backend Status:"
pm2 status

echo ""
echo "🌐 Access your app at:"
echo "   Local: http://192.168.0.6"
echo "   Public: http://$(curl -s ifconfig.me)"
echo ""
echo "📝 View logs:"
echo "   Backend: pm2 logs mubarak-backend"
echo "   Nginx: sudo tail -f /var/log/nginx/access.log"
