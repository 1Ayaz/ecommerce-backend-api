import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Star, Plus, Tag, ChevronRight, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import ChickenProduct from '../components/ChickenProduct';
import VariationSheet from '../components/VariationSheet';
// CategoryCircles replaced with inline circle grid
import ReviewCard from '../components/ReviewCard';
import StickyCart from '../components/StickyCart';
import LoginSheet from '../components/LoginSheet';
import HeroSlider from '../components/HeroSlider';
import Footer from '../components/Footer';
import { LocalBusinessJsonLd } from '../components/JsonLd';
import { subscribeToPushNotifications } from '../utils/pushHelper';
import toast from 'react-hot-toast'; // Added for toast messages

export default function Home({ locationData }) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { getTotalCount, getTotalPrice } = useCartStore();

    const [products, setProducts] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [storeCoupons, setStoreCoupons] = useState([]);

    // Variations Modal State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariations, setShowVariations] = useState(false);

    const handleShowVariations = (product) => {
        setSelectedProduct(product);
        setShowVariations(true);
    };

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const lat = locationData?.lat ?? 17.0005;
                const lng = locationData?.lng ?? 81.804;
                const storeRes = await API.get(`/stores/nearby?lat=${lat}&lng=${lng}`);
                const storeData = storeRes.data.data;
                setStore(storeData);

                // Persist vendorId so all pages (category, search) can access it
                if (storeData?._id) {
                    localStorage.setItem('mubarak_vendorId', storeData._id);
                }

                // Parallel fetch: categories + products + coupons
                const [catRes, prodRes, couponRes] = await Promise.all([
                    API.get(`/products/categories?vendorId=${storeData._id}`),
                    API.get(`/products?vendorId=${storeData._id}`),
                    API.get(`/coupons/store/${storeData._id}`).catch(() => ({ data: { data: [] } })),
                ]);

                setCategories(catRes.data.data);
                const allProds = prodRes.data.data.map(p => ({ ...p, storeId: storeData._id }));
                setProducts(allProds);
                setBestSellers(allProds.slice(0, 6));
                setStoreCoupons(couponRes.data.data || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [locationData]);

    useEffect(() => {
        if (!store) return;
        const fetchFiltered = async () => {
            try {
                const url = activeCategory
                    ? `/products?vendorId=${store._id}&categoryId=${activeCategory}`
                    : `/products?vendorId=${store._id}`;
                const res = await API.get(url);
                setProducts(res.data.data.map(p => ({ ...p, storeId: store._id })));
            } catch (error) {
                console.error('Filter failed:', error);
            }
        };
        fetchFiltered();
    }, [activeCategory, store]);

    const reviews = [
        { author_name: "Ayaz Ahmad", rating: 5, text: "The freshest chicken in Rajahmundry! 20 min delivery is actually true.", relative_time_description: "2 days ago" },
        { author_name: "Rahul Verma", rating: 5, text: "Licious quality at better prices. The variation sheet is so easy to use.", relative_time_description: "1 week ago" },
        { author_name: "Suresh Babu", rating: 4, text: "Hand-cut exactly as requested in instructions. Highly recommended.", relative_time_description: "3 days ago" },
        { author_name: "Meera K.", rating: 5, text: "Cleaned so well, saved me 30 mins of prep time. Authentic taste!", relative_time_description: "5 days ago" },
    ];



    if (loading) {
        return (
            <div className="min-h-screen bg-brand-light flex items-center justify-center pt-20">
                <div className="max-w-7xl mx-auto px-4 py-4 pb-32 md:pb-12 animate-pulse">
                    {/* Hero skeleton */}
                    <div className="h-[250px] md:h-[400px] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl mb-8 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 bg-[#D11243]/20 rounded-full flex items-center justify-center">
                                <div className="w-6 h-6 bg-[#D11243]/30 rounded-full" />
                            </div>
                            <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">Loading fresh picks...</p>
                        </div>
                    </div>
                    {/* Category circles skeleton */}
                    <div className="flex gap-4 mb-8 overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200" />
                                <div className="w-12 h-2 bg-gray-200 rounded-full" />
                            </div>
                        ))}
                    </div>
                    {/* Product cards skeleton */}
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-[65vw] md:w-72 flex-shrink-0 bg-white rounded-2xl p-3 shadow-sm">
                                <div className="h-36 bg-gray-200 rounded-xl mb-3" />
                                <div className="h-3 bg-gray-200 rounded-full mb-2 w-3/4" />
                                <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-light">
            <Helmet>
                <title>Mubarak Fresh Chicken – Order Online | Delivery in 20 Minutes | Rajahmundry</title>
                <meta name="description" content="Order fresh, cleaned, halaal chicken online. Cut after order, delivered in 20 minutes. Best prices in Rajahmundry." />
            </Helmet>
            <LocalBusinessJsonLd siteUrl={import.meta.env.VITE_SITE_URL || ''} />

            <main className="max-w-7xl mx-auto px-4 pb-24 pt-6 md:pt-8 md:pb-12 min-h-screen">

                {/* Hero Banner */}
                <HeroSlider />

                {/* ═══════════════════════════════════════ */}
                {/* Best Sellers — Horizontal scroll mobile */}
                {/* ═══════════════════════════════════════ */}
                <section className="mb-10 md:mb-14">
                    <div className="flex items-center justify-between mb-5 md:mb-8">
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-secondary">Best Sellers</h3>
                            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Our most loved fresh cuts</p>
                        </div>
                    </div>

                    {/* Horizontal scroll on both mobile and desktop */}
                    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:-mx-8 md:px-8">
                        {bestSellers.map((product) => (
                            <div key={product._id} className="w-[58vw] md:w-[300px] flex-shrink-0 snap-start">
                                <ChickenProduct product={product} onShowVariations={handleShowVariations} />
                            </div>
                        ))}
                        {/* View All card */}
                        <div className="w-[58vw] md:w-[300px] flex-shrink-0 snap-start">
                            <button
                                onClick={() => navigate('/categories')}
                                className="w-full h-full min-h-[280px] bg-gradient-to-br from-gray-50 to-white rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 hover:border-[#D11243] hover:bg-red-50/30 transition-all group"
                            >
                                <div className="w-14 h-14 bg-[#D11243]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#D11243]/20 transition-colors">
                                    <ChevronRight size={24} className="text-[#D11243]" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-secondary text-sm">View All</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Explore our full menu</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════ */}
                {/* Promotional Banner (small)              */}
                {/* ═══════════════════════════════════════ */}
                <section className="mb-10 md:mb-14">
                    <div className="bg-gradient-to-r from-[#D11243] to-[#ff4d6d] rounded-2xl md:rounded-3xl p-5 md:p-8 text-white flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Limited Time</p>
                            <p className="text-lg md:text-2xl font-black leading-tight">Free Delivery<br />on ₹499+</p>
                        </div>
                        <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                            className="bg-white text-[#D11243] px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center gap-1 shadow-lg hover:shadow-xl transition-shadow">
                            Order Now <ChevronRight size={14} />
                        </button>
                    </div>
                </section>

                {/* ═══════════════════════════════════════ */}
                {/* Shop by Category — Circles              */}
                {/* ═══════════════════════════════════════ */}
                <section className="mb-10 md:mb-14">
                    <div className="flex items-center justify-between mb-5 md:mb-6">
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-secondary">Shop By Category</h3>
                            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Premium fresh cuts for you</p>
                        </div>
                        <button onClick={() => navigate('/categories')} className="text-xs text-[#D11243] font-bold">
                            See All
                        </button>
                    </div>

                    {/* Grid of circles — 68px mobile, 88px desktop */}
                    <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-[22px]">
                        {categories.map((cat) => (
                            <button
                                key={cat._id}
                                onClick={() => navigate(`/ category / ${cat.slug || cat._id} `)}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-[68px] h-[68px] md:w-[88px] md:h-[88px] rounded-full overflow-hidden bg-gray-50 shadow-sm group-hover:shadow-md transition-all">
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-red-50 flex items-center justify-center text-[#D11243] font-black text-xl md:text-2xl">
                                            {cat.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[12px] md:text-[14px] font-semibold text-secondary text-center leading-tight line-clamp-2 max-w-[72px] md:max-w-[92px] group-hover:text-[#D11243] transition-colors">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </section>



                {/* Coupons — only shown if vendor has active coupons */}
                {storeCoupons.length > 0 && (
                    <section className="mb-10 md:mb-14">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-secondary tracking-tight">Offers & Coupons</h3>
                                <p className="text-slate-500 text-xs">Save more on every order</p>
                            </div>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:-mx-8 md:px-8">
                            {storeCoupons.map((coupon, i) => (
                                <button key={i}
                                    onClick={() => { navigator.clipboard.writeText(coupon.code); }}
                                    className="w-[48vw] md:w-56 flex-shrink-0 snap-start bg-[#D11243] rounded-xl px-4 py-3 text-white flex items-center gap-3 hover:bg-[#b00f38] transition-colors active:scale-[0.97]"
                                >
                                    <Tag size={16} className="flex-shrink-0 opacity-70" />
                                    <div className="text-left">
                                        <p className="text-sm font-black tracking-wider">{coupon.code}</p>
                                        <p className="text-[9px] opacity-60 font-medium">
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                            {coupon.minOrderAmount > 0 ? ` above ₹${coupon.minOrderAmount} ` : ''}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Reviews — Horizontal scroll */}
                <section className="mb-10 md:mb-14">
                    <div className="flex items-center justify-between mb-4 md:mb-8">
                        <h3 className="text-base md:text-xl font-black text-brand-dark uppercase tracking-tighter">What our fans say</h3>
                        <div className="bg-brand-green/10 text-brand-green px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                            Google Reviews 4.8★
                        </div>
                    </div>
                    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:-mx-8 md:px-8">
                        {reviews.map((review, i) => (
                            <div key={i} className="w-[80vw] md:w-96 flex-shrink-0 snap-start">
                                <ReviewCard review={review} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sticky Cart */}
                <StickyCart
                    count={getTotalCount()}
                    total={getTotalPrice()}
                    onClick={() => {
                        if (!user) { setShowLogin(true); }
                        else { navigate('/checkout'); }
                    }}
                />

                <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />

                {selectedProduct && (
                    <VariationSheet
                        product={selectedProduct}
                        isOpen={showVariations}
                        onClose={() => setShowVariations(false)}
                    />
                )}
            </main>

            <Footer />
        </div >
    );
}

