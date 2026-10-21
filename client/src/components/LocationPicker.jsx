import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X, Navigation, Search, User, Crosshair, Keyboard, ChevronRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../config/api';
import LoginSheet from './LoginSheet';
import useAuthStore from '../store/useAuthStore';

// Fix leaflet default icon paths for Vite/webpack bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red pin icon for the customer's location
const redPinIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

/**
 * DraggableMarker — inner component that handles map clicks + marker drag
 * to let the user fine-tune their exact pin position.
 */
function DraggableMarker({ position, onMove }) {
    const markerRef = useRef(null);

    // Clicking anywhere on map moves the pin
    useMapEvents({
        click(e) {
            onMove(e.latlng.lat, e.latlng.lng);
        },
    });

    return (
        <Marker
            position={position}
            icon={redPinIcon}
            draggable={true}
            ref={markerRef}
            eventHandlers={{
                dragend() {
                    const m = markerRef.current;
                    if (m) {
                        const latlng = m.getLatLng();
                        onMove(latlng.lat, latlng.lng);
                    }
                },
            }}
        />
    );
}

/**
 * LocationPicker — Step-based popup
 * Step 1 (choose): Pick "Enter Location", "Detect Location", or "Saved"
 * Step 2 (enter):  Search autocomplete
 * Step 2 (detect): GPS detection
 * Step 2 (saved):  Saved addresses list
 * Step 3 (pinmap): Draggable Leaflet map to fine-tune the exact pin location
 */
export default function LocationPicker({ onLocationSet, onServiceUnavailable, onSkip }) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showLogin, setShowLogin] = useState(false);

    // Step: 'choose' | 'enter' | 'detect' | 'saved' | 'pinmap'
    const [step, setStep] = useState('choose');

    // Resolved location
    const [resolvedAddress, setResolvedAddress] = useState('');
    const [resolvedCoords, setResolvedCoords] = useState(null);

    // Search / autocomplete
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const debounceRef = useRef(null);

    // Saved Addresses
    const [savedAddresses, setSavedAddresses] = useState([]);

    // Fine-tune pin coords (used in pinmap step — starts at resolvedCoords, user can drag)
    const [pinCoords, setPinCoords] = useState(null);
    const [reverseLoading, setReverseLoading] = useState(false);
    const [pinAddress, setPinAddress] = useState('');

    const goBack = () => {
        setStep('choose');
        setError('');
        setResolvedAddress('');
        setResolvedCoords(null);
        setSearchQuery('');
        setSuggestions([]);
        setPinCoords(null);
        setPinAddress('');
    };

    const goToPinMap = (coords, address) => {
        setPinCoords(coords);
        setPinAddress(address);
        setStep('pinmap');
    };

    // When user moves pin on the map, reverse-geocode for a human-readable label
    const handlePinMove = useCallback(async (lat, lng) => {
        setPinCoords({ lat, lng });
        setReverseLoading(true);
        try {
            const res = await API.get(`/location/reverse-geocode?lat=${lat}&lng=${lng}`);
            setPinAddress(res.data?.data?.formattedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
            setPinAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
            setReverseLoading(false);
        }
    }, []);

    // --- Autocomplete ---
    const fetchSuggestions = useCallback(async (input) => {
        if (!input || input.length < 3) { setSuggestions([]); return; }
        setSearchLoading(true);
        try {
            const res = await API.get(`/location/suggestions?input=${encodeURIComponent(input)}`);
            setSuggestions(res.data.data || []);
        } catch { setSuggestions([]); }
        finally { setSearchLoading(false); }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(searchQuery), 350);
        return () => clearTimeout(debounceRef.current);
    }, [searchQuery, fetchSuggestions]);

    const handleSelectSuggestion = async (suggestion) => {
        setLoading(true);
        setError('');
        setSuggestions([]);
        setSearchQuery(suggestion.description);
        try {
            const res = await API.get(`/location/details/${suggestion.place_id}`);
            const { lat, lng } = res.data.data;
            setResolvedCoords({ lat, lng });
            setResolvedAddress(suggestion.description);
            // Go directly to pin fine-tune map
            goToPinMap({ lat, lng }, suggestion.description);
        } catch { setError('Could not get location details. Try again.'); }
        finally { setLoading(false); }
    };

    // --- Detect Location ---
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        setLoading(true);
        setError('');
        setResolvedAddress('');
        setResolvedCoords(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setResolvedCoords({ lat, lng });
                let addr = '';
                try {
                    const res = await API.get(`/location/reverse-geocode?lat=${lat}&lng=${lng}`);
                    addr = res.data?.data?.formattedAddress || '';
                    setResolvedAddress(addr);
                } catch {
                    setResolvedAddress('');
                }
                setLoading(false);
                // Go to pin map to let user fine-tune
                goToPinMap({ lat, lng }, addr);
            },
            (err) => {
                const messages = {
                    1: 'Location permission denied. Please allow access in browser settings.',
                    2: 'Location unavailable. Please try again.',
                    3: 'Location request timed out. Please try again.',
                };
                setError(messages[err.code] || 'Could not detect your location.');
                setLoading(false);
            },
            { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
        );
    };

    // --- Final Confirm (from pin map) ---
    const handleConfirmPin = async () => {
        const coords = pinCoords || resolvedCoords;
        if (!coords) { setError('Please set a location first.'); return; }
        setLoading(true);
        setError('');
        try {
            const response = await API.get(`/stores/nearby?lat=${coords.lat}&lng=${coords.lng}`);
            if (response.data.success && response.data.data) {
                onLocationSet({
                    lat: coords.lat,
                    lng: coords.lng,
                    formattedAddress: pinAddress || resolvedAddress,
                    store: response.data.data,
                });
            }
        } catch (err) {
            if (err.response?.status === 404) onServiceUnavailable();
            else setError('Service not available in your area yet.');
        } finally { setLoading(false); }
    };

    // --- Saved Addresses ---
    const handleSavedAddressesClick = async () => {
        if (!user) { setShowLogin(true); return; }
        setLoading(true);
        try {
            const res = await API.get('/users/addresses');
            setSavedAddresses(res.data.data || []);
            setStep('saved');
        } catch { setError('Could not load saved addresses.'); }
        finally { setLoading(false); }
    };

    const handleSelectSavedAddress = async (addr) => {
        // Jump straight to pin map with saved address coords
        goToPinMap({ lat: addr.lat, lng: addr.lng }, addr.fullAddress || addr.formattedAddress || addr.label);
    };

    // ======================== ANIMATION CONFIG ========================
    const pageVariants = {
        initial: { opacity: 0, scale: 0.95, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: -12 },
    };
    const pageTransition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] };

    // ======================== RENDER ========================
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-[2rem] shadow-high-trust w-full max-w-[480px] overflow-hidden relative"
                style={{ aspectRatio: 'auto' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Bar — Back + Close */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                    {step !== 'choose' ? (
                        <button
                            onClick={goBack}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-slate-500 hover:bg-gray-100 hover:text-secondary transition-all"
                            title="Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    ) : (
                        <div className="w-9" />
                    )}

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-[#D11243]">
                            <MapPin size={16} />
                        </div>
                        <span className="text-sm font-bold text-secondary tracking-tight">Set Location</span>
                    </div>

                    <button
                        onClick={onSkip}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-slate-400 hover:bg-red-50 hover:text-[#D11243] transition-all"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="px-6 pb-6 pt-3" style={{ minHeight: '320px' }}>
                    <AnimatePresence mode="wait">

                        {/* ============ STEP: CHOOSE ============ */}
                        {step === 'choose' && (
                            <motion.div
                                key="choose"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={pageTransition}
                                className="flex flex-col gap-4"
                            >
                                <div className="text-center mb-2">
                                    <h2 className="text-xl font-black tracking-tight text-secondary">Where should we deliver?</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Choose how to set your address</p>
                                </div>

                                {/* Option 1: Enter Location */}
                                <button
                                    onClick={() => setStep('enter')}
                                    className="group w-full p-6 border-2 border-gray-100 rounded-2xl bg-gray-50/50 hover:border-[#D11243]/30 hover:bg-red-50/30 transition-all text-left flex items-center gap-5"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-slate-500 group-hover:text-[#D11243] group-hover:border-red-100 group-hover:bg-red-50 transition-all flex-shrink-0">
                                        <Keyboard size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-secondary text-base group-hover:text-[#D11243] transition-colors">Enter Location</p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">Type & search your delivery address</p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-[#D11243] group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </button>

                                {/* Option 2: Detect Location */}
                                <button
                                    onClick={() => setStep('detect')}
                                    className="group w-full p-6 border-2 border-gray-100 rounded-2xl bg-gray-50/50 hover:border-[#D11243]/30 hover:bg-red-50/30 transition-all text-left flex items-center gap-5"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-slate-500 group-hover:text-[#D11243] group-hover:border-red-100 group-hover:bg-red-50 transition-all flex-shrink-0">
                                        <Crosshair size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-secondary text-base group-hover:text-[#D11243] transition-colors">Detect Location</p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">Use GPS to find your address automatically</p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-[#D11243] group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </button>

                                {/* Footer links */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                                    <button
                                        onClick={handleSavedAddressesClick}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#D11243] transition-colors flex items-center gap-1.5"
                                    >
                                        {user ? <><User size={11} /> Saved Addresses</> : 'Log in for Saved'}
                                    </button>
                                    <button onClick={onSkip} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-secondary transition-colors">
                                        Skip
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ============ STEP: ENTER LOCATION ============ */}
                        {step === 'enter' && (
                            <motion.div
                                key="enter"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={pageTransition}
                                className="flex flex-col h-full"
                            >
                                <div className="mb-4">
                                    <h2 className="text-lg font-black tracking-tight text-secondary">Enter your address</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">Search for your area, apartment, or street</p>
                                </div>

                                {/* Search input */}
                                <div className="relative mb-3">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search area, street, apartment..."
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-11 pr-10 py-4 text-sm font-medium text-secondary placeholder:text-slate-300 focus:ring-2 focus:ring-[#D11243]/15 focus:border-[#D11243]/40 focus:bg-white outline-none transition-all"
                                        autoFocus
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Suggestions */}
                                {searchLoading && (
                                    <div className="flex items-center gap-2 py-3 text-xs text-slate-400 justify-center">
                                        <Loader2 className="animate-spin" size={14} /> Searching...
                                    </div>
                                )}
                                {suggestions.length > 0 && (
                                    <div className="max-h-[200px] overflow-y-auto rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50 mb-4">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s.place_id}
                                                onClick={() => handleSelectSuggestion(s)}
                                                disabled={loading}
                                                className="w-full text-left px-4 py-3.5 hover:bg-red-50/50 transition-colors flex items-start gap-3 disabled:opacity-60"
                                            >
                                                {loading ? <Loader2 size={14} className="animate-spin text-[#D11243] mt-0.5 flex-shrink-0" /> : <MapPin size={14} className="text-[#D11243] mt-0.5 flex-shrink-0" />}
                                                <span className="text-xs font-medium text-secondary leading-snug">{s.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="px-4 py-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-2xl text-center mb-4">
                                        {error}
                                    </div>
                                )}

                                <div className="flex-1" />
                                <p className="text-[10px] text-slate-400 text-center font-medium">
                                    After selecting, you'll fine-tune your exact pin on a map
                                </p>
                            </motion.div>
                        )}

                        {/* ============ STEP: DETECT LOCATION ============ */}
                        {step === 'detect' && (
                            <motion.div
                                key="detect"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={pageTransition}
                                className="flex flex-col h-full"
                            >
                                <div className="mb-5">
                                    <h2 className="text-lg font-black tracking-tight text-secondary">Detect your location</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">We'll use GPS — then you can fine-tune the pin</p>
                                </div>

                                {/* Detect button */}
                                <div className="flex-1 flex flex-col items-center justify-center py-4">
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-6 shadow-sm"
                                    >
                                        <Crosshair size={40} className={`text-[#D11243] ${loading ? 'animate-pulse' : ''}`} />
                                    </motion.div>
                                    <button
                                        onClick={handleDetectLocation}
                                        disabled={loading}
                                        className="px-10 py-5 bg-gradient-to-r from-[#D11243] to-[#e8366b] text-white font-bold text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-[#D11243]/20 hover:shadow-xl hover:shadow-[#D11243]/30 transition-all active:scale-[0.96] flex items-center gap-3 disabled:opacity-60"
                                    >
                                        {loading ? (
                                            <><Loader2 className="animate-spin" size={18} /> Detecting...</>
                                        ) : (
                                            <><Navigation size={18} /> Detect My Location</>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-slate-400 font-medium mt-4 text-center max-w-[240px]">
                                        Your browser will ask for location permission
                                    </p>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="flex flex-col gap-2 mb-4">
                                        <div className="px-4 py-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-2xl text-center">
                                            {error}
                                        </div>
                                        <button
                                            onClick={() => { setError(''); setStep('enter'); }}
                                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Keyboard size={14} /> Search Manually Instead
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ============ STEP: SAVED ADDRESSES ============ */}
                        {step === 'saved' && (
                            <motion.div
                                key="saved"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={pageTransition}
                            >
                                <h3 className="text-lg font-bold text-secondary mb-4">Saved Addresses</h3>
                                {savedAddresses.length === 0 ? (
                                    <p className="text-slate-400 text-sm text-center py-8">No saved addresses found.</p>
                                ) : (
                                    <div className="space-y-3 max-h-[280px] overflow-y-auto">
                                        {savedAddresses.map(addr => (
                                            <button
                                                key={addr._id}
                                                onClick={() => handleSelectSavedAddress(addr)}
                                                className="w-full text-left p-4 border border-gray-100 rounded-2xl hover:border-red-100 hover:bg-red-50/50 transition-all group"
                                            >
                                                <div className="flex items-center gap-3 mb-1">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-[#D11243]">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <span className="font-bold text-secondary">{addr.label}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 pl-11">{addr.fullAddress || addr.formattedAddress}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ============ STEP: PIN MAP (fine-tune) ============ */}
                        {step === 'pinmap' && pinCoords && (
                            <motion.div
                                key="pinmap"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={pageTransition}
                                className="flex flex-col"
                            >
                                <div className="mb-3">
                                    <h2 className="text-lg font-black tracking-tight text-secondary">Place your pin</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">Drag the pin or tap the map to set your exact door location</p>
                                </div>

                                {/* Leaflet map */}
                                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-inner mb-3" style={{ height: 220 }}>
                                    <MapContainer
                                        center={[pinCoords.lat, pinCoords.lng]}
                                        zoom={17}
                                        style={{ height: '100%', width: '100%' }}
                                        zoomControl={true}
                                        scrollWheelZoom={true}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                                        />
                                        <DraggableMarker
                                            position={[pinCoords.lat, pinCoords.lng]}
                                            onMove={handlePinMove}
                                        />
                                    </MapContainer>
                                </div>

                                {/* Address label below map */}
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl mb-3 flex items-start gap-2.5">
                                    {reverseLoading ? (
                                        <Loader2 size={14} className="animate-spin text-emerald-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <MapPin size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                    )}
                                    <p className="text-xs font-semibold text-secondary leading-relaxed">
                                        {reverseLoading ? 'Getting address...' : (pinAddress || 'Tap or drag pin to set location')}
                                    </p>
                                </div>

                                {/* Tip */}
                                <p className="text-[10px] text-slate-400 text-center mb-3">
                                    📍 Pinch to zoom · Drag the red pin · Tap map to move pin
                                </p>

                                {/* Error */}
                                {error && (
                                    <div className="px-4 py-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-2xl text-center mb-3">
                                        {error}
                                    </div>
                                )}

                                {/* Confirm */}
                                <button
                                    onClick={handleConfirmPin}
                                    disabled={loading || reverseLoading}
                                    className="w-full py-4 bg-[#D11243] hover:bg-[#b00f38] text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-[#D11243]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <><Check size={18} /> Confirm Location</>
                                    )}
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </motion.div>
            <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
    );
}
