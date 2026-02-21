import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Banknote, Smartphone, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import API from '../config/api';
import { toast } from 'react-toastify';

// Map backend toggle keys to display config
const PAYMENT_CONFIG = {
    codEnabled: { id: 'COD', label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: Banknote },
    mockUpiEnabled: { id: 'MOCK_UPI', label: 'UPI (Test Mode)', sub: 'Auto-confirms for testing', icon: Smartphone },
    upiEnabled: { id: 'UPI', label: 'Pay via UPI', sub: 'BHIM, PhonePe, GPay, etc.', icon: Smartphone },
    cardEnabled: { id: 'CARD', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: CreditCard },
    walletEnabled: { id: 'WALLET', label: 'Wallet', sub: 'Paytm, Amazon Pay, etc.', icon: Wallet },
};

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { clearCart } = useCartStore();

    const state = location.state;
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [enabledMethods, setEnabledMethods] = useState([{ id: 'COD', label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: Banknote }]);
    const [methodsLoading, setMethodsLoading] = useState(true);

    // ─── Fetch enabled payment methods from admin settings ───────────────
    useEffect(() => {
        API.get('/settings/public')
            .then(res => {
                const toggles = res.data?.data?.paymentMethods || {};
                const methods = Object.entries(PAYMENT_CONFIG)
                    .filter(([key]) => toggles[key] === true)
                    .map(([, cfg]) => cfg);

                if (methods.length > 0) {
                    setEnabledMethods(methods);
                    setPaymentMethod(methods[0].id); // Select first enabled by default
                } else {
                    // Fallback to COD if nothing explicitly enabled
                    setEnabledMethods([PAYMENT_CONFIG.codEnabled]);
                    setPaymentMethod('COD');
                }
            })
            .catch(() => {
                // Graceful fallback — don't crash checkout
                setEnabledMethods([PAYMENT_CONFIG.codEnabled]);
                setPaymentMethod('COD');
            })
            .finally(() => setMethodsLoading(false));
    }, []);

    if (!state || !state.items || state.items.length === 0) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-slate-400 font-bold mb-4">No order data found</p>
                    <button onClick={() => navigate('/')} className="bg-[#D11243] text-white font-bold px-6 py-3 rounded-xl">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const { vendorId, items, deliveryAddress, specialInstructions, couponCode, grandTotal } = state;

    const handlePlaceOrder = async () => {
        try {
            setLoading(true);
            setError(null);

            // Verify the selected method is still in enabled list
            const isMethodEnabled = enabledMethods.some(m => m.id === paymentMethod);
            if (!isMethodEnabled) {
                toast.error('Selected payment method is no longer available');
                setLoading(false);
                return;
            }

            // Update user phone if needed
            if (deliveryAddress.phone && deliveryAddress.phone !== user?.phone) {
                await API.put('/users/profile', { phone: deliveryAddress.phone }).catch(() => { });
            }

            const fullAddr = deliveryAddress.fullAddress || [deliveryAddress.flat, deliveryAddress.area, deliveryAddress.city].filter(Boolean).join(', ');

            const orderData = {
                vendorId,
                items: items.map(i => ({
                    productId: i.productId,
                    variationLabel: i.variationLabel,
                    quantity: i.quantity,
                })),
                deliveryAddress: {
                    label: deliveryAddress.label || 'Home',
                    name: deliveryAddress.name || user?.name || '',
                    phone: deliveryAddress.phone || user?.phone || '',
                    flat: deliveryAddress.flat || '',
                    building: deliveryAddress.building || '',
                    area: deliveryAddress.area || '',
                    landmark: deliveryAddress.landmark || '',
                    city: deliveryAddress.city || '',
                    state: deliveryAddress.state || '',
                    pincode: deliveryAddress.pincode || '',
                    fullAddress: fullAddr,
                    lat: deliveryAddress.lat || deliveryAddress.location?.lat || null,
                    lng: deliveryAddress.lng || deliveryAddress.location?.lng || null,
                },
                paymentMethod,
                specialInstructions: specialInstructions || '',
                couponCode: couponCode || null,
            };

            const { data } = await API.post('/orders', orderData);

            clearCart();
            toast.success('Order placed successfully!');
            navigate('/order-success', { state: { orderId: data.data._id }, replace: true });
        } catch (err) {
            setError(err.response?.data?.error?.message || err.response?.data?.message || 'Could not place your order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-28">
            {/* Header */}
            <div className="sticky top-0 z-[80] bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-secondary hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <h2 className="text-base font-bold text-secondary">Select Payment</h2>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
                        {error}
                    </div>
                )}

                {/* Order Summary Mini */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Summary</h3>
                    <div className="space-y-1.5">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                                <span className="text-slate-500">{item.quantity}x {item.name} <span className="text-slate-300">({item.weightLabel})</span></span>
                                <span className="font-bold text-secondary">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
                        <span className="text-sm font-bold text-secondary">Total</span>
                        <span className="text-lg font-black text-secondary">₹{grandTotal}</span>
                    </div>
                </section>

                {/* Payment Options */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Method</h3>
                    {methodsLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {enabledMethods.map(opt => {
                                const Icon = opt.icon;
                                return (
                                    <button key={opt.id} onClick={() => setPaymentMethod(opt.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${paymentMethod === opt.id ? 'border-[#D11243] bg-red-50/50' : 'border-gray-100 hover:border-red-100'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === opt.id ? 'bg-[#D11243] text-white' : 'bg-gray-50 text-slate-400'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-bold text-secondary">{opt.label}</p>
                                            <p className="text-[11px] text-slate-400">{opt.sub}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === opt.id ? 'border-[#D11243]' : 'border-gray-300'}`}>
                                            {paymentMethod === opt.id && <div className="w-2.5 h-2.5 bg-[#D11243] rounded-full" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Security Note */}
                <div className="flex items-center gap-2 px-2 py-3">
                    <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
                    <p className="text-[11px] text-slate-400">Your order will be verified with OTP at delivery for safety.</p>
                </div>
            </div>

            {/* Sticky Bottom — Place Order */}
            <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-gray-100 shadow-sheet safe-area-bottom">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <button onClick={handlePlaceOrder} disabled={loading}
                        className="w-full bg-[#D11243] text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200/40 active:scale-95 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <>Place Order • ₹{grandTotal} <ChevronRight size={18} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
