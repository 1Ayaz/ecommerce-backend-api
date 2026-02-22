import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, ChevronDown, Plus, Minus, Trash2, ArrowLeft, ShoppingBag, ChevronRight,
    X, Tag, CheckCircle, Home, Briefcase, MoreHorizontal, Navigation, Loader2,
    MessageSquare, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import API from '../config/api';
import LoginSheet from '../components/LoginSheet';
import { toast } from 'react-toastify';

/* ═══════════════════════════════════════════════════════ */
/*  CHECKOUT PAGE — single-page, swiggy/zepto style       */
/* ═══════════════════════════════════════════════════════ */
export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { items, vendorId, addItem, removeItem, getTotalPrice, getTotalCount, clearCart } = useCartStore();

    // Login
    const [showLogin, setShowLogin] = useState(false);

    // Address
    const [showAddrSheet, setShowAddrSheet] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddr, setSelectedAddr] = useState(null);

    // Add new address flow
    const [addingNew, setAddingNew] = useState(false);
    const [newAddrStep, setNewAddrStep] = useState('gps'); // gps | details
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsLocation, setGpsLocation] = useState(null);
    const [gpsAddress, setGpsAddress] = useState('');
    const [useMyDetails, setUseMyDetails] = useState(true);
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [addrBuilding, setAddrBuilding] = useState('');
    const [addrStreet, setAddrStreet] = useState('');
    const [addrArea, setAddrArea] = useState('');
    const [addrLabel, setAddrLabel] = useState('Home');
    const [addrCustomLabel, setAddrCustomLabel] = useState('');
    const [addrInstructions, setAddrInstructions] = useState('');

    // Coupon
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');

    // Order
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Order Preview State
    const [previewLoading, setPreviewLoading] = useState(false);
    const [financialSnapshot, setFinancialSnapshot] = useState(null);

    // ─── Autofill Address from Global Location ───
    const handlePrefillGlobalLocation = async () => {
        const savedLocStr = localStorage.getItem('userLocation');
        if (!savedLocStr) return false;
        try {
            const loc = JSON.parse(savedLocStr);
            if (!loc.lat || !loc.lng) return false;

            setAddingNew(true);
            setNewAddrStep('gps'); // Show GPS step visually while loading
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
            setNewAddrStep('details');
            return true;
        } catch (e) {
            return false;
        }
    };

    // Load saved addresses
    useEffect(() => {
        if (user) {
            API.get('/users/addresses').then(res => {
                const addrs = res.data.data || [];
                setSavedAddresses(addrs);
                // Auto-select first saved address if none selected
                if (!selectedAddr && addrs.length > 0) {
                    setSelectedAddr(addrs[0]);
                }
            }).catch(() => { });
        }
    }, [user]);

    // Pre-fill receiver name from account
    useEffect(() => {
        if (user?.name && !receiverName) {
            setReceiverName(user.name);
        }
        if (user?.phone && !receiverPhone) {
            setReceiverPhone(user.phone);
        }
    }, [user]);

    // If not logged in, show login
    useEffect(() => {
        if (!user && items.length > 0) {
            setShowLogin(true);
        }
    }, [user]);

    // After login, if no saved addresses, open address sheet AND start add-new flow
    useEffect(() => {
        if (user && savedAddresses.length === 0 && !selectedAddr) {
            // Small delay for UX
            const t = setTimeout(async () => {
                setShowAddrSheet(true);
                const success = await handlePrefillGlobalLocation();
                if (!success) {
                    setAddingNew(true);
                    setNewAddrStep('gps');
                }
            }, 400);
            return () => clearTimeout(t);
        }
    }, [user, savedAddresses]);

    const hasHome = savedAddresses.some(a => a.label === 'Home');
    const hasWork = savedAddresses.some(a => a.label === 'Work');

    // ─── Fetch Preview Totals from Backend ───
    useEffect(() => {
        if (!user || items.length === 0 || !vendorId) return;

        let isMounted = true;
        const fetchPreview = async () => {
            setPreviewLoading(true);
            try {
                // Determine best location
                let loc = null;
                if (selectedAddr?.location?.lat) {
                    loc = selectedAddr.location;
                } else if (gpsLocation?.lat) {
                    loc = gpsLocation;
                } else {
                    const localLoc = JSON.parse(localStorage.getItem('userLocation') || '{}');
                    if (localLoc.lat) loc = localLoc;
                }

                const orderData = {
                    vendorId,
                    items: items.map(i => ({
                        productId: i.productId,
                        variationLabel: i.variationLabel,
                        quantity: i.quantity,
                    })),
                    deliveryAddress: selectedAddr || { location: loc || { lat: 0, lng: 0 } },
                    paymentMethod: 'COD', // For preview purposes
                    couponCode: appliedCoupon?.couponCode || couponCode || null,
                };

                const { data } = await API.post('/orders/preview', orderData);
                if (isMounted && data?.success) {
                    setFinancialSnapshot(data.data.financialSnapshot);
                    // Sync backend validated coupon if mismatched
                    if (data.data.appliedCouponCode && !appliedCoupon) {
                        setAppliedCoupon({ discountAmount: data.data.financialSnapshot.discountAmount, couponCode: data.data.appliedCouponCode });
                    } else if (!data.data.appliedCouponCode && appliedCoupon) {
                        setAppliedCoupon(null);
                    }
                }
            } catch (err) {
                console.error("Failed to preview order", err);
            } finally {
                if (isMounted) setPreviewLoading(false);
            }
        };

        const t = setTimeout(fetchPreview, 400); // 400ms debounce
        return () => { isMounted = false; clearTimeout(t); };
    }, [items, selectedAddr, appliedCoupon, vendorId, gpsLocation]);

    // Billing
    const subtotal = financialSnapshot?.itemsTotal ?? getTotalPrice();
    const discount = financialSnapshot?.discountAmount ?? (appliedCoupon ? appliedCoupon.discountAmount : 0);
    const deliveryFee = financialSnapshot?.deliveryFee ?? 0;
    const platformFee = financialSnapshot?.platformFee ?? 0;
    const taxAmount = financialSnapshot?.taxAmount ?? 0;

    const handlingFee = platformFee + taxAmount;
    const grandTotal = financialSnapshot?.grandTotal ?? (subtotal - discount + deliveryFee + handlingFee);

    // ─── Coupon Logic ───
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponError('');
        try {
            const { data } = await API.post('/coupons/validate', { code: couponCode, orderAmount: subtotal });
            setAppliedCoupon(data.data);
            toast.success('Coupon applied!');
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid coupon');
            setAppliedCoupon(null);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    // ─── GPS Location ───
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

                    // Try to extract pincode
                    const pincodeMatch = addr.match(/\b(\d{6})\b/);
                    if (pincodeMatch) {
                        // Store for later use
                    }
                } catch {
                    setGpsAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                }
                setGpsLoading(false);
            },
            (error) => {
                setGpsLoading(false);
                if (error.code === 1) { // 1 = PERMISSION_DENIED
                    toast.error(
                        <div className="flex flex-col">
                            <span className="font-bold">Location Permission Denied</span>
                            <span className="text-[10px] opacity-80 mt-0.5">Please enable location access in your browser settings or enter your address manually.</span>
                        </div>,
                        { duration: 5000 }
                    );
                } else {
                    toast.error('Could not detect location. Please try manually.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // ─── Save New Address ───
    const handleSaveNewAddress = async () => {
        if (!addrBuilding.trim()) {
            toast.error('Building/Floor is required');
            return;
        }
        const name = receiverName.trim();
        const phone = receiverPhone.trim();
        if (!phone || phone.length < 10) {
            toast.error('A valid phone number is required');
            return;
        }
        const label = addrLabel === 'Other' ? (addrCustomLabel.trim() || 'Other') : addrLabel;
        const fullAddress = [addrBuilding, addrStreet, addrArea].filter(Boolean).join(', ');

        try {
            await API.post('/users/addresses', {
                label, name: name.trim(), phone: phone.trim(),
                flat: addrBuilding.trim(), building: addrStreet.trim(),
                area: addrArea.trim(), landmark: '', city: '', state: '', pincode: '',
                fullAddress,
                location: gpsLocation || {},
                deliveryInstructions: addrInstructions.trim(),
            });
            toast.success('Address saved!');
            // Reload addresses
            const res = await API.get('/users/addresses');
            const addrs = res.data.data || [];
            setSavedAddresses(addrs);
            const newAddr = addrs[addrs.length - 1];
            setSelectedAddr(newAddr);
            // Reset form
            setAddingNew(false);
            setNewAddrStep('gps');
            setAddrBuilding(''); setAddrStreet(''); setAddrArea(''); setAddrLabel('Home');
            setAddrCustomLabel(''); setAddrInstructions('');
            setGpsLocation(null); setGpsAddress('');
            setShowAddrSheet(false);
        } catch {
            toast.error('Failed to save address');
        }
    };

    // ─── Select Saved Address ───
    const handleSelectAddr = (addr) => {
        setSelectedAddr(addr);
        setShowAddrSheet(false);
    };

    // ─── Navigate to Payment ───
    const handleMakePayment = () => {
        if (!selectedAddr) {
            setShowAddrSheet(true);
            toast.error('Please select a delivery address');
            return;
        }
        // Navigate to PaymentPage with state
        navigate('/payment', {
            state: {
                vendorId,
                items: items.map(i => ({
                    productId: i.productId, variationLabel: i.variationLabel,
                    quantity: i.quantity, name: i.name, image: i.image, price: i.price,
                    weightLabel: i.weightLabel,
                })),
                deliveryAddress: selectedAddr,
                specialInstructions,
                couponCode: appliedCoupon?.couponCode || null,
                subtotal, discount, deliveryFee, handlingFee, grandTotal,
            }
        });
    };

    // ─── Empty Cart ───
    if (items.length === 0) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6 bg-white">
                <div className="max-w-md w-full text-center">
                    <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <ShoppingBag size={48} className="text-[#D11243]" />
                    </div>
                    <h2 className="text-2xl font-bold text-secondary mb-3">Your bag is empty</h2>
                    <p className="text-slate-400 mb-8 text-sm">Add some fresh cuts to get started!</p>
                    <button onClick={() => navigate('/')}
                        className="w-full bg-[#D11243] text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200/40">
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-28">

            {/* ════════════════════════════════════════ */}
            {/* STICKY DELIVERY HEADER                  */}
            {/* ════════════════════════════════════════ */}
            <div className="sticky top-0 z-[80] bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-secondary hover:bg-gray-100 transition-colors flex-shrink-0">
                        <ArrowLeft size={18} />
                    </button>

                    <button onClick={() => setShowAddrSheet(true)}
                        className="flex-1 flex items-center gap-3 min-w-0 bg-gray-50 rounded-xl px-3 py-2.5 hover:bg-gray-100 transition-colors">
                        <MapPin size={16} className="text-[#D11243] flex-shrink-0" />
                        <div className="flex-1 min-w-0 text-left">
                            {selectedAddr ? (
                                <>
                                    <p className="text-xs font-bold text-secondary truncate">
                                        Deliver to {selectedAddr.label || 'Address'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        {selectedAddr.fullAddress || [selectedAddr.flat, selectedAddr.area, selectedAddr.city].filter(Boolean).join(', ')}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs font-bold text-[#D11243]">Select delivery address</p>
                            )}
                        </div>
                        <ChevronDown size={14} className="text-slate-300 flex-shrink-0" />
                    </button>
                </div>
            </div>

            {/* ════════════════════════════════════════ */}
            {/* MAIN CONTENT                            */}
            {/* ════════════════════════════════════════ */}
            <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                        <X size={14} /> {error}
                    </div>
                )}

                {/* ─── Cart Items ─── */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Your Items ({getTotalCount()})
                    </h3>
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.cartKey} className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-secondary truncate">{item.name}</h4>
                                    <p className="text-[11px] text-slate-400 font-medium">{item.weightLabel}</p>
                                </div>
                                <div className="flex items-center gap-0 bg-gray-50 border border-gray-100 rounded-lg">
                                    <button onClick={() => removeItem(item.cartKey)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#D11243] transition-colors">
                                        {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                                    </button>
                                    <span className="text-sm font-bold text-secondary w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => addItem({ _id: item.productId, name: item.name, image: item.image, vendorId }, { label: item.variationLabel, price: item.price })}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#D11243] transition-colors">
                                        <Plus size={13} />
                                    </button>
                                </div>
                                <span className="text-sm font-bold text-secondary w-14 text-right">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    {/* Add More Items */}
                    <button onClick={() => navigate('/')}
                        className="w-full mt-4 py-2.5 text-xs font-bold text-[#D11243] bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 border border-dashed border-red-200">
                        <Plus size={14} /> Add More Items
                    </button>
                </section>

                {/* ─── Special Instructions ─── */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <MessageSquare size={12} /> Delivery Instructions
                    </label>
                    <input
                        type="text" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="e.g., Ring doorbell, call before..."
                        className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-xs font-medium text-secondary border border-gray-100 focus:ring-1 focus:ring-[#D11243]/10 outline-none"
                    />
                </section>

                {/* ─── Coupon Section ─── */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Tag size={12} /> Apply Coupon
                    </label>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Enter code" value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={!!appliedCoupon}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider focus:border-[#D11243]/30 outline-none" />
                        {appliedCoupon ? (
                            <button onClick={handleRemoveCoupon} className="bg-red-100 text-red-600 px-4 rounded-xl font-bold text-xs">Remove</button>
                        ) : (
                            <button onClick={handleApplyCoupon} className="bg-[#15161D] text-white px-4 rounded-xl font-bold text-xs">Apply</button>
                        )}
                    </div>
                    {couponError && <p className="text-red-500 text-[11px] font-bold mt-2">{couponError}</p>}
                    {appliedCoupon && (
                        <p className="text-emerald-600 text-[11px] font-bold mt-2 flex items-center gap-1">
                            <CheckCircle size={12} /> You save ₹{appliedCoupon.discountAmount}!
                        </p>
                    )}
                </section>

                {/* ─── Bill Details ─── */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
                    {previewLoading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#D11243]" size={24} />
                        </div>
                    )}
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bill Details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Item Total</span>
                            <span className="font-bold text-secondary">₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>Coupon Discount</span>
                                <span className="font-bold">-₹{discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-slate-500">Delivery Fee</span>
                            <span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-600' : 'text-secondary'}`}>
                                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                            </span>
                        </div>
                        {handlingFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Taxes & Platform Fees</span>
                                <span className="font-bold text-secondary">₹{handlingFee.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between">
                            <span className="font-bold text-secondary text-base">Grand Total</span>
                            <span className="font-black text-secondary text-base">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* ════════════════════════════════════════ */}
            {/* STICKY BOTTOM — Make Payment             */}
            {/* ════════════════════════════════════════ */}
            <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-gray-100 shadow-sheet safe-area-bottom">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                        <p className="text-xl font-black text-secondary">
                            {previewLoading ? <span className="opacity-0">₹0</span> : `₹${grandTotal.toFixed(2)}`}
                            {previewLoading && <Loader2 className="absolute ml-1 animate-spin text-slate-300 inline" size={18} style={{ marginTop: '2px' }} />}
                        </p>
                    </div>
                    <button onClick={handleMakePayment} disabled={loading || previewLoading}
                        className="bg-[#D11243] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-red-200/40 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <>Make Payment <ArrowRight size={18} /></>}
                    </button>
                </div>
            </div>

            {/* ════════════════════════════════════════ */}
            {/* ADDRESS BOTTOM SHEET                     */}
            {/* ════════════════════════════════════════ */}
            <AnimatePresence>
                {showAddrSheet && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setShowAddrSheet(false); setAddingNew(false); setNewAddrStep('gps'); }}
                            className="fixed inset-0 z-[200] bg-black/40"
                        />
                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[201] bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto safe-area-bottom"
                        >
                            <div className="p-5">
                                {/* Handle */}
                                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

                                {!addingNew ? (
                                    <>
                                        {/* Title + Close */}
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-base font-bold text-secondary">Select Delivery Address</h3>
                                            <button onClick={() => setShowAddrSheet(false)} className="text-slate-300 hover:text-secondary">
                                                <X size={20} />
                                            </button>
                                        </div>

                                        {/* Add New Address Button */}
                                        <button onClick={async () => {
                                            const success = await handlePrefillGlobalLocation();
                                            if (!success) {
                                                setAddingNew(true);
                                                setNewAddrStep('gps');
                                            }
                                        }}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 border border-dashed border-red-200 rounded-2xl text-xs font-bold text-[#D11243] hover:bg-red-100 transition-colors mb-4">
                                            <Plus size={14} /> Add New Address
                                        </button>

                                        {/* Saved Addresses */}
                                        {savedAddresses.length === 0 ? (
                                            <div className="text-center py-8">
                                                <MapPin size={28} className="text-slate-200 mx-auto mb-2" />
                                                <p className="text-xs text-slate-400 font-bold">No saved addresses yet</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {savedAddresses.map(addr => (
                                                    <button key={addr._id} onClick={() => handleSelectAddr(addr)}
                                                        className={`w-full text-left p-4 rounded-xl transition-all border-2 ${selectedAddr?._id === addr._id ? 'border-[#D11243] bg-red-50/50' : 'border-gray-100 bg-white hover:border-red-100'}`}>
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
                                    /* ═══ ADD NEW ADDRESS FLOW ═══ */
                                    <>
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => {
                                                    if (newAddrStep === 'details') setNewAddrStep('gps');
                                                    else { setAddingNew(false); setNewAddrStep('gps'); }
                                                }} className="text-slate-400 hover:text-secondary"><ArrowLeft size={18} /></button>
                                                <h3 className="text-base font-bold text-secondary">
                                                    {newAddrStep === 'gps' ? 'Detect Location' : 'Address Details'}
                                                </h3>
                                            </div>
                                            <button onClick={() => { setShowAddrSheet(false); setAddingNew(false); setNewAddrStep('gps'); }}
                                                className="text-slate-300 hover:text-secondary"><X size={20} /></button>
                                        </div>

                                        {newAddrStep === 'gps' && (
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
                                                            <button onClick={handleDetectGPS}
                                                                className="bg-[#D11243] text-white font-bold px-6 py-3 rounded-xl text-xs shadow-lg shadow-red-200/40">
                                                                Detect My Location
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {gpsAddress && (
                                                    <button onClick={() => { setNewAddrStep('details'); setAddrArea(gpsAddress); }}
                                                        className="w-full bg-[#D11243] text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200/40 flex items-center justify-center gap-2">
                                                        Proceed <ChevronRight size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {newAddrStep === 'details' && (
                                            <div className="space-y-4">
                                                {/* Contact Details — always visible since sign-in is email-only */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Details</h4>
                                                    <div className="space-y-2">
                                                        <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)}
                                                            placeholder="Full Name *"
                                                            className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                                        <input type="tel" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                            placeholder="Phone Number (10 digits) *"
                                                            className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                                    </div>
                                                </div>

                                                {/* Location Details */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location Details</h4>
                                                    <div className="space-y-2">
                                                        <input type="text" value={addrBuilding} onChange={(e) => setAddrBuilding(e.target.value)}
                                                            placeholder="Building / Floor *"
                                                            className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                                        <input type="text" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)}
                                                            placeholder="Street (recommended)"
                                                            className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                                        <div className="flex items-start gap-2">
                                                            <textarea value={addrArea} onChange={(e) => setAddrArea(e.target.value)}
                                                                placeholder="Area / Locality & Full Address"
                                                                rows={3}
                                                                className="flex-1 bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none resize-none" />
                                                            <button onClick={handleDetectGPS}
                                                                className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-slate-500 hover:text-[#D11243] transition-colors flex-shrink-0 mt-0.5">
                                                                <Navigation size={16} className="mb-0.5" /> Auto<br />Detect
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Save As */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Save Address As</h4>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {[
                                                            { id: 'Home', icon: '🏠' },
                                                            { id: 'Work', icon: '🏢' },
                                                            { id: 'Other', icon: '📍' },
                                                        ].map(t => (
                                                            <button key={t.id} onClick={() => !t.disabled && setAddrLabel(t.id)}
                                                                disabled={t.disabled}
                                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${t.disabled ? 'bg-gray-100 text-slate-300 cursor-not-allowed' : addrLabel === t.id ? 'bg-[#D11243] text-white' : 'bg-gray-50 text-slate-500 border border-gray-200 hover:border-red-200'}`}>
                                                                {t.icon} {t.id} {t.disabled && '✓'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {addrLabel === 'Other' && (
                                                        <input type="text" value={addrCustomLabel} onChange={(e) => setAddrCustomLabel(e.target.value)}
                                                            placeholder="What's this place? (e.g., Mom's house)"
                                                            className="w-full mt-2 bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                                    )}
                                                </div>

                                                {/* Delivery Instructions */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Instructions (optional)</h4>
                                                    <input type="text" value={addrInstructions} onChange={(e) => setAddrInstructions(e.target.value)}
                                                        placeholder="e.g., Leave at guard desk..."
                                                        className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                                </div>

                                                {/* Save Button */}
                                                <button onClick={handleSaveNewAddress}
                                                    className="w-full bg-[#D11243] text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200/40 flex items-center justify-center gap-2">
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

            {/* Login Sheet */}
            <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
    );
}
