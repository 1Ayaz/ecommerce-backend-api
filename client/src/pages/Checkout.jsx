import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Wallet, Truck, MessageSquare, Minus, Plus, Trash2 } from 'lucide-react';
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
                <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck size={32} className="text-brand-muted" />
                </div>
                <h2 className="text-xl font-bold text-brand-dark mb-2">Your cart is empty</h2>
                <p className="text-sm text-brand-muted mb-6">Add some fresh chicken to get started!</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-brand-red text-white font-semibold px-8 py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                    Browse Menu
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-4 pb-28">
            <h2 className="text-xl font-bold text-brand-dark mb-4">Checkout</h2>

            {/* Cart Items */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-border mb-3 overflow-hidden">
                <h3 className="font-bold text-brand-dark p-4 pb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Truck size={16} className="text-brand-red" /> Your Order
                </h3>
                {items.map((item) => (
                    <div
                        key={item.productId}
                        className="flex items-center gap-3 p-4 border-t border-brand-border/50"
                    >
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-lg object-cover bg-gray-50"
                            onError={(e) => {
                                e.target.src = 'https://placehold.co/100x100/F4F6FB/8D99AE?text=🐔';
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-brand-dark truncate">{item.name}</h4>
                            <p className="text-xs text-brand-muted">
                                {item.weightLabel}
                                {item.selectedCut && ` · ${item.selectedCut}`}
                            </p>
                            <p className="text-sm font-bold text-brand-dark mt-0.5">₹{item.price * item.quantity}</p>
                        </div>
                        <div className="flex items-center bg-brand-red text-white rounded-lg px-1 py-1">
                            <button
                                onClick={() => removeItem(item.productId)}
                                className="p-1 hover:bg-red-800 rounded cursor-pointer"
                            >
                                {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                            </button>
                            <span className="font-bold text-xs mx-1.5 w-4 text-center">{item.quantity}</span>
                            <button
                                onClick={() =>
                                    addItem({
                                        _id: item.productId,
                                        name: item.name,
                                        price: item.price,
                                        image: item.image,
                                        weightLabel: item.weightLabel,
                                        cutOptions: [item.selectedCut],
                                        storeId,
                                    })
                                }
                                className="p-1 hover:bg-red-800 rounded cursor-pointer"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-border mb-3 p-4">
                <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <MapPin size={16} className="text-brand-red" /> Delivery Address
                </h3>
                <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full delivery address..."
                    className="w-full border border-brand-border rounded-lg p-3 text-sm text-brand-dark placeholder:text-gray-300 focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/30 outline-none resize-none"
                    rows={3}
                />
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-border mb-3 p-4">
                <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <MessageSquare size={16} className="text-brand-red" /> Special Instructions
                </h3>
                <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g., No skin, extra wash, etc."
                    className="w-full border border-brand-border rounded-lg p-3 text-sm text-brand-dark placeholder:text-gray-300 focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/30 outline-none"
                />
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-border mb-3 p-4">
                <h3 className="font-bold text-brand-dark mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Wallet size={16} className="text-brand-red" /> Payment
                </h3>
                <div className="flex gap-3">
                    {[
                        { value: 'COD', label: 'Cash on Delivery' },
                        { value: 'ONLINE', label: 'Pay Online' },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPaymentMethod(opt.value)}
                            className={`flex-1 py-3 rounded-lg text-sm font-semibold border-2 transition-all cursor-pointer ${paymentMethod === opt.value
                                    ? 'border-brand-red bg-brand-red/5 text-brand-red'
                                    : 'border-brand-border text-brand-muted hover:border-brand-red/30'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-border mb-4 p-4">
                <h3 className="font-bold text-brand-dark mb-3 text-sm uppercase tracking-wide">Bill Details</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-brand-muted">
                        <span>Item Total</span>
                        <span>₹{total}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                        <span>Delivery Fee</span>
                        <span className={deliveryFee === 0 ? 'text-brand-green font-medium' : ''}>
                            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                        </span>
                    </div>
                    <div className="border-t border-brand-border pt-2 flex justify-between font-bold text-brand-dark text-base">
                        <span>To Pay</span>
                        <span>₹{grandTotal}</span>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">{error}</div>
            )}

            {/* Place Order Button */}
            <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-brand-red text-white font-bold py-4 rounded-xl uppercase tracking-wide shadow-float hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 text-base"
            >
                {loading ? 'Placing Order...' : `Place Order · ₹${grandTotal}`}
            </button>
        </div>
    );
}
