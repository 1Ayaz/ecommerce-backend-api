import { Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';

/**
 * Universal Product Card — used on Home, Category, Search.
 *
 * Props:
 *   product       — full product object
 *   onShowVariations(product) — callback to open variation bottom sheet
 */
export default function ChickenProduct({ product, onShowVariations }) {
    const navigate = useNavigate();
    const { addItem, removeItem, getItemCount } = useCartStore();

    const variations = product.variations || [];
    if (variations.length === 0) return null;

    const displayVar = variations[0];
    const hasMultiple = variations.length > 1;
    const price = displayVar.discountedPrice || displayVar.price || displayVar.basePrice || 0;
    const originalPrice = displayVar.discountedPrice ? (displayVar.price || displayVar.basePrice) : null;
    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    // Cart count for this product (total across all variations)
    const totalInCart = variations.reduce(
        (sum, v) => sum + getItemCount(product._id, v.label),
        0
    );

    // Quick-add logic: single variation → add directly, multiple → open sheet
    const handleAddClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasMultiple) {
            onShowVariations(product);
        } else {
            addItem(product, displayVar);
        }
    };

    const handleDecrease = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Find the first variation in cart and decrement
        for (const v of variations) {
            const cartKey = `${product._id}_${v.label}`;
            if (getItemCount(product._id, v.label) > 0) {
                removeItem(cartKey);
                return;
            }
        }
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={() => navigate(`/product/${product._id}`)}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100/60 flex flex-col h-full group cursor-pointer transition-all hover:shadow-lg"
        >
            {/* ── Image ── */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                <img
                    src={product.image}
                    alt={product.imageAlt || product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { e.target.src = 'https://placehold.co/600x450?text=Fresh+Chicken'; }}
                />

                {/* Discount badge */}
                {discount > 0 && (
                    <div className="absolute top-2 left-2 bg-[#D11243] text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-md">
                        {discount}% OFF
                    </div>
                )}
            </div>

            {/* ── Info ── */}
            <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-secondary font-bold text-sm leading-tight line-clamp-2 min-h-[2.25rem]">
                    {product.name}
                </h3>

                {/* Weight label */}
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {hasMultiple ? `${variations.length} options` : displayVar.label}
                </p>

                {/* Price + Add */}
                <div className="mt-auto pt-3 flex items-center justify-between">
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-secondary font-bold text-[15px]">₹{price}</span>
                            {originalPrice && (
                                <span className="text-xs text-slate-400 line-through">₹{originalPrice}</span>
                            )}
                        </div>
                        {hasMultiple && (
                            <p className="text-[10px] text-slate-400">onwards</p>
                        )}
                    </div>

                    {/* Add to Cart / Qty Controls */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        {totalInCart > 0 ? (
                            <div className="flex items-center bg-[#D11243] rounded-xl overflow-hidden shadow-lg">
                                <button
                                    onClick={handleDecrease}
                                    className="w-8 h-8 flex items-center justify-center text-white active:bg-red-800 transition-colors"
                                >
                                    <Minus size={14} strokeWidth={2.5} />
                                </button>
                                <span className="text-white font-bold text-sm min-w-[1.25rem] text-center">
                                    {totalInCart}
                                </span>
                                <button
                                    onClick={handleAddClick}
                                    className="w-8 h-8 flex items-center justify-center text-white active:bg-red-800 transition-colors"
                                >
                                    <Plus size={14} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={handleAddClick}
                                className="h-9 px-4 rounded-xl bg-white border-2 border-[#D11243] text-[#D11243] font-bold text-xs uppercase tracking-wide hover:bg-red-50 active:scale-95 shadow-sm transition-all"
                            >
                                ADD
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
