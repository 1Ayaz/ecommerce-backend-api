import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/react';
import useAuthStore from './store/useAuthStore';
import API from './config/api';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import { subscribeToPushNotifications } from './utils/pushHelper';

// ─── Lazy-loaded pages (code splitting — only downloaded when needed) ───
const Home = lazy(() => import('./pages/Home'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const StaffLogin = lazy(() => import('./pages/StaffLogin'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));

// ─── Lazy-loaded heavy components ───
const LocationPicker = lazy(() => import('./components/LocationPicker'));
const ServiceUnavailable = lazy(() => import('./components/ServiceUnavailable'));
const FloatingCartBar = lazy(() => import('./components/FloatingCartBar'));
const LoginSheet = lazy(() => import('./components/LoginSheet'));

// ─── Route-level loading fallback ───
function PageLoader() {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 bg-[#D11243]/20 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-5 h-5 bg-[#D11243]/40 rounded-full" />
        </div>
        <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Loading...</p>
      </div>
    </div>
  );
}

// Login prompt shown when guests tap Account tab
function AccountLoginPrompt() {
  const [showLogin, setShowLogin] = useState(true);
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">👤</span>
      </div>
      <h2 className="text-xl font-bold text-secondary mb-2">Sign in to view your account</h2>
      <p className="text-sm text-slate-400 mb-6">Track orders, manage addresses, and more</p>
      <button
        onClick={() => setShowLogin(true)}
        className="bg-[#D11243] text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-red-200/40 active:scale-[0.98] transition-all"
      >
        Sign In
      </button>
      <Suspense fallback={null}>
        <LoginSheet isOpen={showLogin} onClose={() => { setShowLogin(false); navigate('/'); }} />
      </Suspense>
    </div>
  );
}

// Route guards
const CustomerOnly = ({ children, user }) => {
  const isAdminOrVendor = user && ['admin', 'vendor'].includes(user.role);
  const isDriver = user && user.role === 'driver';

  if (isAdminOrVendor) return <Navigate to="/dashboard" replace />;
  if (isDriver) return <Navigate to="/delivery" replace />;
  return children;
};

// Wrapper to conditionally hide customer chrome on dashboard routes
function AppContent({ locationData, setLocationData, showLocationPicker, setShowLocationPicker, serviceUnavailable, setServiceUnavailable }) {
  const location = useLocation();
  const { user, fetchProfile, handleRedirectResult } = useAuthStore();

  // Check for Firebase redirect result on mount
  useEffect(() => {
    if (!user) {
      handleRedirectResult();
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) {
      subscribeToPushNotifications();
      // Sync fresh profile from API on mount - runs once because dependency is ID, not object
      fetchProfile();
    }
  }, [user?._id]);

  const isDashboardRoute = ['/dashboard', '/delivery', '/staff-login'].some(p => location.pathname.startsWith(p));
  const isCheckoutRoute = ['/checkout', '/payment'].includes(location.pathname);
  const isTabPage = ['/search', '/categories', '/account'].includes(location.pathname);

  const handleLocationSet = (data) => {
    setLocationData(data);
    setShowLocationPicker(false);
    localStorage.setItem('userLocation', JSON.stringify(data));
    if (user) {
      API.post('/users/addresses', {
        label: 'Current Location',
        address: data.formattedAddress,
        location: { lat: data.lat, lng: data.lng }
      }).catch(() => { });
    }
  };

  const handleServiceUnavailable = () => {
    setServiceUnavailable(true);
    setShowLocationPicker(false);
  };

  const handleSkipLocation = () => {
    setShowLocationPicker(false);
  };

  if (serviceUnavailable) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ServiceUnavailable />
      </Suspense>
    );
  }

  const isAdminOrVendor = user && ['admin', 'vendor'].includes(user.role);
  const isDriver = user && user.role === 'driver';
  const isCustomer = !user || user.role === 'customer';

  return (
    <div className="min-h-screen">
      {/* Only show customer UI on customer routes */}
      {!isDashboardRoute && !isCheckoutRoute && isCustomer && (
        <>
          {showLocationPicker && (
            <Suspense fallback={<PageLoader />}>
              <LocationPicker
                onLocationSet={handleLocationSet}
                onServiceUnavailable={handleServiceUnavailable}
                onSkip={handleSkipLocation}
              />
            </Suspense>
          )}
          <div className={isTabPage ? 'hidden md:block' : ''}>
            <Header onOpenLocationPicker={() => setShowLocationPicker(true)} />
          </div>
        </>
      )}

      <main className={isDashboardRoute ? '' : 'pb-20 md:pb-12'}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<CustomerOnly user={user}><Home locationData={locationData} /></CustomerOnly>} />
            <Route path="/product/:id" element={<CustomerOnly user={user}><ProductDetail /></CustomerOnly>} />
            <Route path="/checkout" element={<CustomerOnly user={user}><Checkout /></CustomerOnly>} />
            <Route path="/payment" element={<CustomerOnly user={user}><PaymentPage /></CustomerOnly>} />
            <Route path="/order-success" element={<CustomerOnly user={user}><OrderSuccess /></CustomerOnly>} />
            <Route path="/search" element={<CustomerOnly user={user}><SearchPage /></CustomerOnly>} />
            <Route path="/categories" element={<CustomerOnly user={user}><CategoriesPage /></CustomerOnly>} />
            <Route path="/category/:slug" element={<CustomerOnly user={user}><CategoryPage /></CustomerOnly>} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route
              path="/dashboard"
              element={isAdminOrVendor ? <VendorDashboard /> : <Navigate to="/staff-login" replace />}
            />
            <Route
              path="/account"
              element={
                isAdminOrVendor ? <Navigate to="/dashboard" replace /> :
                  isDriver ? <Navigate to="/delivery" replace /> :
                    (user && user.role === 'customer') ? <CustomerDashboard /> :
                      <AccountLoginPrompt />
              }
            />
            <Route
              path="/delivery"
              element={isDriver ? <DeliveryDashboard /> : <Navigate to="/staff-login" replace />}
            />
          </Routes>
        </Suspense>
      </main>

      {/* Cart bar + bottom nav for customers */}
      {!isDashboardRoute && !isCheckoutRoute && isCustomer && (
        <Suspense fallback={null}>
          <FloatingCartBar />
        </Suspense>
      )}
      {!isDashboardRoute && !isCheckoutRoute && isCustomer && <MobileBottomNav />}

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        theme="dark"
        toastStyle={{
          borderRadius: '14px',
          fontWeight: 600,
          fontSize: '13px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  );
}

function App() {
  const [locationData, setLocationData] = useState(() => {
    const saved = localStorage.getItem('userLocation');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [showLocationPicker, setShowLocationPicker] = useState(() => {
    return !localStorage.getItem('userLocation');
  });

  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <AppContent
          locationData={locationData}
          setLocationData={setLocationData}
          showLocationPicker={showLocationPicker}
          setShowLocationPicker={setShowLocationPicker}
          serviceUnavailable={serviceUnavailable}
          setServiceUnavailable={setServiceUnavailable}
        />
        <Analytics />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
