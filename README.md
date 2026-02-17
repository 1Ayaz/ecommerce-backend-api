# Mubarak Fresh Chicken - Quick Commerce Platform

A clean, production-ready Quick Commerce web application built with the MERN stack. Single-brand platform with 3 fixed stores, location-based service assignment, and role-based order management.

## 🎯 Project Overview

This is a **portfolio-ready** quick commerce platform designed for internship demonstrations. It features:

- **Location-First Flow**: Users select location → system assigns nearest store
- **3 Fixed Stores**: Rajahmundry, Kakinada, Visakhapatnam
- **Role-Based System**: Customer, Vendor, Delivery, Admin
- **Product Variations**: Inline stacking (500g, 1kg) with individual pricing
- **Clean Architecture**: Simple, explainable, no over-engineering

## 🚀 Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** with Mongoose
- **Firebase Admin SDK** (authentication)
- **JWT** for session management
- **Bcrypt** for password hashing

### Frontend
- **React 18** with Vite
- **Firebase Client SDK** (Email + Google Sign-In)
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **Google Places API** for location autocomplete

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (local or cloud)
- Firebase project
- Google Cloud project (for Places API)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd MUBARAK-WEBAPP
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file (see .env.example)
# Add your MongoDB URI, Firebase Admin SDK credentials, etc.

# Run seed script to populate database
node seeder.js

# Start backend server
npm start
```

**Backend runs on**: `http://localhost:5000`

### 3. Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Create .env file (see client/.env.example)
# Add Firebase client config and Google Places API key

# Start development server
npm run dev
```

**Frontend runs on**: `http://localhost:5173`

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/mubarak_db
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_PLACES_API_KEY=your_google_places_key
```

### Frontend (client/.env)
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_PLACES_API_KEY=your_google_places_key
```

## 🗂️ Project Structure

```
MUBARAK-WEBAPP/
├── backend/
│   ├── config/          # Database, Firebase config
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, role, store middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── seeder.js        # Database seed script
│   └── server.js        # Express app entry
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── config/      # Firebase, API config
│   │   ├── pages/       # Page components
│   │   ├── store/       # Zustand stores
│   │   └── main.jsx     # React entry
│   └── index.html
└── README.md
```

## 👥 User Roles & Credentials

After running `node seeder.js`, you'll have:

### Admin
- **Email**: `admin@mubarak.com`
- **Password**: `admin123`

### Vendors (one per store)
- **Store 1**: `vendor1@mubarak.com` / `admin123`
- **Store 2**: `vendor2@mubarak.com` / `admin123`
- **Store 3**: `vendor3@mubarak.com` / `admin123`

### Delivery Boys
- Phone-based login (OTP)
- 2 delivery boys per store

### Customers
- Register via Email or Google Sign-In

## 🔄 Order Flow

1. **Customer** places order
2. **Vendor** accepts/rejects order
3. **Vendor** assigns delivery boy
4. **Delivery Boy** updates status:
   - `placed` → `accepted` → `cutting` → `ready` → `out` → `delivered`

## 🌍 Location-Based Assignment

1. User enters location (Google Places autocomplete)
2. Backend calculates nearest store using Haversine formula
3. If store within `serviceRadiusKm` → assign store
4. If no store available → show "Service Unavailable"

## 📱 Key Features

### Customer Features
- Location-based store assignment
- Product browsing with variations
- Inline cart controls (+/-)
- Sticky bottom cart bar
- Order tracking

### Vendor Features
- View store orders
- Accept/reject orders
- Assign delivery boys
- Order history

### Delivery Features
- View assigned orders only
- Update delivery status
- Customer contact info

## 🧪 Testing

### Run Seed Script
```bash
cd backend
node seeder.js
```

This creates:
- 3 stores (Rajahmundry, Kakinada, Visakhapatnam)
- 3 vendors (one per store)
- 6 delivery boys (2 per store)
- Sample products with variations

### Test Order Flow
1. Register as customer
2. Set location (use one of the 3 cities)
3. Add products to cart
4. Place order
5. Login as vendor → accept order → assign delivery boy
6. Login as delivery boy → update status

## 🚢 Deployment

### Backend (Heroku/Railway/Render)
```bash
# Build command: npm install
# Start command: npm start
```

### Frontend (Vercel/Netlify)
```bash
# Build command: npm run build
# Output directory: dist
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP & login
- `POST /api/auth/google` - Google Sign-In
- `POST /api/auth/admin-login` - Admin/Vendor login
- `GET /api/auth/me` - Get current user

### Stores
- `GET /api/stores/nearby?lat=...&lng=...` - Get nearest store
- `GET /api/stores/:id` - Get store details

### Products
- `GET /api/products?storeId=...` - Get products by store
- `GET /api/products/:id` - Get product details

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders/history` - Customer order history
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (vendor)
- `GET /api/orders/vendor/store-orders` - Vendor: view store orders
- `PUT /api/orders/:id/assign-driver` - Vendor: assign delivery boy

### Delivery
- `GET /api/delivery/orders` - Get assigned orders
- `PUT /api/delivery/orders/:id/status` - Update delivery status
- `GET /api/delivery/history` - Delivery history

## 🎨 Design Philosophy

- **Mobile-First**: Optimized for thumb-friendly interactions
- **Premium Look**: Clean, modern UI inspired by Licious/Instamart
- **No Over-Engineering**: Simple, explainable architecture
- **Portfolio-Ready**: Easy to demonstrate in interviews

## 🤝 Contributing

This is a portfolio project. Feel free to fork and customize for your own use.

## 📄 License

MIT License - Free to use for learning and portfolio purposes.

## 👨‍💻 Author

Built for internship portfolio demonstration.

---

**Note**: This project uses placeholder images from Cloudinary. Replace with actual product images in production.
