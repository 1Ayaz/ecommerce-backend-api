import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config/api';

export default function LocationCapture({ onLocationSet, onServiceUnavailable, onSkip }) {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const autocompleteRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        // Initialize Google Places Autocomplete
        if (window.google && window.google.maps) {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'in' },
                fields: ['formatted_address', 'geometry', 'address_components'],
            });

            autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
        }
    }, []);

    const handlePlaceSelect = async () => {
        const place = autocompleteRef.current.getPlace();

        if (!place.geometry) {
            setError('Please select a valid address from the dropdown');
            return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address;

        setAddress(formattedAddress);
        await findNearestStore(lat, lng, formattedAddress);
    };

    const findNearestStore = async (lat, lng, formattedAddress) => {
        setLoading(true);
        setError('');

        try {
            const response = await API.get(`/stores/nearby?lat=${lat}&lng=${lng}`);

            if (response.data.success && response.data.data) {
                const store = response.data.data;
                onLocationSet({
                    lat,
                    lng,
                    formattedAddress,
                    store,
                });
            }
        } catch (err) {
            if (err.response?.status === 404) {
                onServiceUnavailable();
            } else {
                setError('Failed to find nearby store. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Reverse geocode to get address
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const formattedAddress = results[0].formatted_address;
                        setAddress(formattedAddress);
                        findNearestStore(lat, lng, formattedAddress);
                    } else {
                        setError('Could not determine your address');
                        setLoading(false);
                    }
                });
            },
            (error) => {
                setError('Unable to get your location. Please enter manually.');
                setLoading(false);
            }
        );
    };

    const handleSkip = () => {
        if (onSkip) {
            onSkip();
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-brand-red/10 via-white to-brand-green/10 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative"
            >
                {/* Close Button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 text-brand-muted hover:text-brand-dark hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Skip location"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-10 h-10 text-brand-red" />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-2">
                        Where do you want your order?
                    </h2>
                    <p className="text-brand-muted text-sm">
                        We'll find the nearest Mubarak store to serve you
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Address Input */}
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter your delivery address"
                            className="w-full px-4 py-3 border-2 border-brand-border rounded-xl focus:border-brand-red focus:outline-none text-sm"
                            disabled={loading}
                        />
                        {address && (
                            <button
                                onClick={() => setAddress('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Current Location Button */}
                    <button
                        onClick={handleCurrentLocation}
                        disabled={loading}
                        className="w-full py-3 bg-brand-red/5 text-brand-red font-semibold rounded-xl hover:bg-brand-red/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Finding store...
                            </>
                        ) : (
                            <>
                                <MapPin size={18} />
                                Use Current Location
                            </>
                        )}
                    </button>

                    {/* Skip Button */}
                    <button
                        onClick={handleSkip}
                        className="w-full py-3 text-brand-muted font-medium text-sm hover:text-brand-dark transition-colors"
                    >
                        Skip for now
                    </button>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-6 text-center text-xs text-brand-muted">
                    By continuing, you agree to our Terms & Privacy Policy
                </div>
            </motion.div>
        </div>
    );
}
