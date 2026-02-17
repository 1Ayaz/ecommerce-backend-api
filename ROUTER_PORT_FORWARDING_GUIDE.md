# 🔒 ROUTER PORT FORWARDING GUIDE

## ✅ Is Port Forwarding Safe?

**YES, it's completely safe!** Port forwarding is a standard practice used by millions of websites and home servers worldwide. Here's what you need to know:

### What Port Forwarding Does:
- ✅ Allows external users to access your web server on port 80
- ✅ Only opens port 80 (HTTP) - nothing else
- ✅ Traffic goes directly to your server (192.168.0.6), not other devices
- ✅ Your router's firewall still protects other ports and devices

### Security Tips:
- ✅ Only open port 80 (HTTP) and 443 (HTTPS) - nothing else
- ✅ Your server has Nginx as a reverse proxy (extra security layer)
- ✅ Keep your server software updated
- ✅ Use strong passwords (you already have ayaz2006)
- ✅ Later, add HTTPS/SSL for encrypted connections

---

## 🎯 STEP-BY-STEP GUIDE TO CONFIGURE YOUR ROUTER

### Your Router Credentials:
- **Username:** admin
- **Password:** Admin@123
- **Router IP:** Usually 192.168.0.1 or 192.168.1.1

---

## STEP 1: Access Router Admin Panel

1. **Open your web browser** (Chrome, Firefox, Edge)

2. **Type one of these addresses** in the address bar:
   ```
   http://192.168.0.1
   ```
   OR
   ```
   http://192.168.1.1
   ```

3. **Press Enter**

4. **Login Screen will appear:**
   - Username: `admin`
   - Password: `Admin@123`

5. **Click Login**

---

## STEP 2: Find Port Forwarding Settings

Port forwarding might be called different names depending on your router brand:

### Common Names:
- **Port Forwarding**
- **Virtual Server**
- **NAT Forwarding**
- **Applications & Gaming**
- **Firewall** → **Port Forwarding**
- **Advanced** → **Port Forwarding**

### Where to Look:
1. Look for **"Advanced"** or **"Advanced Settings"** menu
2. Then look for **"NAT"** or **"Forwarding"**
3. Click on **"Port Forwarding"** or **"Virtual Server"**

---

## STEP 3: Add Port Forwarding Rule

Once you're in the Port Forwarding section, click **"Add"** or **"Add New"** or **"+"**

### Fill in these details:

| Field | Value | Notes |
|-------|-------|-------|
| **Service Name** | Mubarak | Any name you want |
| **External Port** | 80 | Port from internet |
| **Internal IP** | 192.168.0.6 | Your server IP |
| **Internal Port** | 80 | Port on your server |
| **Protocol** | TCP | Or "TCP/UDP" or "Both" |
| **Status** | Enabled | Or check "Enable" |

### Example Screenshots for Different Routers:

**TP-Link Router:**
```
Service Name: Mubarak
External Port: 80
Internal IP: 192.168.0.6
Internal Port: 80
Protocol: TCP
```

**D-Link Router:**
```
Name: Mubarak
Public Port: 80
Private IP: 192.168.0.6
Private Port: 80
Protocol: TCP
```

**Netgear Router:**
```
Service Name: Mubarak
External Starting Port: 80
External Ending Port: 80
Internal Starting Port: 80
Internal Ending Port: 80
Internal IP Address: 192.168.0.6
```

---

## STEP 4: Save and Apply

1. **Click "Save"** or **"Apply"** or **"OK"**
2. **Wait for router to apply settings** (10-30 seconds)
3. Some routers may ask you to **reboot** - if so, click "Reboot" or "Restart"

---

## STEP 5: Verify Port Forwarding

### Test from Local Network:
1. Open browser
2. Go to: `http://192.168.0.6`
3. You should see your Mubarak app

### Test from Internet:
1. Find your public IP:
   - Go to: https://whatismyipaddress.com/
   - Or run: `curl ifconfig.me` in terminal

2. **From your phone (using mobile data, NOT WiFi):**
   - Open browser
   - Go to: `http://YOUR_PUBLIC_IP`
   - You should see your Mubarak app!

---

## 🔧 COMMON ROUTER BRANDS - SPECIFIC INSTRUCTIONS

### TP-Link Router:
1. Login to http://192.168.0.1
2. Go to: **Advanced** → **NAT Forwarding** → **Virtual Servers**
3. Click **Add**
4. Fill in the details above
5. Click **Save**

### D-Link Router:
1. Login to http://192.168.0.1
2. Go to: **Advanced** → **Port Forwarding**
3. Click **Add**
4. Fill in the details above
5. Click **Save Settings**

### Netgear Router:
1. Login to http://192.168.0.1
2. Go to: **Advanced** → **Advanced Setup** → **Port Forwarding/Port Triggering**
3. Select **Port Forwarding**
4. Click **Add Custom Service**
5. Fill in the details above
6. Click **Apply**

### Linksys Router:
1. Login to http://192.168.1.1
2. Go to: **Security** → **Apps and Gaming**
3. Click **Single Port Forwarding** tab
4. Fill in the details above
5. Click **Save Settings**

### Asus Router:
1. Login to http://192.168.1.1
2. Go to: **WAN** → **Virtual Server / Port Forwarding**
3. Click **Add profile**
4. Fill in the details above
5. Click **Apply**

---

## 🆘 TROUBLESHOOTING

### Can't Access Router (192.168.0.1 doesn't work):
1. Try http://192.168.1.1
2. Try http://192.168.1.254
3. Try http://10.0.0.1
4. Check your router's label (usually on bottom)
5. Run this command to find it:
   ```
   ipconfig | findstr "Default Gateway"
   ```

### Wrong Password:
- Try: admin / admin
- Try: admin / password
- Try: admin / (blank)
- Check router label for default password
- You may need to reset router (hold reset button 10 seconds)

### Port Forwarding Not Working:
1. **Check if server is running:**
   ```
   ssh ayaz1@192.168.0.6
   pm2 status
   sudo systemctl status nginx
   ```

2. **Check firewall on server:**
   ```
   sudo ufw status
   sudo ufw allow 80/tcp
   ```

3. **Restart router:**
   - Unplug power for 30 seconds
   - Plug back in
   - Wait 2 minutes for it to fully boot

4. **Check if ISP blocks port 80:**
   - Some ISPs block port 80 for residential connections
   - Try port 8080 instead
   - Or contact your ISP

---

## 🎯 QUICK CHECKLIST

- [ ] Login to router (http://192.168.0.1)
- [ ] Find Port Forwarding section
- [ ] Add new rule:
  - [ ] External Port: 80
  - [ ] Internal IP: 192.168.0.6
  - [ ] Internal Port: 80
  - [ ] Protocol: TCP
- [ ] Save and apply
- [ ] Test locally: http://192.168.0.6
- [ ] Find public IP: https://whatismyipaddress.com/
- [ ] Test from phone (mobile data): http://YOUR_PUBLIC_IP

---

## 🔒 SECURITY RECOMMENDATIONS

After port forwarding is working:

1. **Add HTTPS (SSL Certificate):**
   ```bash
   ssh ayaz1@192.168.0.6
   sudo apt install certbot python3-certbot-nginx
   # You'll need a domain name for this
   ```

2. **Set up firewall:**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   ```

3. **Keep server updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Monitor logs:**
   ```bash
   pm2 logs mubarak-backend
   sudo tail -f /var/log/nginx/access.log
   ```

---

## 📞 NEED HELP?

If you get stuck at any step:

1. **Take a screenshot** of your router's port forwarding page
2. **Note your router brand and model** (check the label)
3. **Check if you can access** http://192.168.0.6 locally

Common router admin panels:
- TP-Link: http://tplinkwifi.net
- Netgear: http://routerlogin.net
- Asus: http://router.asus.com
- D-Link: http://dlinkrouter.local

---

## ✅ SUMMARY

**Port forwarding is SAFE and necessary for hosting websites!**

**What you're doing:**
- Opening port 80 on your router
- Directing internet traffic to your server (192.168.0.6)
- Allowing people to access your Mubarak Fresh Chicken app

**What you're NOT doing:**
- Exposing your entire network
- Opening all ports
- Disabling your firewall
- Making your network vulnerable

**After configuration:**
- Your app will be accessible from anywhere in the world
- Only port 80 traffic goes to your server
- All other devices remain protected
- Your router firewall still works

---

**You're all set! Follow the steps above and your app will be live!** 🚀
