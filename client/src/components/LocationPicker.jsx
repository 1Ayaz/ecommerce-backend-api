import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X, Navigation, Search, User, Crosshair, Keyboard, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config/api';
import LoginSheet from './LoginSheet';
import useAuthStore from '../store/useAuthStore';

/**
 * LocationPicker — Step-based square popup
 * Step 1: Choose "Enter Location" or "Detect Location"
 * Step 2: Expanded view for the chosen option
 */
export default function LocationPicker({ onLocationSet, onServiceUnavailable, onSkip }) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showLogin, setShowLogin] = useState(false);

    // Step: 'choose' | 'enter' | 'detect' | 'saved'
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

    const goBack = () => {
        setStep('choose');
        setError('');
        setResolvedAddress('');
        setResolvedCoords(null);
        setSearchQuery('');
        setSuggestions([]);
    };

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
                try {
                    const res = await API.get(`/location/reverse-geocode?lat=${lat}&lng=${lng}`);
                    const formatted = res.data?.data?.formattedAddress;
                    setResolvedAddress(formatted || '');
                } catch {
                    setResolvedAddress('');
                }
                setLoading(false);
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

    // --- Confirm ---
    const handleConfirm = async () => {
        if (!resolvedCoords) { setError('Please select or detect a location first.'); return; }
        setLoading(true);
        setError('');
        try {
            const response = await API.get(`/stores/nearby?lat=${resolvedCoords.lat}&lng=${resolvedCoords.lng}`);
            if (response.data.success && response.data.data) {
                onLocationSet({
                    lat: resolvedCoords.lat,
                    lng: resolvedCoords.lng,
                    formattedAddress: resolvedAddress,
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
        setLoading(true);
        try {
            const response = await API.get(`/stores/nearby?lat=${addr.lat}&lng=${addr.lng}`);
            if (response.data.success && response.data.data) {
                onLocationSet({ lat: addr.lat, lng: addr.lng, formattedAddress: addr.fullAddress, store: response.data.data });
            }
        } catch (err) {
            if (err.response?.status === 404) onServiceUnavailable();
            else setError('Service not available at this location.');
        } finally { setLoading(false); }
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
                                                className="w-full text-left px-4 py-3.5 hover:bg-red-50/50 transition-colors flex items-start gap-3"
                                            >
                                                <MapPin size={14} className="text-[#D11243] mt-0.5 flex-shrink-0" />
                                                <span className="text-xs font-medium text-secondary leading-snug">{s.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Resolved address preview */}
                                {resolvedAddress && resolvedCoords && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-4"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">📍 Selected Address</p>
                                        <p className="text-xs font-semibold text-secondary leading-relaxed">{resolvedAddress}</p>
                                    </motion.div>
                                )}

                                {/* Error & Fallback */}
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

                                {/* Spacer to push button down */}
                                <div className="flex-1" />

                                {/* Confirm button */}
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading || !resolvedCoords}
                                    className="w-full py-5 bg-[#D11243] hover:bg-[#b00f38] text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-[#D11243]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>Confirm & Check Service <ChevronRight size={18} /></>
                                    )}
                                </button>
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
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">We'll use GPS to find your address</p>
                                </div>

                                {/* Detect button */}
                                <div className="flex-1 flex flex-col items-center justify-center py-4">
                                    {!resolvedAddress ? (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-6 shadow-sm"
                                            >
                                                <Crosshair size={40} className="text-[#D11243]" />
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
                                        </>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="w-full"
                                        >
                                            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl mb-6">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                        <MapPin size={14} className="text-emerald-600" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Detected Address</p>
                                                </div>
                                                <p className="text-sm font-semibold text-secondary leading-relaxed">{resolvedAddress}</p>
                                            </div>

                                            <button
                                                onClick={handleDetectLocation}
                                                disabled={loading}
                                                className="w-full py-3 text-xs font-bold text-[#D11243] bg-red-50 hover:bg-red-100 rounded-xl transition-all flex items-center justify-center gap-2 mb-4"
                                            >
                                                {loading ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
                                                Re-detect
                                            </button>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="px-4 py-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-2xl text-center mb-4">
                                        {error}
                                    </div>
                                )}

                                {/* Confirm button */}
                                {resolvedCoords && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={loading}
                                            className="w-full py-5 bg-[#D11243] hover:bg-[#b00f38] text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-[#D11243]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-40 active:scale-[0.97]"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Confirm & Check Service <ChevronRight size={18} /></>}
                                        </button>
                                    </motion.div>
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
                    </AnimatePresence>
                </div>
            </motion.div>
            <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
    );
}
