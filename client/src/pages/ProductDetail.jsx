import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Heart, Share2, ChevronDown, ChevronUp, Plus, Minus, ShoppingCart, Loader2, Truck, Shield, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';
import LoginSheet from '../components/LoginSheet';
import { ProductJsonLd, BreadcrumbJsonLd } from '../components/JsonLd';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { addItem, removeItem, getItemCount } = useCartStore();
    const { toggle: toggleWishlist, isWishlisted } = useWishlistStore();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [selectedVariation, setSelectedVariation] = useState(0);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/products/${id}`);
                setProduct(res.data.data);
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="animate-spin text-[#D11243]" size={28} />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-slate-400 font-bold">Product not found</p>
            </div>
        );
    }

    const variations = product.variations || [];
    const currentVar = variations[selectedVariation] || variations[0];
    const price = currentVar?.discountedPrice || currentVar?.price || currentVar?.basePrice || 0;
    const originalPrice = currentVar?.discountedPrice ? (currentVar?.price || currentVar?.basePrice) : null;
    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    const cartKey = `${product._id}_${currentVar?.label}`;
    const qtyInCart = currentVar ? getItemCount(product._id, currentVar.label) : 0;
    const images = product.images?.length > 0 ? product.images : [product.image];
    const wishlisted = isWishlisted(product._id);

    const handleAdd = () => {
        if (currentVar) addItem(product, currentVar);
    };
    const handleRemove = () => {
        if (cartKey) removeItem(cartKey);
    };
    const handleShare = async () => {
        const url = `${window.location.origin}/product/${product._id}`;
        if (navigator.share) {
            await navigator.share({ title: product.name, url });
        } else {
            navigator.clipboard.writeText(url);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-28">
            <Helmet>
                <title>{product.metaTitle || product.name}</title>
                <meta name="description" content={product.metaDescription || product.description} />
            </Helmet>
            {product.slug && (
                <>
                    <ProductJsonLd product={product} siteUrl={import.meta.env.VITE_SITE_URL || ''} />
                    <BreadcrumbJsonLd
                        items={[
                            { name: 'Home', url: '/' },
                            { name: product.name, url: `/product/${product._id}` },
                        ]}
                        siteUrl={import.meta.env.VITE_SITE_URL || ''}
                    />
                </>
            )}

            {/* ── Sticky Top Bar ── */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={() => navigate(-1)}
                        className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-secondary hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        {product.wishlistEnabled !== false && (
                            <button onClick={() => toggleWishlist(product._id)}
                                className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors">
                                <Heart size={18} className={wishlisted ? 'fill-[#D11243] text-[#D11243]' : 'text-slate-400'} />
                            </button>
                        )}
                        {product.shareEnabled !== false && (
                            <button onClick={handleShare}
                                className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-gray-100 transition-colors">
                                <Share2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                {/* ── Image Gallery ── */}
                <div className="relative">
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                        <img
                            src={images[activeImage]}
                            alt={product.imageAlt || product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2 justify-center py-3 px-4">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? 'border-[#D11243] shadow-sm' : 'border-gray-100'
                                        }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="absolute top-4 left-4 bg-[#D11243] text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                            {discount}% OFF
                        </div>
                    )}
                </div>

                {/* ── Product Info ── */}
                <div className="px-4 pt-4">
                    <h1 className="text-xl font-bold text-secondary leading-tight">{product.name}</h1>
                    <p className="text-sm text-slate-400 mt-1">{product.description}</p>

                    {/* Short Description */}
                    {product.showShortDescription !== false && product.shortDescription && (
                        <p className="text-sm text-slate-500 mt-3 leading-relaxed">{product.shortDescription}</p>
                    )}
                </div>

                {/* ── Variation Tabs ── */}
                {variations.length > 0 && (
                    <div className="px-4 mt-5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            {variations.length > 1 ? 'Select Pack Size' : 'Pack Size'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {variations.map((v, i) => {
                                const vPrice = v.discountedPrice || v.price || v.basePrice;
                                const isSelected = selectedVariation === i;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedVariation(i)}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isSelected
                                                ? 'bg-[#D11243] text-white shadow-lg shadow-red-200/40'
                                                : 'bg-gray-50 text-slate-600 border border-gray-200 hover:border-red-200'
                                            }`}
                                    >
                                        {v.label} · ₹{vPrice}
                                    </button>
                                );
                            })}
                        </div>
                        {currentVar?.desc && (
                            <p className="text-[11px] text-slate-400 mt-2">{currentVar.desc}</p>
                        )}
                    </div>
                )}

                {/* ── Price Display ── */}
                <div className="px-4 mt-5">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-secondary">₹{price}</span>
                        {originalPrice && (
                            <>
                                <span className="text-base text-slate-400 line-through">₹{originalPrice}</span>
                                <span className="text-sm font-bold text-green-600">{discount}% off</span>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Info Badges ── */}
                <div className="px-4 mt-4 flex gap-3">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2">
                        <Clock size={14} className="text-[#D11243]" />
                        <span className="text-[10px] font-bold text-slate-500">{product.deliveryTime || 18} min</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2">
                        <Shield size={14} className="text-green-500" />
                        <span className="text-[10px] font-bold text-slate-500">Halaal · Vacuum Packed</span>
                    </div>
                </div>

                {/* ── Seller Details ── */}
                {product.showSellerDetails && product.sellerDetails && (
                    <div className="px-4 mt-5">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Seller Info</p>
                            {product.sellerDetails.name && (
                                <div className="flex items-center gap-2 mb-1">
                                    <Truck size={14} className="text-slate-400" />
                                    <span className="text-xs text-slate-600">{product.sellerDetails.name}</span>
                                </div>
                            )}
                            {product.sellerDetails.deliveryEstimate && (
                                <p className="text-xs text-slate-500 ml-5 mb-1">Delivers in {product.sellerDetails.deliveryEstimate}</p>
                            )}
                            {product.sellerDetails.foodLicense && (
                                <p className="text-[10px] text-slate-400 ml-5">FSSAI: {product.sellerDetails.foodLicense}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Full Description ── */}
                {product.showFullDescription !== false && product.fullDescription && (
                    <div className="px-4 mt-5">
                        <button
                            onClick={() => setShowFullDesc(!showFullDesc)}
                            className="w-full flex items-center justify-between py-3 border-t border-gray-100"
                        >
                            <span className="text-sm font-bold text-secondary">Product Details</span>
                            {showFullDesc ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                        </button>
                        <AnimatePresence>
                            {showFullDesc && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <p className="text-sm text-slate-500 leading-relaxed pb-4">{product.fullDescription}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Sticky Bottom Bar ── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-sheet safe-area-bottom">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                        <p className="text-xl font-black text-secondary">₹{price * Math.max(qtyInCart, 1)}</p>
                    </div>

                    {qtyInCart > 0 ? (
                        <div className="flex items-center gap-1">
                            <div className="flex items-center bg-[#D11243] rounded-2xl overflow-hidden shadow-lg">
                                <button onClick={handleRemove} className="w-11 h-11 flex items-center justify-center text-white active:bg-red-800">
                                    <Minus size={18} strokeWidth={2.5} />
                                </button>
                                <span className="text-white font-bold text-base min-w-[2rem] text-center">{qtyInCart}</span>
                                <button onClick={handleAdd} className="w-11 h-11 flex items-center justify-center text-white active:bg-red-800">
                                    <Plus size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                            <button
                                onClick={() => navigate('/checkout')}
                                className="bg-secondary text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                            >
                                <ShoppingCart size={16} /> Checkout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleAdd}
                            className="bg-[#D11243] text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-red-200/40 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} strokeWidth={2.5} /> Add to Cart
                        </button>
                    )}
                </div>
            </div>

            <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
    );
}
