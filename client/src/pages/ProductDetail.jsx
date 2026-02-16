import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { ArrowLeft, Clock, Shield, Minus, Plus, MessageSquare, Info } from 'lucide-react';
import API from '../config/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import LoginSheet from '../components/LoginSheet';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { addItem, removeItem, getItemCount } = useCartStore();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedCut, setSelectedCut] = useState('');
    const [notes, setNotes] = useState('');
    const [showLogin, setShowLogin] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const { data } = await API.get(`/products/${id}`);
                const p = data.data;
                setProduct(p);
                setSelectedVariant(p.variants?.[0] || null);
                if (p.cutOptions?.length > 0) {
                    setSelectedCut(p.cutOptions[0]);
                }
            } catch (err) {
                console.error('Failed to fetch product:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const count = selectedVariant ? getItemCount(product?._id, selectedVariant._id, selectedCut) : 0;

    const handleAdd = () => {
        if (!user) {
            setShowLogin(true);
            return;
        }
        addItem(product, selectedVariant, selectedCut);
    };

    const handleRemove = () => {
        const cartKey = `${product._id}_${selectedVariant._id}_${selectedCut || 'default'}`;
        removeItem(cartKey);
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="animate-pulse">
                    <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
                    <div className="aspect-square bg-gray-200 rounded-2xl mb-6"></div>
                    <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (!product || !selectedVariant) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <h2 className="text-xl font-bold text-brand-dark mb-2">Product not found</h2>
                <button onClick={() => navigate('/')} className="text-brand-red font-semibold">Go back</button>
            </div>
        );
    }

    const discount = selectedVariant.marketPrice && selectedVariant.marketPrice > selectedVariant.price
        ? Math.round(((selectedVariant.marketPrice - selectedVariant.price) / selectedVariant.marketPrice) * 100)
        : 0;

    return (
        <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-brand-muted hover:text-brand-dark mb-4 transition-colors p-2 -ml-2"
            >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back</span>
            </button>

            {/* Product Image & Badges */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-6 shadow-sm">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = 'https://placehold.co/600x600/F4F6FB/8D99AE?text=🐔';
                    }}
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {discount > 0 && (
                        <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                            {discount}% OFF
                        </span>
                    )}
                    <span className="bg-white/90 backdrop-blur-sm text-brand-dark text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 border border-brand-border">
                        <Clock size={12} className="text-brand-green" /> 20 MINS
                    </span>
                </div>
            </div>

            {/* Title Area */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-[11px] text-brand-muted font-bold uppercase tracking-wider mb-1 px-1">
                    <span className="px-2 py-0.5 bg-brand-green/10 text-brand-green rounded-full">100% Fresh</span>
                    <span>•</span>
                    <span>Cleaned</span>
                    <span>•</span>
                    <span>Halaal</span>
                </div>
                <h1 className="text-2xl font-bold text-brand-dark mb-2">{product.name}</h1>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-brand-dark">₹{selectedVariant.price}</span>
                    {selectedVariant.marketPrice && selectedVariant.marketPrice > selectedVariant.price && (
                        <span className="text-lg text-brand-muted line-through">₹{selectedVariant.marketPrice}</span>
                    )}
                </div>
                <p className="text-sm text-brand-muted">Prices include all taxes.</p>
            </div>

            {/* Variant Selection (Thumb-Friendly Zone) */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-4 mb-4">
                <h3 className="font-bold text-brand-dark text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    Select Quantity
                    {selectedVariant.bestValue && <span className="bg-brand-green text-white text-[9px] px-1.5 py-0.5 rounded ml-2 animate-pulse">BEST VALUE</span>}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {product.variants.map((v) => (
                        <button
                            key={v._id}
                            onClick={() => setSelectedVariant(v)}
                            className={`relative px-4 py-3 rounded-xl border-2 text-left transition-all ${selectedVariant._id === v._id
                                    ? 'border-brand-red bg-brand-red/5'
                                    : 'border-brand-border hover:border-brand-red/30'
                                }`}
                        >
                            <div className="font-bold text-sm text-brand-dark">{v.weight}</div>
                            <div className="text-xs text-brand-muted font-semibold">₹{v.price}</div>
                            {selectedVariant._id === v._id && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-red"></div>
                            )}
                            {v.bestValue && !v.bestValue && (
                                <span className="absolute -top-2 right-2 bg-brand-green text-white text-[8px] font-bold px-1 rounded shadow-sm">SAVE MORE</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cut Type Selection */}
            {product.cutOptions && product.cutOptions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-4 mb-4">
                    <h3 className="font-bold text-brand-dark text-xs uppercase tracking-wide mb-3">
                        Select Cut Type <span className="text-brand-red">*</span>
                    </h3>
                    <Tab.Group
                        selectedIndex={product.cutOptions.indexOf(selectedCut)}
                        onChange={(index) => setSelectedCut(product.cutOptions[index])}
                    >
                        <Tab.List className="flex flex-wrap gap-2">
                            {product.cutOptions.map((cut) => (
                                <Tab
                                    key={cut}
                                    className={({ selected }) =>
                                        `px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all outline-none ${selected
                                            ? 'border-brand-dark bg-brand-dark text-white'
                                            : 'border-brand-border text-brand-muted hover:border-brand-dark/20'
                                        }`
                                    }
                                >
                                    {cut}
                                </Tab>
                            ))}
                        </Tab.List>
                    </Tab.Group>
                </div>
            )}

            {/* Special Instructions */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-4 mb-4">
                <h3 className="font-bold text-brand-dark text-xs uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MessageSquare size={14} className="text-brand-red" />
                    Special Instructions
                </h3>
                <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Small pieces, no skin..."
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-xl p-3 text-sm text-brand-dark placeholder:text-gray-400 focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/30 outline-none"
                />
            </div>

            {/* Product Info / Description */}
            <div className="p-1 mb-8">
                <h4 className="font-bold text-brand-dark text-sm mb-2 flex items-center gap-2">
                    <Info size={14} className="text-brand-muted" /> Product Details
                </h4>
                <p className="text-sm text-brand-muted leading-relaxed">
                    Our {product.name} is processed under strict quality control. 100% Halaal certified and delivered fresh from our local Rajahmundry store within 20 minutes of cutting.
                </p>
            </div>

            {/* CTA Section (Stays in Thumb Zone / Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border p-4 z-40 lg:static lg:border-0 lg:p-0">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    {count > 0 ? (
                        <div className="flex-1 flex items-center justify-between bg-brand-red text-white h-14 rounded-2xl px-6 shadow-float transition-all scale-100 active:scale-95">
                            <button
                                onClick={handleRemove}
                                className="w-10 h-10 flex items-center justify-center hover:bg-black/10 rounded-full transition-colors"
                                aria-label="Decrease quantity"
                            >
                                <Minus size={20} strokeWidth={3} />
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-lg leading-none">{count}</span>
                                <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">In Cart</span>
                            </div>
                            <button
                                onClick={handleAdd}
                                className="w-10 h-10 flex items-center justify-center hover:bg-black/10 rounded-full transition-colors"
                                aria-label="Increase quantity"
                            >
                                <Plus size={20} strokeWidth={3} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleAdd}
                            className="flex-1 bg-brand-red text-white font-bold h-14 rounded-2xl uppercase tracking-widest shadow-float hover:bg-red-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-3"
                        >
                            Add to Cart <span className="opacity-40">|</span> ₹{selectedVariant.price}
                        </button>
                    )}
                </div>
            </div>

            <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
    );
}
