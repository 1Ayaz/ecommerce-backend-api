import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import LoginSheet from './LoginSheet';

export default function ProductCard({ product }) {
    const { items, addItem, removeItem, getItemCount } = useCartStore();
    const { user } = useAuthStore();
    const [showLogin, setShowLogin] = useState(false);

    // Default to first variant
    const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);

    if (!selectedVariant) return null;

    const count = getItemCount(product._id, selectedVariant._id);

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            setShowLogin(true);
            return;
        }
        addItem(product, selectedVariant);
    };

    const handleRemove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cartKey = `${product._id}_${selectedVariant._id}_default`;
        removeItem(cartKey);
    };

    const discount = selectedVariant.marketPrice && selectedVariant.marketPrice > selectedVariant.price
        ? Math.round(((selectedVariant.marketPrice - selectedVariant.price) / selectedVariant.marketPrice) * 100)
        : 0;

    return (
        <div className="bg-white rounded-xl p-3 shadow-sm border border-brand-border flex flex-col h-full relative hover:shadow-md transition-shadow">
            {/* Image Area - Links to PDP */}
            <Link to={`/product/${product._id}`} className="block relative aspect-square rounded-lg overflow-hidden bg-gray-50 mb-3">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'https://placehold.co/300x300/F4F6FB/8D99AE?text=🐔';
                    }}
                />
                {discount > 0 && (
                    <span className="absolute top-0 left-0 bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">
                        {discount}% OFF
                    </span>
                )}
            </Link>

            {/* Info Area */}
            <div className="flex-1">
                <div className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                    {product.deliveryTime || 20} mins
                </div>
                <Link to={`/product/${product._id}`} className="block">
                    <h3 className="text-brand-dark font-semibold text-sm leading-tight mb-1 line-clamp-2 hover:text-brand-red transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {/* Variants Selection (Instamart Pill Style) */}
                <div className="flex flex-wrap gap-1.5 my-2">
                    {product.variants.map((v) => (
                        <button
                            key={v._id}
                            onClick={() => setSelectedVariant(v)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${selectedVariant._id === v._id
                                    ? 'border-brand-red bg-brand-red/5 text-brand-red'
                                    : 'border-brand-border text-brand-muted hover:border-brand-red/30'
                                }`}
                        >
                            {v.weight}
                            {v.bestValue && <span className="ml-1 text-[8px] opacity-70">★</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer: Price and Thumb-Friendly ADD Button */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-brand-border/40">
                <div className="flex flex-col">
                    {selectedVariant.marketPrice && selectedVariant.marketPrice > selectedVariant.price && (
                        <span className="text-[10px] text-brand-muted line-through">₹{selectedVariant.marketPrice}</span>
                    )}
                    <span className="text-brand-dark font-bold text-sm">₹{selectedVariant.price}</span>
                </div>

                {/* Instamart Style Add/Quantity Button */}
                <div className="relative h-9 w-20 flex items-center justify-center">
                    {count > 0 ? (
                        <div className="absolute inset-0 bg-brand-red text-white rounded-lg flex items-center justify-between px-1 shadow-sm">
                            <button
                                onClick={handleRemove}
                                className="p-1 hover:bg-red-800 rounded transition-colors"
                                aria-label="Decrease quantity"
                            >
                                <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="font-bold text-xs">{count}</span>
                            <button
                                onClick={handleAdd}
                                className="p-1 hover:bg-red-800 rounded transition-colors"
                                aria-label="Increase quantity"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleAdd}
                            className="absolute inset-0 bg-white border border-brand-red text-brand-red font-bold text-xs rounded-lg shadow-sm uppercase tracking-wide hover:bg-brand-red hover:text-white transition-all active:scale-95"
                        >
                            Add
                        </button>
                    )}
                </div>
            </div>

            <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
    );
}
