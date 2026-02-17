# Mubarak Fresh Chicken - Deployment Guide

## 🌐 Making Your App Publicly Accessible

Currently, your code is only on GitHub. To make it accessible to others on different networks, you need to deploy it to your home server.

---

## 📋 Prerequisites

1. **Home Server** running Linux (Ubuntu/Debian recommended)
2. **Public IP Address** or **Dynamic DNS** (like No-IP, DuckDNS)
3. **Port Forwarding** configured on your router (Port 80 and 443)
4. **Domain Name** (optional, but recommended)

---

## 🚀 Deployment Steps

### Step 1: Build Frontend for Production

```bash
cd client
npm run build
```

This creates optimized production files in `client/dist/`

### Step 2: Transfer Files to Home Server

**Option A: Using SCP (from Windows to Linux server)**
```bash
# Transfer frontend build
scp -r client/dist/* user@192.168.0.6:/var/www/mubarak/client/dist/

# Transfer backend
scp -r backend/* user@192.168.0.6:/var/www/mubarak/backend/
```

**Option B: Using Git (Recommended)**
```bash
# On your home server
ssh user@192.168.0.6
cd /var/www/mubarak
git clone https://github.com/1Ayaz/mubarak-fresh-chicken.git .
cd client && npm install && npm run build
cd ../backend && npm install
```

### Step 3: Install Dependencies on Server

```bash
# SSH into your server
ssh user@192.168.0.6

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (web server)
sudo apt-get install nginx
```

### Step 4: Configure Backend to Run 24/7

```bash
cd /var/www/mubarak/backend

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mubarak-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF

# Start backend with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 5: Configure Nginx

```bash
# Copy nginx config
sudo cp /var/www/mubarak/nginx.conf /etc/nginx/sites-available/mubarak

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/mubarak /etc/nginx/sites-enabled/

# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 6: Configure Router Port Forwarding

**On your router admin panel** (usually http://192.168.0.1 or http://192.168.1.1):

1. Find **Port Forwarding** or **Virtual Server** settings
2. Add these rules:
   - **External Port**: 80 → **Internal IP**: 192.168.0.6 → **Internal Port**: 80
   - **External Port**: 443 → **Internal IP**: 192.168.0.6 → **Internal Port**: 443

### Step 7: Get Your Public IP

```bash
# Find your public IP
curl ifconfig.me
```

Example output: `203.0.113.45`

### Step 8: Test Access

**From a different network** (mobile data, friend's wifi):
```
http://YOUR_PUBLIC_IP
```

Example: `http://203.0.113.45`

---

## 🔒 Optional: Add HTTPS (SSL Certificate)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🌍 Optional: Use a Domain Name

Instead of accessing via IP (http://203.0.113.45), use a domain:

### Free Dynamic DNS Options:
1. **No-IP**: https://www.noip.com/
2. **DuckDNS**: https://www.duckdns.org/
3. **FreeDNS**: https://freedns.afraid.org/

### Steps:
1. Sign up for free dynamic DNS
2. Create a hostname (e.g., `mubarak.ddns.net`)
3. Point it to your public IP
4. Update Nginx config with your domain
5. Access via: `http://mubarak.ddns.net`

---

## 📊 Monitoring & Maintenance

### Check Backend Status
```bash
pm2 status
pm2 logs mubarak-backend
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Restart backend
pm2 restart mubarak-backend

# Restart nginx
sudo systemctl restart nginx
```

---

## 🔧 Update Deployment

When you push new code to GitHub:

```bash
# On your server
cd /var/www/mubarak
git pull origin master

# Rebuild frontend
cd client
npm install
npm run build

# Restart backend
cd ../backend
npm install
pm2 restart mubarak-backend
```

---

## ⚠️ Security Checklist

- [ ] Change default MongoDB password
- [ ] Use environment variables for secrets
- [ ] Enable firewall (ufw)
- [ ] Set up fail2ban for SSH protection
- [ ] Use HTTPS (SSL certificate)
- [ ] Regular backups of database
- [ ] Keep Node.js and dependencies updated

---

## 🎯 Quick Deployment Script

Save this as `deploy.sh` on your server:

```bash
#!/bin/bash
cd /var/www/mubarak
git pull origin master
cd client && npm install && npm run build
cd ../backend && npm install
pm2 restart mubarak-backend
sudo systemctl reload nginx
echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run it:
```bash
./deploy.sh
```

---

## 📱 Access URLs

### Local Network:
- Frontend: `http://192.168.0.6`
- Backend API: `http://192.168.0.6/api`

### Public Internet (after port forwarding):
- Frontend: `http://YOUR_PUBLIC_IP`
- Backend API: `http://YOUR_PUBLIC_IP/api`

### With Domain (after DNS setup):
- Frontend: `http://yourdomain.com`
- Backend API: `http://yourdomain.com/api`

---

## 🆘 Troubleshooting

### Can't access from outside network:
1. Check port forwarding is enabled
2. Verify firewall allows ports 80/443
3. Confirm public IP hasn't changed
4. Test with: `curl -I http://YOUR_PUBLIC_IP`

### Backend not running:
```bash
pm2 logs mubarak-backend
pm2 restart mubarak-backend
```

### Nginx errors:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### MongoDB connection issues:
```bash
sudo systemctl status mongod
sudo systemctl restart mongod
```

---

## 📞 Need Help?

Common issues and solutions:
1. **502 Bad Gateway**: Backend not running → `pm2 restart mubarak-backend`
2. **404 Not Found**: Nginx config wrong → Check `/etc/nginx/sites-enabled/mubarak`
3. **Can't connect**: Port forwarding not set → Check router settings
4. **Slow loading**: Enable gzip compression in Nginx (already in config)

---

## ✅ Deployment Checklist

- [ ] Build frontend (`npm run build`)
- [ ] Transfer files to server
- [ ] Install dependencies on server
- [ ] Configure PM2 for backend
- [ ] Configure Nginx
- [ ] Set up port forwarding on router
- [ ] Test local access (192.168.0.6)
- [ ] Test public access (public IP)
- [ ] (Optional) Set up domain name
- [ ] (Optional) Add HTTPS/SSL
- [ ] Set up monitoring
- [ ] Configure backups

---

**Current Status**: Code is on GitHub, but NOT publicly accessible yet. Follow the steps above to deploy to your home server.
