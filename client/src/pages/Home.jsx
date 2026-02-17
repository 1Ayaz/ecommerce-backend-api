import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ShieldCheck, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../config/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import ChickenProduct from '../components/ChickenProduct';
import CategoryRail from '../components/CategoryRail';
import StickyCart from '../components/StickyCart';
import LoginSheet from '../components/LoginSheet';
import HeroSlider from '../components/HeroSlider';
import Footer from '../components/Footer';

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

    // Fetch store & data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Use locationData if available, otherwise fallback to default pincode
                let storeRes;
                if (locationData?.lat && locationData?.lng) {
                    storeRes = await API.get(`/stores/nearby?lat=${locationData.lat}&lng=${locationData.lng}`);
                } else {
                    storeRes = await API.get('/stores/nearby?pincode=533101');
                }

                const storeData = storeRes.data.data;
                setStore(storeData);

                const catRes = await API.get(`/products/categories?storeId=${storeData._id}`);
                setCategories(catRes.data.data);

                const prodRes = await API.get(`/products?storeId=${storeData._id}`);
                const allProds = prodRes.data.data;
                setProducts(allProds);

                // Simulate best sellers for now (first 5 products)
                setBestSellers(allProds.slice(0, 5));
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [locationData]);

    // Filter by category
    useEffect(() => {
        if (!store) return;
        const fetchFiltered = async () => {
            try {
                const url = activeCategory
                    ? `/products?storeId=${store._id}&categoryId=${activeCategory}`
                    : `/products?storeId=${store._id}`;
                const res = await API.get(url);
                setProducts(res.data.data);
            } catch (error) {
                console.error('Filter failed:', error);
            }
        };
        fetchFiltered();
    }, [activeCategory, store]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="h-[300px] bg-gray-100 rounded-2xl mb-8 animate-pulse"></div>
                <div className="h-6 bg-gray-100 rounded w-48 mb-6 animate-pulse"></div>
                <div className="flex gap-4 mb-12 overflow-hidden">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 w-48 bg-gray-100 rounded-xl flex-shrink-0 animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-light">
            <div className="max-w-7xl mx-auto px-4 py-4 pb-28 md:pb-6">
                {/* Hero Section */}
                <HeroSlider />

                {/* Trust Badges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { icon: <Clock className="text-brand-red" size={20} />, label: "20 Mins Delivery", sub: "Fast & Reliable" },
                        { icon: <ShieldCheck className="text-brand-green" size={20} />, label: "100% Halal", sub: "Certified Quality" },
                        { icon: <Zap className="text-orange-500" size={20} />, label: "Cut After Order", sub: "Maximum Freshness" },
                        { icon: <Star className="text-yellow-500" size={20} />, label: "Best in Rajahmundry", sub: "Customer Choice" },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-brand-border flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">{item.icon}</div>
                            <div>
                                <p className="text-[11px] font-bold text-brand-dark leading-none mb-1 uppercase tracking-tight">{item.label}</p>
                                <p className="text-[9px] text-brand-muted font-medium uppercase">{item.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Best Sellers (Horizontal Rail) */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-brand-dark uppercase tracking-tighter flex items-center gap-2">
                            <Star size={20} className="fill-brand-red text-brand-red" /> Best Sellers
                        </h3>
                        <button className="text-brand-red text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                        {bestSellers.map((product) => (
                            <div key={product._id} className="w-48 flex-shrink-0 snap-start">
                                <ChickenProduct product={product} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Categories Wrapper */}
                <div className="sticky top-[60px] z-30 bg-brand-light/80 backdrop-blur-md -mx-4 px-4 py-2 mb-6 border-b border-brand-border">
                    <CategoryRail
                        categories={categories}
                        activeId={activeCategory}
                        onSelect={setActiveCategory}
                    />
                </div>

                {/* Main Products Grid */}
                <div className="mb-12">
                    <h3 className="text-lg font-black text-brand-dark uppercase tracking-tighter mb-6">
                        {activeCategory ? categories.find(c => c._id === activeCategory)?.name : "Explore Our Menu"}
                    </h3>
                    {products.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-brand-border border-dashed">
                            <p className="text-lg font-bold text-brand-dark mb-2">No products found</p>
                            <p className="text-sm text-brand-muted">Try selecting a different category</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                            {products.map((product) => (
                                <ChickenProduct key={product._id} product={product} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sticky Cart (Mobile) */}
                <StickyCart
                    count={getTotalCount()}
                    total={getTotalPrice()}
                    onClick={() => {
                        if (!user) {
                            setShowLogin(true);
                        } else {
                            navigate('/checkout');
                        }
                    }}
                />

                {/* Login Sheet */}
                <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />
            </div>

            <Footer />
        </div>
    );
}
