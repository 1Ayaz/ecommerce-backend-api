import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useWishlistStore from '../store/useWishlistStore';
import useCartStore from '../store/useCartStore';
import { toast } from 'react-toastify';

/**
 * WishlistPage — full page view of all wishlisted products.
 * Linked from CustomerDashboard.
 */
export default function WishlistPage() {
    const navigate = useNavigate();
    const { items, loading, toggle } = useWishlistStore();
    const { addItem, items: cartItems } = useCartStore();

    const isInCart = (productId) =>
        cartItems.some(c => c.productId === productId);

    const handleAddToCart = (product) => {
        const firstVariation = product.variations?.[0];
        if (!firstVariation) {
            toast.error('No variation available');
            return;
        }
        addItem(product, firstVariation);
        toast.success(`${product.name} added to cart!`);
    };

    const handleRemove = (product) => {
        toggle(product);
        toast.success('Removed from wishlist');
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-secondary hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-secondary">My Wishlist</h1>
                        <p className="text-[10px] text-slate-400">
                            {items.length} {items.length === 1 ? 'item' : 'items'} saved
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-5">
                {loading ? (
                    <div className="flex items-center justify-center h-56">
                        <Loader2 size={32} className="animate-spin text-[#D11243]" />
                    </div>
                ) : items.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="flex flex-col items-center justify-center py-24 gap-5">
                        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
                            <Heart size={36} className="text-[#D11243]" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-black text-secondary mb-2">Your wishlist is empty</h2>
                            <p className="text-sm text-slate-400">Tap the ♥ on any product to save it here</p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-[#D11243] text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-red-200/40"
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    /* ── Product Grid ── */
                    <div className="space-y-3">
                        <AnimatePresence>
                            {items.map((product) => {
                                const p = typeof product === 'string' ? null : product;
                                if (!p) return null;
                                const firstVar = p.variations?.[0];
                                const price = firstVar?.discountedPrice || firstVar?.price || firstVar?.basePrice || 0;
                                const originalPrice = firstVar?.discountedPrice ? (firstVar?.price || firstVar?.basePrice) : null;

                                return (
                                    <motion.div
                                        key={p._id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
                                    >
                                        {/* Product image */}
                                        <div
                                            className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                                            onClick={() => navigate(`/product/${p._id}`)}
                                        >
                                            <img
                                                src={p.image}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                                onError={e => { e.target.src = 'https://placehold.co/80x80?text=🥩'; }}
                                            />
                                        </div>

                                        {/* Info */}
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => navigate(`/product/${p._id}`)}
                                        >
                                            <h3 className="text-sm font-bold text-secondary truncate">{p.name}</h3>
                                            {firstVar && (
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{firstVar.label}</p>
                                            )}
                                            <div className="flex items-baseline gap-1.5 mt-1">
                                                <span className="text-base font-black text-secondary">₹{price}</span>
                                                {originalPrice && (
                                                    <span className="text-xs text-slate-400 line-through">₹{originalPrice}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleAddToCart(p)}
                                                className={`flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-xs transition-all ${isInCart(p._id)
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-[#D11243] text-white shadow-sm shadow-red-200/30 hover:bg-red-700'
                                                    }`}
                                            >
                                                <ShoppingBag size={12} />
                                                {isInCart(p._id) ? 'In Cart' : 'Add'}
                                            </button>
                                            <button
                                                onClick={() => handleRemove(p)}
                                                className="flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-xs bg-red-50 text-red-400 hover:bg-red-100 transition-colors border border-red-100"
                                            >
                                                <Trash2 size={12} />
                                                Remove
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Continue Shopping */}
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3.5 bg-white rounded-2xl border border-dashed border-gray-200 text-sm font-bold text-slate-400 hover:text-secondary hover:border-gray-300 transition-all mt-2"
                        >
                            + Browse More Products
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
