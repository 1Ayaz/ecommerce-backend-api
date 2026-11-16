import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, ChevronDown, Plus, Minus, Trash2, ArrowLeft, ShoppingBag,
    X, MessageSquare, ArrowRight, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import API from '../config/api';
import LoginSheet from '../components/LoginSheet';
import AddressSheet from '../components/AddressSheet';
import CouponInput from '../components/CouponInput';
import BillSummary from '../components/BillSummary';
import { toast } from 'react-toastify';

/* ══════════════════════════════════════════════════════════ */
/*  CHECKOUT PAGE — coordinator                              */
/*  All address logic → <AddressSheet />                    */
/*  All coupon logic  → <CouponInput />                     */
/*  All bill display  → <BillSummary />                     */
/* ══════════════════════════════════════════════════════════ */
export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { items, vendorId, addItem, removeItem, getTotalPrice, getTotalCount, clearCart } = useCartStore();

    // UI toggles
    const [showLogin, setShowLogin] = useState(false);
    const [showAddrSheet, setShowAddrSheet] = useState(false);

    // Core checkout state
    const [selectedAddr, setSelectedAddr] = useState(null);
    const [appliedCoupon, setAppliedCoupon] = useState(null);  // { couponCode, discountAmount }
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Live pricing preview from backend
    const [previewLoading, setPreviewLoading] = useState(false);
    const [financialSnapshot, setFinancialSnapshot] = useState(null);

    // Delivery mode & slot state
    const [selectedDeliveryMode, setSelectedDeliveryMode] = useState('instant');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [storeDeliveryModes, setStoreDeliveryModes] = useState(null);

    // ─── Gate: show login sheet if guest tries to checkout ───
    useEffect(() => {
        if (!user && items.length > 0) setShowLogin(true);
    }, [user]);

    // ─── Live preview — debounced, re-fetches when key inputs change ───
    useEffect(() => {
        if (!user || items.length === 0 || !vendorId) return;

        let isMounted = true;
        const fetchPreview = async () => {
            setPreviewLoading(true);
            try {
                // Best available location: selected address > global localStorage
                let loc = selectedAddr?.location?.lat
                    ? selectedAddr.location
                    : JSON.parse(localStorage.getItem('userLocation') || '{}');

                const { data } = await API.post('/orders/preview', {
                    vendorId,
                    items: items.map(i => ({
                        productId: i.productId,
                        variationLabel: i.variationLabel,
                        quantity: i.quantity,
                    })),
                    deliveryAddress: selectedAddr || {
                        fullAddress: 'Pending Location',
                        location: loc?.lat ? loc : { lat: 0, lng: 0 },
                    },
                    paymentMethod: 'COD',
                    couponCode: appliedCoupon?.couponCode || null,
                });

                if (isMounted && data?.success) {
                    setFinancialSnapshot(data.data.financialSnapshot);
                    // Sync if backend rejected the coupon
                    if (!data.data.appliedCouponCode && appliedCoupon) {
                        setAppliedCoupon(null);
                    }
                }
            } catch (err) {
                if (isMounted) setError(err?.response?.data?.message || null);
            } finally {
                if (isMounted) setPreviewLoading(false);
            }
        };

        const t = setTimeout(fetchPreview, 400); // 400ms debounce
        return () => { isMounted = false; clearTimeout(t); };
    }, [items, selectedAddr, appliedCoupon, vendorId]);

    // ─── Derived billing values (preview or local fallback) ───
    const subtotal     = financialSnapshot?.itemsTotal   ?? getTotalPrice();
    const discount     = financialSnapshot?.discountAmount ?? (appliedCoupon ? appliedCoupon.discountAmount : 0);
    const deliveryFee  = financialSnapshot?.deliveryFee  ?? 0;
    const handlingFee  = (financialSnapshot?.platformFee ?? 0) + (financialSnapshot?.taxAmount ?? 0);
    const grandTotal   = financialSnapshot?.grandTotal   ?? (subtotal - discount + deliveryFee + handlingFee);

    // ─── Fetch store delivery modes ───
    useEffect(() => {
        if (!vendorId) return;
        API.get(`/stores/${vendorId}`)
            .then(res => setStoreDeliveryModes(res.data?.data?.deliveryModes || null))
            .catch(() => {}); // fail silently — instant is default
    }, [vendorId]);

    // ─── Navigate to payment page ───
    const handleMakePayment = () => {
        if (!user) {
            setShowLogin(true);
            toast.error('Please login with your WhatsApp number to checkout');
            return;
        }
        if (!user.name || user.name.startsWith('User')) {
            setShowLogin(true);
            toast.info('Please enter your full name before placing order');
            return;
        }
        if (!selectedAddr) {
            setShowAddrSheet(true);
            toast.error('Please select a delivery address');
            return;
        }
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
                deliveryMode: selectedDeliveryMode,
                scheduledSlot: selectedDeliveryMode === 'scheduled' ? selectedSlot : null,
            }
        });
    };

    // ─── Empty cart guard ───
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

            {/* ──── STICKY DELIVERY HEADER ──── */}
            <div className="sticky top-0 z-[80] bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-secondary hover:bg-gray-100 transition-colors flex-shrink-0">
                        <ArrowLeft size={18} />
                    </button>

                    <button
                        onClick={() => setShowAddrSheet(true)}
                        className="flex-1 flex items-center gap-3 min-w-0 bg-gray-50 rounded-xl px-3 py-2.5 hover:bg-gray-100 transition-colors"
                    >
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

            {/* ──── MAIN CONTENT ──── */}
            <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

                {/* Error banner */}
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
                                    <button
                                        onClick={() => addItem(
                                            { _id: item.productId, name: item.name, image: item.image, vendorId },
                                            { label: item.variationLabel, price: item.price }
                                        )}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#D11243] transition-colors">
                                        <Plus size={13} />
                                    </button>
                                </div>
                                <span className="text-sm font-bold text-secondary w-14 text-right">
                                    ₹{item.price * item.quantity}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => navigate('/')}
                        className="w-full mt-4 py-2.5 text-xs font-bold text-[#D11243] bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 border border-dashed border-red-200">
                        <Plus size={14} /> Add More Items
                    </button>
                </section>

                {/* ─── Delivery Instructions ─── */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <MessageSquare size={12} /> Delivery Instructions
                    </label>
                    <input
                        type="text"
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="e.g., Ring doorbell, call before..."
                        className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-xs font-medium text-secondary border border-gray-100 focus:ring-1 focus:ring-[#D11243]/10 outline-none"
                    />
                </section>

                {/* ─── Delivery Mode ─── */}
                {(() => {
                    if (!storeDeliveryModes) return null;
                    const now = new Date();
                    const todayIdx = now.getDay(); // 0=Sun..6=Sat
                    const nowMins = now.getHours() * 60 + now.getMinutes();
                    const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

                    const instantAvail = storeDeliveryModes.instant?.enabled;
                    const availableSlots = (storeDeliveryModes.scheduled?.enabled
                        ? (storeDeliveryModes.scheduled.slots || [])
                        : []
                    ).filter(s =>
                        s.isActive &&
                        (s.days || [0,1,2,3,4,5,6]).includes(todayIdx) &&
                        toMins(s.toTime) > nowMins   // slot hasn't ended yet today
                    );

                    if (!instantAvail && availableSlots.length === 0) {
                        return (
                            <section className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                                <p className="text-xs font-bold text-orange-600">⏳ No delivery slots available right now. Please check back later.</p>
                            </section>
                        );
                    }

                    // Auto-select if only one option
                    if (instantAvail && availableSlots.length === 0 && selectedDeliveryMode !== 'instant') {
                        setSelectedDeliveryMode('instant'); setSelectedSlot(null);
                    }
                    if (!instantAvail && availableSlots.length > 0 && selectedDeliveryMode !== 'scheduled') {
                        setSelectedDeliveryMode('scheduled');
                    }

                    const showToggle = instantAvail && availableSlots.length > 0;

                    return (
                        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Delivery Type</p>
                            {showToggle && (
                                <div className="flex gap-2 mb-3">
                                    <button
                                        onClick={() => { setSelectedDeliveryMode('instant'); setSelectedSlot(null); }}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${selectedDeliveryMode === 'instant' ? 'bg-[#D11243] text-white border-[#D11243]' : 'bg-gray-50 text-slate-500 border-gray-100'}`}
                                    >
                                        ⚡ Instant ({storeDeliveryModes.instant.etaMinutes || 30} min)
                                    </button>
                                    <button
                                        onClick={() => setSelectedDeliveryMode('scheduled')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${selectedDeliveryMode === 'scheduled' ? 'bg-[#D11243] text-white border-[#D11243]' : 'bg-gray-50 text-slate-500 border-gray-100'}`}
                                    >
                                        🕐 Schedule
                                    </button>
                                </div>
                            )}
                            {!showToggle && instantAvail && (
                                <div className="flex items-center gap-2 py-1 mb-2">
                                    <span className="text-sm font-bold text-secondary">⚡ Instant Delivery</span>
                                    <span className="text-xs text-slate-400">{storeDeliveryModes.instant.etaMinutes || 30} min</span>
                                </div>
                            )}
                            {(selectedDeliveryMode === 'scheduled' || (!instantAvail && availableSlots.length > 0)) && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available slots today</p>
                                    {availableSlots.map((slot, i) => (
                                        <button key={i}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${selectedSlot?.label === slot.label ? 'bg-red-50 border-[#D11243] text-[#D11243]' : 'bg-gray-50 border-gray-100 text-slate-600'}`}
                                        >
                                            {slot.label} · {slot.fromTime} – {slot.toTime}
                                        </button>
                                    ))}
                                    {availableSlots.length === 0 && (
                                        <p className="text-xs text-orange-500 font-medium">No more slots available today.</p>
                                    )}
                                </div>
                            )}
                        </section>
                    );
                })()}

                {/* ─── Coupon ─── */}
                <CouponInput
                    vendorId={vendorId}
                    subtotal={subtotal}
                    applied={appliedCoupon}
                    onApply={setAppliedCoupon}
                    onRemove={() => setAppliedCoupon(null)}
                />

                {/* ─── Bill Summary ─── */}
                <BillSummary
                    subtotal={subtotal}
                    deliveryFee={deliveryFee}
                    discount={discount}
                    handlingFee={handlingFee}
                    grandTotal={grandTotal}
                    loading={previewLoading}
                />
            </div>

            {/* ──── STICKY BOTTOM BAR ──── */}
            <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-gray-100 shadow-sheet safe-area-bottom">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                        <div className="relative">
                            <p className={`text-xl font-black text-secondary transition-opacity ${previewLoading ? 'opacity-30' : 'opacity-100'}`}>
                                ₹{grandTotal.toFixed(2)}
                            </p>
                            {previewLoading && (
                                <Loader2 className="absolute left-0 top-1 animate-spin text-slate-300" size={18} />
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleMakePayment}
                        disabled={loading || previewLoading}
                        className="bg-[#D11243] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-red-200/40 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <>Make Payment <ArrowRight size={18} /></>}
                    </button>
                </div>
            </div>

            {/* ──── SHEETS ──── */}
            <AddressSheet
                isOpen={showAddrSheet}
                onClose={() => setShowAddrSheet(false)}
                onSelect={setSelectedAddr}
                selectedAddr={selectedAddr}
                user={user}
            />

            <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
    );
}
