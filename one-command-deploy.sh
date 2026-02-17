#!/bin/bash
# Single command deployment - just run this!
set -e
echo "🚀 Starting deployment..."
sudo apt remove -y libnode-dev nodejs-doc npm 2>/dev/null || true && \
sudo dpkg --configure -a && \
sudo apt install -f -y && \
sudo apt update && \
sudo apt install -y curl git && \
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && \
sudo apt-get install -y nodejs && \
sudo npm install -g pm2 && \
sudo apt install -y nginx && \
sudo mkdir -p /var/www/mubarak && \
sudo chown $USER:$USER /var/www/mubarak && \
cd /var/www/mubarak && \
git clone https://github.com/1Ayaz/mubarak-fresh-chicken.git . && \
cd backend && npm install && \
cd ../client && npm install && npm run build && \
cd .. && mkdir -p logs && \
pm2 start ecosystem.config.js && pm2 save && \
sudo cp nginx.conf /etc/nginx/sites-available/mubarak && \
sudo ln -sf /etc/nginx/sites-available/mubarak /etc/nginx/sites-enabled/mubarak && \
sudo rm -f /etc/nginx/sites-enabled/default && \
sudo nginx -t && sudo systemctl restart nginx && \
sudo ufw allow 80/tcp 2>/dev/null || true && \
echo "✅ Deployment complete! Test at http://192.168.0.6" && \
pm2 status
