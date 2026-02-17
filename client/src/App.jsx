import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import LocationCapture from './components/LocationCapture';
import ServiceUnavailable from './components/ServiceUnavailable';

function App() {
  const [locationData, setLocationData] = useState(null);
  const [showLocationCapture, setShowLocationCapture] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const handleLocationSet = (data) => {
    setLocationData(data);
    setShowLocationCapture(false);
    // Store in localStorage for persistence
    localStorage.setItem('userLocation', JSON.stringify(data));
  };

  const handleServiceUnavailable = () => {
    setServiceUnavailable(true);
    setShowLocationCapture(false);
  };

  const handleSkipLocation = () => {
    // User skipped location, close modal and use default location
    setShowLocationCapture(false);
    // Don't save anything to localStorage, so next time they'll be prompted again
  };

  // Check if location already exists in localStorage
  useState(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocationData(parsed);
        setShowLocationCapture(false);
      } catch (e) {
        console.error('Failed to parse saved location');
      }
    }
  }, []);

  if (serviceUnavailable) {
    return <ServiceUnavailable />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-brand-bg font-sans">
        {showLocationCapture && (
          <LocationCapture
            onLocationSet={handleLocationSet}
            onServiceUnavailable={handleServiceUnavailable}
            onSkip={handleSkipLocation}
          />
        )}

        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home locationData={locationData} />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
          </Routes>
        </main>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar
        />
      </div>
    </Router>
  );
}

export default App;
