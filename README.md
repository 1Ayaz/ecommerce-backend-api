# Mubarak Fresh Chicken — Quick Commerce Platform

[![Live Demo](https://img.shields.io/badge/Live-shop.mubarakchicken.com-success?style=flat-square&logo=vercel)](https://shop.mubarakchicken.com)

> **Note for visitors:** The backend runs on a free tier and may take ~50 seconds to wake up on first load. Subsequent requests are instant.

A full-stack MERN quick commerce app I built for a local fresh chicken business. It handles the full customer-to-delivery flow across 3 store locations, with real-time order tracking, a vendor dashboard, and a delivery boy interface.

Live at [shop.mubarakchicken.com](https://shop.mubarakchicken.com)

---

## What it does

- **Customers** browse products, pick a delivery address, and place orders. The backend auto-assigns the nearest store using the Haversine formula and gives them a 4-digit delivery PIN for secure handoff.
- **Vendors** get real-time notifications (Socket.IO) when new orders arrive, accept/reject them, and assign a delivery boy from their store's driver pool.
- **Delivery boys** see only their assigned orders, update statuses (`out for delivery` → `delivered`), and confirm delivery with the customer's PIN.
- **Admin** manages products, categories, coupons, banners, store settings, and can view analytics across all stores.

---

## Tech stack

**Backend:** Node.js, Express, MongoDB (Mongoose), Firebase Admin SDK, Socket.IO, JWT

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Zustand, Socket.IO client

**Infrastructure:** Vercel (frontend) + Render (backend) + MongoDB Atlas

---

## Running locally

```bash
# 1. Clone the repo
git clone https://github.com/1Ayaz/ecommerce-backend-api.git
cd ecommerce-backend-api

# 2. Install dependencies
cd backend && npm install
cd ../client && npm install
cd ..

# 3. Set up environment variables
# Create backend/.env (see .env.example)
# Create client/.env with Firebase keys + VITE_API_URL

# 4. (Optional) Seed the database
npm run seed --prefix backend

# 5. Start dev servers
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## Seeded test accounts

After running the seeder:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mubarak.com | admin123 |
| Vendor (Rjy) | vendor1@mubarak.com | admin123 |
| Vendor (Kkd) | vendor2@mubarak.com | admin123 |
| Vendor (Vskp) | vendor3@mubarak.com | admin123 |

Customers sign in with Google or Email OTP via Firebase.

---

## Key implementation details

- **Location-based store assignment** — Haversine formula finds the nearest store to the customer's lat/lng
- **Financial snapshots** — Order prices are snapshotted at placement time so price changes don't affect existing orders
- **Forward-only status transitions** — `ALLOWED_TRANSITIONS` map enforces valid order lifecycle changes
- **OTP delivery confirmation** — Customers have a static 4-digit PIN; drivers enter it to confirm delivery
- **Real-time via Socket.IO** — Customers, vendors, and drivers get instant updates through scoped rooms (by user ID and store ID)
- **Role-based access** — JWT + middleware guards routes by role; vendors can only see/modify their own store's data
