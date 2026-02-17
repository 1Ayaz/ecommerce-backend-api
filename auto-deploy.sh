#!/bin/bash

# Mubarak Fresh Chicken - Complete Auto-Deployment Script
# Run this script on your home server (192.168.0.6)

set -e

echo "🚀 Mubarak Fresh Chicken - Auto Deployment Starting..."

# Configuration
APP_DIR="/var/www/mubarak"
REPO_URL="https://github.com/1Ayaz/mubarak-fresh-chicken.git"
NGINX_CONF="/etc/nginx/sites-available/mubarak"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1/10: Checking prerequisites...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Installing Git...${NC}"
    sudo apt-get install -y git
fi

echo -e "${GREEN}✓ Prerequisites installed${NC}"

echo -e "${YELLOW}Step 2/10: Creating application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
echo -e "${GREEN}✓ Directory created${NC}"

echo -e "${YELLOW}Step 3/10: Cloning repository...${NC}"
cd $APP_DIR
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    git pull origin master
else
    git clone $REPO_URL .
fi
echo -e "${GREEN}✓ Repository cloned${NC}"

echo -e "${YELLOW}Step 4/10: Installing backend dependencies...${NC}"
cd backend
npm install --production
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "${YELLOW}Step 5/10: Installing frontend dependencies...${NC}"
cd ../client
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

echo -e "${YELLOW}Step 6/10: Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built${NC}"

echo -e "${YELLOW}Step 7/10: Creating logs directory...${NC}"
mkdir -p ../logs
echo -e "${GREEN}✓ Logs directory created${NC}"

echo -e "${YELLOW}Step 8/10: Starting backend with PM2...${NC}"
cd ..
pm2 delete mubarak-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
echo -e "${GREEN}✓ Backend started${NC}"

echo -e "${YELLOW}Step 9/10: Configuring Nginx...${NC}"
sudo cp nginx.conf $NGINX_CONF
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/mubarak
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx configured${NC}"

echo -e "${YELLOW}Step 10/10: Configuring firewall...${NC}"
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true
echo -e "${GREEN}✓ Firewall configured${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📊 Backend Status:"
pm2 status
echo ""
echo "🌐 Access URLs:"
echo "   Local Network: http://192.168.0.6"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Unable to fetch")
echo "   Public IP: http://$PUBLIC_IP"
echo ""
echo "📝 Useful Commands:"
echo "   View backend logs: pm2 logs mubarak-backend"
echo "   Restart backend: pm2 restart mubarak-backend"
echo "   View Nginx logs: sudo tail -f /var/log/nginx/access.log"
echo "   Restart Nginx: sudo systemctl restart nginx"
echo ""
echo "⚠️  IMPORTANT: Configure port forwarding on your router:"
echo "   External Port 80 → Internal IP 192.168.0.6 → Internal Port 80"
echo ""
