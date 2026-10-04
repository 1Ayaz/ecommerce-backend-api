import { useState, useEffect } from 'react';
import { MapPin, Plus, X, ArrowLeft, Navigation, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config/api';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-toastify';

/**
 * AddressSheet — bottom sheet for selecting or adding a delivery address.
 *
 * Props:
 *   isOpen        {boolean}
 *   onClose       {fn}
 *   onSelect      {fn(addr)} – called when user picks a saved address
 *   selectedAddr  {object|null} – currently selected address (to show checkmark)
 *   user          {object|null} – logged-in user
 */
export default function AddressSheet({ isOpen, onClose, onSelect, selectedAddr, user }) {
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [addingNew, setAddingNew] = useState(false);
    const [step, setStep] = useState('gps'); // 'gps' | 'details'

    // GPS state
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsLocation, setGpsLocation] = useState(null);
    const [gpsAddress, setGpsAddress] = useState('');

    // Form state
    const [receiverName, setReceiverName] = useState(user?.name || '');
    const [receiverPhone, setReceiverPhone] = useState(user?.phone || '');
    const [addrBuilding, setAddrBuilding] = useState('');
    const [addrStreet, setAddrStreet] = useState('');
    const [addrArea, setAddrArea] = useState('');
    const [addrLabel, setAddrLabel] = useState('Home');
    const [addrCustomLabel, setAddrCustomLabel] = useState('');
    const [addrInstructions, setAddrInstructions] = useState('');

    // Load saved addresses when sheet opens
    useEffect(() => {
        if (isOpen && user) {
            API.get('/users/addresses')
                .then(res => setSavedAddresses(res.data.data || []))
                .catch(() => { });
        }
    }, [isOpen, user]);

    // Pre-fill name/phone from account
    useEffect(() => {
        if (user?.name && !receiverName) setReceiverName(user.name);
        if (user?.phone && !receiverPhone) setReceiverPhone(user.phone);
    }, [user]);

    const handleClose = () => {
        setAddingNew(false);
        setStep('gps');
        onClose();
    };

    const handleDetectGPS = () => {
        if (!navigator.geolocation) {
            toast.error('GPS not supported on this device');
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setGpsLocation({ lat, lng });
                try {
                    const { data } = await API.get(`/location/reverse-geocode?lat=${lat}&lng=${lng}`);
                    const addr = data.data?.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    setGpsAddress(addr);
                    setAddrArea(addr);
                } catch {
                    setGpsAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                }
                setGpsLoading(false);
            },
            (error) => {
                setGpsLoading(false);
                if (error.code === 1) {
                    toast.error('Location permission denied. Please enable it in your browser settings.');
                } else {
                    toast.error('Could not detect location. Please try manually.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Try to pre-fill from the global stored location (from LocationPicker)
    const tryPrefillGlobalLocation = async () => {
        const savedLocStr = localStorage.getItem('userLocation');
        if (!savedLocStr) return false;
        try {
            const loc = JSON.parse(savedLocStr);
            if (!loc.lat || !loc.lng) return false;
            setGpsLoading(true);
            setGpsLocation({ lat: loc.lat, lng: loc.lng });
            try {
                const { data } = await API.get(`/location/reverse-geocode?lat=${loc.lat}&lng=${loc.lng}`);
                const addr = data.data?.formattedAddress || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
                setGpsAddress(addr);
                setAddrArea(addr);
            } catch {
                setGpsAddress(loc.formattedAddress || 'Selected Location');
                setAddrArea(loc.formattedAddress || '');
            }
            setGpsLoading(false);
            setStep('details');
            return true;
        } catch {
            return false;
        }
    };

    const handleStartAddNew = async () => {
        setAddingNew(true);
        setStep('gps');
        // Try to auto-populate from previously stored location
        const success = await tryPrefillGlobalLocation();
        if (!success) {
            setStep('gps');
        }
    };

    const handleSaveNewAddress = async () => {
        if (!addrBuilding.trim()) {
            toast.error('Building/Floor is required');
            return;
        }
        if (!receiverPhone || receiverPhone.trim().length < 10) {
            toast.error('A valid 10-digit phone number is required');
            return;
        }
        const label = addrLabel === 'Other' ? (addrCustomLabel.trim() || 'Other') : addrLabel;
        const fullAddress = [addrBuilding, addrStreet, addrArea].filter(Boolean).join(', ');
        try {
            await API.post('/users/addresses', {
                label,
                name: receiverName.trim(),
                phone: receiverPhone.trim(),
                flat: addrBuilding.trim(),
                building: addrStreet.trim(),
                area: addrArea.trim(),
                landmark: '',
                city: '',
                state: '',
                pincode: '',
                fullAddress,
                location: gpsLocation || {},
                deliveryInstructions: addrInstructions.trim(),
            });
            toast.success('Address saved!');
            // Reload and select the new address
            const [res] = await Promise.all([
                API.get('/users/addresses'),
                useAuthStore.getState().fetchProfile(),
            ]);
            const addrs = res.data.data || [];
            setSavedAddresses(addrs);
            const newAddr = addrs[addrs.length - 1];
            onSelect(newAddr);
            // Reset form
            setAddingNew(false);
            setStep('gps');
            setAddrBuilding(''); setAddrStreet(''); setAddrArea('');
            setAddrLabel('Home'); setAddrCustomLabel(''); setAddrInstructions('');
            setGpsLocation(null); setGpsAddress('');
            handleClose();
        } catch {
            toast.error('Failed to save address');
        }
    };

    const handleSelectAddr = (addr) => {
        onSelect(addr);
        handleClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-[200] bg-black/40"
                    />
                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[201] bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto safe-area-bottom"
                    >
                        <div className="p-5">
                            {/* Drag handle */}
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

                            {!addingNew ? (
                                /* ── Saved Address List ── */
                                <>
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-base font-bold text-secondary">Select Delivery Address</h3>
                                        <button onClick={handleClose} className="text-slate-300 hover:text-secondary">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleStartAddNew}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 border border-dashed border-red-200 rounded-2xl text-xs font-bold text-[#D11243] hover:bg-red-100 transition-colors mb-4"
                                    >
                                        <Plus size={14} /> Add New Address
                                    </button>

                                    {savedAddresses.length === 0 ? (
                                        <div className="text-center py-8">
                                            <MapPin size={28} className="text-slate-200 mx-auto mb-2" />
                                            <p className="text-xs text-slate-400 font-bold">No saved addresses yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {savedAddresses.map(addr => (
                                                <button
                                                    key={addr._id}
                                                    onClick={() => handleSelectAddr(addr)}
                                                    className={`w-full text-left p-4 rounded-xl transition-all border-2 ${selectedAddr?._id === addr._id
                                                        ? 'border-[#D11243] bg-red-50/50'
                                                        : 'border-gray-100 bg-white hover:border-red-100'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase bg-gray-200 px-2 py-0.5 rounded text-slate-600">
                                                            {addr.label === 'Home' ? '🏠 Home' : addr.label === 'Work' ? '🏢 Work' : addr.label}
                                                        </span>
                                                        {addr.name && <span className="text-xs font-bold text-secondary">{addr.name}</span>}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 line-clamp-2">
                                                        {addr.fullAddress || [addr.flat, addr.area, addr.city].filter(Boolean).join(', ')}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* ── Add New Address Flow ── */
                                <>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    if (step === 'details') setStep('gps');
                                                    else { setAddingNew(false); setStep('gps'); }
                                                }}
                                                className="text-slate-400 hover:text-secondary"
                                            >
                                                <ArrowLeft size={18} />
                                            </button>
                                            <h3 className="text-base font-bold text-secondary">
                                                {step === 'gps' ? 'Detect Location' : 'Address Details'}
                                            </h3>
                                        </div>
                                        <button onClick={handleClose} className="text-slate-300 hover:text-secondary">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {step === 'gps' && (
                                        <div className="space-y-5">
                                            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                                                {gpsLoading ? (
                                                    <div className="flex flex-col items-center gap-3 py-4">
                                                        <Loader2 size={32} className="animate-spin text-[#D11243]" />
                                                        <p className="text-xs font-bold text-slate-400">Detecting your location...</p>
                                                    </div>
                                                ) : gpsAddress ? (
                                                    <div className="space-y-3">
                                                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                                                            <CheckCircle size={24} className="text-emerald-500" />
                                                        </div>
                                                        <p className="text-sm font-bold text-secondary">Location Detected</p>
                                                        <p className="text-xs text-slate-400">{gpsAddress}</p>
                                                        <button onClick={handleDetectGPS} className="text-xs font-bold text-[#D11243] hover:underline">
                                                            Detect Again
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                                                            <Navigation size={24} className="text-[#D11243]" />
                                                        </div>
                                                        <p className="text-sm font-bold text-secondary">Use GPS to detect location</p>
                                                        <p className="text-xs text-slate-400">We'll use your current location for delivery</p>
                                                        <button
                                                            onClick={handleDetectGPS}
                                                            className="bg-[#D11243] text-white font-bold px-6 py-3 rounded-xl text-xs shadow-lg shadow-red-200/40"
                                                        >
                                                            Detect My Location
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {gpsAddress && (
                                                <button
                                                    onClick={() => { setStep('details'); setAddrArea(gpsAddress); }}
                                                    className="w-full bg-[#D11243] text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200/40"
                                                >
                                                    Proceed →
                                                </button>
                                            )}

                                            {/* Manual entry shortcut */}
                                            <button
                                                onClick={() => setStep('details')}
                                                className="w-full text-xs font-bold text-slate-400 hover:text-secondary transition-colors py-1"
                                            >
                                                Enter address manually instead
                                            </button>
                                        </div>
                                    )}

                                    {step === 'details' && (
                                        <div className="space-y-4">
                                            {/* Contact */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Details</h4>
                                                <div className="space-y-2">
                                                    <input
                                                        type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)}
                                                        placeholder="Full Name *"
                                                        className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none"
                                                    />
                                                    <input
                                                        type="tel" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                        placeholder="Phone Number (10 digits) *"
                                                        className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Location */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location Details</h4>
                                                <div className="space-y-2">
                                                    <input
                                                        type="text" value={addrBuilding} onChange={(e) => setAddrBuilding(e.target.value)}
                                                        placeholder="Building / Floor *"
                                                        className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none"
                                                    />
                                                    <input
                                                        type="text" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)}
                                                        placeholder="Street (recommended)"
                                                        className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none"
                                                    />
                                                    <div className="flex items-start gap-2">
                                                        <textarea
                                                            value={addrArea} onChange={(e) => setAddrArea(e.target.value)}
                                                            placeholder="Area / Locality & Full Address"
                                                            rows={3}
                                                            className="flex-1 bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none resize-none"
                                                        />
                                                        <button
                                                            onClick={handleDetectGPS}
                                                            className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-slate-500 hover:text-[#D11243] transition-colors flex-shrink-0 mt-0.5"
                                                        >
                                                            <Navigation size={16} className="mb-0.5" /> Auto<br />Detect
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Label */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Save Address As</h4>
                                                <div className="flex gap-2 flex-wrap">
                                                    {[{ id: 'Home', icon: '🏠' }, { id: 'Work', icon: '🏢' }, { id: 'Other', icon: '📍' }].map(t => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => setAddrLabel(t.id)}
                                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${addrLabel === t.id ? 'bg-[#D11243] text-white' : 'bg-gray-50 text-slate-500 border border-gray-200 hover:border-red-200'}`}
                                                        >
                                                            {t.icon} {t.id}
                                                        </button>
                                                    ))}
                                                </div>
                                                {addrLabel === 'Other' && (
                                                    <input
                                                        type="text" value={addrCustomLabel} onChange={(e) => setAddrCustomLabel(e.target.value)}
                                                        placeholder="What's this place? (e.g., Mom's house)"
                                                        className="w-full mt-2 bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none"
                                                    />
                                                )}
                                            </div>

                                            {/* Delivery Instructions */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Instructions (optional)</h4>
                                                <input
                                                    type="text" value={addrInstructions} onChange={(e) => setAddrInstructions(e.target.value)}
                                                    placeholder="e.g., Leave at guard desk..."
                                                    className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none"
                                                />
                                            </div>

                                            <button
                                                onClick={handleSaveNewAddress}
                                                className="w-full bg-[#D11243] text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200/40 flex items-center justify-center gap-2"
                                            >
                                                Save Address <CheckCircle size={16} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
