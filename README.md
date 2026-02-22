# Mubarak Fresh Chicken - Quick Commerce Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-shop.mubarakchicken.com-success?style=for-the-badge&logo=vercel)](https://shop.mubarakchicken.com)

> **⚠️ Important Note for Recruiters & Evaluators:**
> **The backend is hosted on a free tier service and may take up to 50 seconds to wake up upon your first request (initial load or login). Please be patient during the first interaction. Subsequent requests will be fast and responsive.**

A clean, production-ready Quick Commerce web application built with the MERN stack. Single-brand platform with 3 fixed stores, location-based service assignment, real-time order tracking, and role-based order management.

## 🔗 Live Application
**Live Link:** [https://shop.mubarakchicken.com](https://shop.mubarakchicken.com)

---

## 🚀 Tech Stack

### Backend
- **Node.js** + **Express.js**: Core server infrastructure.
- **MongoDB** with Mongoose: Database modeling and management.
- **Firebase Admin SDK**: Secure server-side authentication validation.
- **Socket.IO**: Real-time bidirectional event-based communication for order updates.
- **JWT**: For session and role management.

### Frontend
- **React 18** with Vite: Fast, modern UI development.
- **Tailwind CSS**: Utility-first styling for premium UI.
- **Framer Motion**: Smooth page transitions and micro-animations.
- **Zustand**: Lightweight and fast global state management.
- **Socket.IO Client**: Real-time connection with the backend.
- **Google Places API**: For precise location and address autocomplete.

---

## 👥 User Roles & Application Flow

The application is structured around a centralized admin managing multiple stores, with dedicated roles for customers, vendors, and delivery personnel.

### 1. Customer Flow
- **Registration/Login**: Users create an account or log in seamlessly using Google Sign-In or Email/OTP via Firebase Authentication.
- **Location Selection**: Google Places API helps customers set their delivery address. The backend uses the Haversine formula to assign the nearest fulfillment store.
- **Shopping**: Customers browse store-specific products, select variations (e.g., 500g, 1kg), and manage their cart.
- **Checkout & Tracking**: Upon placing an order, customers see a real-time order tracking dashboard (powered by Socket.IO) updating from "Placed" to "Delivered".

### 2. Vendor (Store Manager) Flow
*Each of the 3 stores (Rajahmundry, Kakinada, Visakhapatnam) has a dedicated vendor assigned by the Admin.*
- **Order Management**: Vendors receive real-time notifications of new orders.
- **Processing**: Vendors can Accept or Reject incoming orders.
- **Assignment**: Once accepted, vendors use their dashboard to assign the order to an available Delivery Boy registered to their specific store.

### 3. Delivery Personnel Flow
- **Access**: Delivery boys log in to a dedicated interface.
- **Execution**: They see only orders assigned specifically to them safely scoped by store ownership.
- **Status Updates**: They update the order status (`out for delivery` → `delivered`), transparently notifying both the vendor and the customer in real-time.

### 4. Admin Flow
- **Platform Management**: The Super Admin oversees the entire platform, including managing banners, creating base products, generating global coupons, and viewing overarching analytics.

---

## 📦 How to Run the Project Locally

To run the application locally on your machine, follow these steps:

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance or MongoDB Atlas)
- Firebase Project (for Authentication)
- Google Cloud Console Project (for Google Places API Key)

### 1. Clone the Repository
```bash
git clone https://github.com/1Ayaz/ecommerce-backend-api.git
cd MUBARAK-WEBAPP
```

### 2. Environment Variables Setup

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/mubarak_db
JWT_ACCESS_SECRET=your_jwt_secret
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### 3. Install Dependencies and Run

The project uses `concurrently` to run both the frontend and backend simultaneously from the root directory.

```bash
# Install dependencies for both backend and frontend
cd backend && npm install
cd ../client && npm install
cd ..

# Optional: Seed the database with initial stores and admin data
npm run seed --prefix backend

# Start both development servers
npm run dev
```

- **Frontend Development Server**: Runs on `http://localhost:5173`
- **Backend API Server**: Runs on `http://localhost:5000`

---

## 🧪 Default Test Credentials (Post-Seed)

If you've run the seeder (`npm run seed --prefix backend`), you can use these accounts to explore the different roles:

**Admin:**
- Email: `admin@mubarak.com`
- Password: `admin123`

**Vendors:**
- Store 1 (Rjy): `vendor1@mubarak.com` / `admin123`
- Store 2 (Kkd): `vendor2@mubarak.com` / `admin123`
- Store 3 (Vskp): `vendor3@mubarak.com` / `admin123`

---

## 🎨 Design & Architecture Philosophy
- **Mobile-First Approach**: The UI layout is specifically engineered for optimal performance and aesthetics on mobile devices, mimicking native app behaviors.
- **Clean Architecture**: A clear separation of concerns distinguishing standard routes, middleware (authorization wrappers), controllers, and localized real-time scopes via Socket.IO rooms.
- **Enterprise Emulation**: Incorporates concepts used extensively by scaling startups (real-time push updates, location-based service isolation, and hierarchical role-based access).

## 👨‍💻 Developed By
**Mubarak Fresh Chicken Quick Commerce** was engineered to demonstrate robust full-stack development skills, specifically aimed at solving real-world logistical flows in the quick commerce domain.
