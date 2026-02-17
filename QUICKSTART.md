# 🚀 Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js v18+ installed
- [ ] MongoDB running (local or cloud)
- [ ] Firebase project created
- [ ] Google Cloud project with Places API enabled

---

## Step 1: Environment Setup

### Backend Environment
1. Copy `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Fill in your credentials in `.env`:
   - `MONGO_URI` - Your MongoDB connection string
   - `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin SDK JSON (as single-line string)
   - `GOOGLE_PLACES_API_KEY` - Google Places API key

### Frontend Environment
1. Copy `.env.example` to `.env`:
   ```bash
   cd client
   cp .env.example .env
   ```

2. Fill in your Firebase client config in `.env`:
   - Get these from Firebase Console → Project Settings → Your apps → Web app

---

## Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd client
npm install
```

---

## Step 3: Seed Database

```bash
cd backend
node seeder.js
```

**This creates:**
- 3 stores (Rajahmundry, Kakinada, Visakhapatnam)
- 3 vendors (vendor1@mubarak.com, vendor2@mubarak.com, vendor3@mubarak.com)
- 6 delivery boys
- Sample products with variations

**Login credentials will be displayed in console!**

---

## Step 4: Start Development Servers

### Terminal 1 - Backend
```bash
cd backend
npm start
```
**Runs on:** http://localhost:5000

### Terminal 2 - Frontend
```bash
cd client
npm run dev
```
**Runs on:** http://localhost:5173

---

## Step 5: Test the Application

### As Customer
1. Open http://localhost:5173
2. Register via Email or Google Sign-In
3. Enter location (use Rajahmundry, Kakinada, or Visakhapatnam)
4. Browse products and add to cart
5. Place order

### As Vendor
1. Login at http://localhost:5173 with:
   - Email: `vendor1@mubarak.com`
   - Password: `admin123`
2. View incoming orders
3. Accept order
4. Assign delivery boy

### As Delivery Boy
1. Login with phone number (check console after seeding)
2. View assigned orders
3. Update delivery status

---

## 🔧 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env`

### Firebase Error
- Verify Firebase credentials are correct
- Ensure Firebase Admin SDK JSON is properly formatted (single line)

### Google Places Not Working
- Check if API key is valid
- Ensure Places API is enabled in Google Cloud Console
- Verify billing is enabled

---

## 📚 Next Steps

1. **Customize Store Locations**: Edit `backend/seeder.js` to change store coordinates
2. **Add Real Images**: Replace placeholder Cloudinary URLs with actual product images
3. **Deploy**: Follow deployment guide in README.md
4. **Enhance**: Add admin panel, real-time updates, payment gateway

---

## 🎯 Default Login Credentials

**Admin:**
- Email: admin@mubarak.com
- Password: admin123

**Vendors:**
- vendor1@mubarak.com / admin123
- vendor2@mubarak.com / admin123
- vendor3@mubarak.com / admin123

**Delivery Boys:**
- Phone-based login (numbers displayed after seeding)

---

## 📞 Need Help?

Check the comprehensive [README.md](file:///C:/Users/mdaya/Desktop/MUBARAK%20WEBAPP/README.md) for detailed documentation.
