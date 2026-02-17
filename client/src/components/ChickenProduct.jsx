import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import LoginSheet from './LoginSheet';
import ProductImageCarousel from './ProductImageCarousel';

export default function ChickenProduct({ product }) {
    const { addItem, removeItem, getItemCount } = useCartStore();
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

    // Calculate discount percentage
    const discount = selectedVariant?.marketPrice
        ? Math.round(((selectedVariant.marketPrice - selectedVariant.price) / selectedVariant.marketPrice) * 100)
        : 0;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl border border-brand-border overflow-hidden flex flex-col h-full group transition-shadow hover:shadow-xl hover:shadow-brand-red/5 p-3"
        >
            {/* Image Area - Links to PDP */}
            <Link to={`/product/${product._id}`} className="block relative aspect-square mb-3">
                <ProductImageCarousel
                    images={product.images || [product.image]}
                    alt={product.name}
                />

                {/* Discount Badge */}
                {discount > 0 && (
                    <div className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 z-20">
                        <Zap size={10} className="fill-white" /> {discount}% OFF
                    </div>
                )}

                {/* Best Value Badge */}
                {selectedVariant?.bestValue && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-brand-dark text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm border border-yellow-500 z-20">
                        BEST VALUE
                    </div>
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
                            >
                                <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="font-bold text-xs">{count}</span>
                            <button
                                onClick={handleAdd}
                                className="p-1 hover:bg-red-800 rounded transition-colors"
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
        </motion.div>
    );
}
