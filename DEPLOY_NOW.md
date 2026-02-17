# 🚀 ONE-COMMAND DEPLOYMENT

Copy and paste this **ONE COMMAND** into your home server terminal (192.168.0.6):

```bash
curl -fsSL https://raw.githubusercontent.com/1Ayaz/mubarak-fresh-chicken/master/auto-deploy.sh | bash
```

## OR Manual Deployment (if above doesn't work):

### Step 1: SSH into your server
```bash
ssh ayaz1@192.168.0.6
# Password: ayaz2006
```

### Step 2: Run these commands
```bash
# Download and run deployment script
cd ~
git clone https://github.com/1Ayaz/mubarak-fresh-chicken.git mubarak-temp
cd mubarak-temp
chmod +x auto-deploy.sh
./auto-deploy.sh
```

That's it! The script will:
- ✅ Install Node.js, PM2, Nginx, Git
- ✅ Clone your repository
- ✅ Install all dependencies
- ✅ Build frontend
- ✅ Start backend with PM2
- ✅ Configure Nginx
- ✅ Set up firewall

## After Deployment:

### 1. Test Local Access
Open browser: `http://192.168.0.6`

### 2. Configure Router for Public Access
1. Open router admin panel (usually http://192.168.0.1)
2. Find "Port Forwarding" or "Virtual Server"
3. Add rule:
   - External Port: **80**
   - Internal IP: **192.168.0.6**
   - Internal Port: **80**
   - Protocol: **TCP**
4. Save and apply

### 3. Find Your Public IP
```bash
curl ifconfig.me
```

### 4. Test Public Access
From your phone (using mobile data, NOT WiFi):
```
http://YOUR_PUBLIC_IP
```

## Troubleshooting:

### If deployment fails:
```bash
# Check logs
sudo tail -f /var/log/nginx/error.log
pm2 logs mubarak-backend
```

### If port 80 is already in use:
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop conflicting service (e.g., Apache)
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### If MongoDB connection fails:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Update Deployment:

When you push new code to GitHub, update your server:
```bash
ssh mdaya@192.168.0.6
cd /var/www/mubarak
./deploy.sh
```

## Status Check:

```bash
# Backend status
pm2 status

# Nginx status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/access.log
```

---

**That's it! Your app will be live and accessible from anywhere in the world!** 🎉
