import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Wallet, Truck, MessageSquare, Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import API from '../config/api';

export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { items, storeId, addItem, removeItem, getTotalPrice, clearCart } = useCartStore();
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [address, setAddress] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const total = getTotalPrice();
    const deliveryFee = total >= 299 ? 0 : 30;
    const grandTotal = total + deliveryFee;

    const handlePlaceOrder = async () => {
        if (!address.trim()) {
            setError('Please enter your delivery address');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const orderData = {
                storeId,
                items: items.map((i) => ({
                    productId: i.productId,
                    variantId: i.variantId,
                    quantity: i.quantity,
                    selectedCut: i.selectedCut,
                })),
                deliveryAddress: {
                    label: 'Home',
                    fullAddress: address,
                },
                paymentMethod,
                specialInstructions,
            };

            const { data } = await API.post('/orders', orderData);
            clearCart();
            navigate('/order-success', { state: { orderId: data.data._id } });
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4 text-brand-muted">
                    <Truck size={32} />
                </div>
                <h2 className="text-xl font-bold text-brand-dark mb-2">Your cart is empty</h2>
                <p className="text-sm text-brand-muted mb-6">Your next fresh meal is just a few taps away!</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-brand-red text-white font-bold px-8 py-3.5 rounded-2xl shadow-float hover:bg-red-700 transition-all cursor-pointer"
                >
                    Order Now
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-4 pb-28">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-brand-muted hover:text-brand-dark transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-brand-dark">Checkout</h2>
            </div>

            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border mb-4 overflow-hidden">
                <div className="p-4 bg-brand-bg/30 border-b border-brand-border">
                    <h3 className="font-bold text-brand-dark flex items-center gap-2 text-xs uppercase tracking-widest">
                        <ShoppingBag size={14} className="text-brand-red" /> Items In Bag
                    </h3>
                </div>
                {items.map((item) => (
                    <div
                        key={item.cartKey}
                        className="flex items-center gap-3 p-4 border-b border-brand-border/50 last:border-0"
                    >
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-brand-border/30"
                            onError={(e) => {
                                e.target.src = 'https://placehold.co/100x100/F4F6FB/8D99AE?text=🐔';
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-brand-dark truncate">{item.name}</h4>
                            <p className="text-[11px] text-brand-muted font-semibold flex items-center gap-1">
                                {item.weightLabel} {item.selectedCut && <span>• {item.selectedCut}</span>}
                            </p>
                            <p className="text-sm font-extrabold text-brand-dark mt-1">₹{item.price * item.quantity}</p>
                        </div>
                        <div className="flex items-center bg-brand-dark text-white rounded-lg p-1 shadow-sm">
                            <button
                                onClick={() => removeItem(item.cartKey)}
                                className="p-1 px-1.5 hover:bg-white/10 rounded transition-colors"
                            >
                                {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                            </button>
                            <span className="font-bold text-xs mx-1 w-6 text-center">{item.quantity}</span>
                            <button
                                onClick={() =>
                                    addItem(
                                        { _id: item.productId, name: item.name, image: item.image, storeId },
                                        { _id: item.variantId, price: item.price, weight: item.weightLabel },
                                        item.selectedCut
                                    )
                                }
                                className="p-1 px-1.5 hover:bg-white/10 rounded transition-colors"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border mb-4 p-4">
                <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                    <MapPin size={14} className="text-brand-red" /> Delivery Address
                </h3>
                <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full address (e.g., Flat no, Street, Landmark...)"
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-xl p-3 text-sm text-brand-dark placeholder:text-gray-400 focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/30 outline-none resize-none transition-all"
                    rows={3}
                />
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border mb-4 p-4">
                <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                    <MessageSquare size={14} className="text-brand-red" /> Cleaning Instructions
                </h3>
                <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g., Extra wash, no leg pieces..."
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-xl p-3 text-sm text-brand-dark placeholder:text-gray-400 focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/30 outline-none"
                />
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border mb-4 p-4">
                <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                    <Wallet size={14} className="text-brand-red" /> Payment Mode
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'COD', label: 'Cash / Scan on Delivery' },
                        { value: 'ONLINE', label: 'Pay Online Now' },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPaymentMethod(opt.value)}
                            className={`px-3 py-3.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center text-center ${paymentMethod === opt.value
                                ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-sm'
                                : 'border-brand-border text-brand-muted hover:border-brand-red/30 bg-transparent'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border mb-6 p-5">
                <h3 className="font-bold text-brand-dark mb-4 text-xs uppercase tracking-widest">Payment Breakdown</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-brand-muted font-medium">
                        <span>Items Subtotal</span>
                        <span>₹{total}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted font-medium">
                        <span>Standard Delivery Charge</span>
                        <span className={deliveryFee === 0 ? 'text-brand-green font-bold' : ''}>
                            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                        </span>
                    </div>
                    <div className="border-t border-brand-border pt-4 flex justify-between font-extrabold text-brand-dark text-lg uppercase tracking-tight">
                        <span>Total to Pay</span>
                        <span className="text-brand-red">₹{grandTotal}</span>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 font-bold text-xs p-3 rounded-xl mb-4 text-center border border-red-100">{error}</div>
            )}

            {/* Place Order Button */}
            <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-brand-red text-white font-extrabold py-5 rounded-2xl uppercase tracking-widest shadow-float hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 text-base"
            >
                {loading ? 'Confirming Order...' : `Complete Order • ₹${grandTotal}`}
            </button>
        </div>
    );
}
