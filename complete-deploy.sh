#!/bin/bash

# Mubarak Fresh Chicken - Complete Deployment Script
# Run this directly on your server (192.168.0.6)

set -e

echo "🚀 Mubarak Fresh Chicken - Complete Deployment"
echo "================================================"
echo ""

# Fix Node.js conflicts first
echo "Step 1: Fixing Node.js installation conflicts..."
sudo apt remove -y libnode-dev nodejs-doc npm 2>/dev/null || true
sudo dpkg --configure -a
sudo apt install -f -y

# Clean up and update
echo "Step 2: Updating system..."
sudo apt update
sudo apt install -y curl git

# Install Node.js 20 (clean install)
echo "Step 3: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
echo "Node.js version:"
node --version
echo "NPM version:"
npm --version

# Install PM2
echo "Step 4: Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "Step 5: Installing Nginx..."
sudo apt install -y nginx

# Create app directory
echo "Step 6: Setting up application directory..."
sudo mkdir -p /var/www/mubarak
sudo chown $USER:$USER /var/www/mubarak
cd /var/www/mubarak

# Clone repository
echo "Step 7: Cloning repository..."
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest..."
    git pull origin master
else
    git clone https://github.com/1Ayaz/mubarak-fresh-chicken.git .
fi

# Install backend dependencies
echo "Step 8: Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "Step 9: Installing frontend dependencies..."
cd ../client
npm install

# Build frontend
echo "Step 10: Building frontend (this may take 2-3 minutes)..."
npm run build

# Create logs directory
echo "Step 11: Creating logs directory..."
cd ..
mkdir -p logs

# Stop any existing PM2 processes
echo "Step 12: Stopping existing processes..."
pm2 delete mubarak-backend 2>/dev/null || true

# Start backend with PM2
echo "Step 13: Starting backend with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
echo "Step 14: Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/mubarak
sudo ln -sf /etc/nginx/sites-available/mubarak /etc/nginx/sites-enabled/mubarak
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Step 15: Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Step 16: Restarting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Configure firewall
echo "Step 17: Configuring firewall..."
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true
sudo ufw allow 22/tcp 2>/dev/null || true

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================"
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
echo "🎉 Your Mubarak Fresh Chicken app is now live!"
