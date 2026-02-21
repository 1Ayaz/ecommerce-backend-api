import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ChevronRight, Package } from 'lucide-react';
import useCartStore from '../store/useCartStore';

export default function VariationSheet({ product, isOpen, onClose }) {
    const { addItem } = useCartStore();
    const variations = product?.variations || [];
    const [quantities, setQuantities] = useState({});

    // Reset quantities when sheet opens
    useEffect(() => {
        if (isOpen && variations.length > 0) {
            const init = {};
            variations.forEach(v => { init[v.label] = 0; });
            setQuantities(init);
        }
    }, [product, isOpen]);

    if (!product) return null;

    const increment = (label) => {
        setQuantities(prev => ({ ...prev, [label]: (prev[label] || 0) + 1 }));
    };

    const decrement = (label) => {
        setQuantities(prev => ({ ...prev, [label]: Math.max(0, (prev[label] || 0) - 1) }));
    };

    const handleAddAll = () => {
        variations.forEach(v => {
            const qty = quantities[v.label] || 0;
            for (let i = 0; i < qty; i++) {
                addItem(product, v);
            }
        });
        onClose();
    };

    const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0);
    const totalPrice = variations.reduce((sum, v) => {
        return sum + (v.price || v.basePrice || 0) * (quantities[v.label] || 0);
    }, 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
                    />

                    {/* Sheet — compact, centered on mobile, bottom-anchored */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center pointer-events-none"
                    >
                        <div className="bg-white rounded-t-3xl shadow-2xl w-full max-w-md pointer-events-auto">
                            {/* Header — compact */}
                            <div className="px-6 pt-5 pb-4 flex items-center gap-4 border-b border-gray-100">
                                <img
                                    src={product.image}
                                    alt=""
                                    className="w-14 h-14 rounded-2xl object-cover border border-gray-100"
                                    onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=Fresh'; }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-secondary leading-tight truncate">{product.name}</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">{product.description || 'Fresh • Cleaned • Cut After Order'}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-gray-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Variation Rows */}
                            <div className="px-6 py-4 space-y-3">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Select Pack Size</p>

                                {variations.map((v, idx) => {
                                    const qty = quantities[v.label] || 0;
                                    const price = v.price || v.basePrice || 0;

                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between py-3 px-4 bg-gray-50/80 rounded-2xl"
                                        >
                                            {/* Left: label + description */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                                                    <Package size={14} className="text-[#D11243]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-secondary">{v.label}</span>
                                                        <span className="text-sm font-bold text-[#D11243]">₹{price}</span>
                                                    </div>
                                                    {v.desc && (
                                                        <p className="text-[11px] text-slate-400 font-medium truncate">{v.desc}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: qty controls */}
                                            {qty > 0 ? (
                                                <div className="flex items-center gap-2 bg-[#D11243] rounded-full px-1.5 py-0.5">
                                                    <button
                                                        onClick={() => decrement(v.label)}
                                                        className="p-1 rounded-full hover:bg-red-600 text-white"
                                                    >
                                                        <Minus size={14} strokeWidth={3} />
                                                    </button>
                                                    <span className="font-bold text-white text-sm min-w-[1.25rem] text-center">{qty}</span>
                                                    <button
                                                        onClick={() => increment(v.label)}
                                                        className="p-1 rounded-full hover:bg-red-600 text-white"
                                                    >
                                                        <Plus size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => increment(v.label)}
                                                    className="px-4 py-1.5 bg-[#D11243] hover:bg-[#b00f38] text-white font-bold rounded-full text-xs flex items-center gap-1"
                                                >
                                                    <Plus size={14} strokeWidth={3} />
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom Action — compact */}
                            <div className="px-6 pb-6 pt-2">
                                {totalItems > 0 ? (
                                    <button
                                        onClick={handleAddAll}
                                        className="w-full bg-[#D11243] hover:bg-[#b00f38] text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 shadow-lg shadow-[#D11243]/20 active:scale-[0.98] transition-all"
                                    >
                                        <span className="text-sm">
                                            {totalItems} {totalItems === 1 ? 'item' : 'items'} • ₹{totalPrice}
                                        </span>
                                        <div className="flex items-center gap-1 text-sm">
                                            Add to Cart <ChevronRight size={16} strokeWidth={3} />
                                        </div>
                                    </button>
                                ) : (
                                    <p className="text-center text-xs text-slate-400 font-medium py-2">
                                        Select a pack size to add
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
