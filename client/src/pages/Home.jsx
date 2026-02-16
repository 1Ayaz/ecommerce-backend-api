import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Shield } from 'lucide-react';
import API from '../config/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import ProductCard from '../components/ProductCard';
import CategoryRail from '../components/CategoryRail';
import StickyCart from '../components/StickyCart';
import LoginSheet from '../components/LoginSheet';

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { getTotalCount, getTotalPrice } = useCartStore();

    const [products, setProducts] = useState([]);
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
                const storeRes = await API.get('/stores/nearby?pincode=533101');
                const storeData = storeRes.data.data;
                setStore(storeData);

                const catRes = await API.get(`/products/categories?storeId=${storeData._id}`);
                setCategories(catRes.data.data);

                const prodRes = await API.get(`/products?storeId=${storeData._id}`);
                setProducts(prodRes.data.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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

    // Loading skeletons
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="bg-white rounded-2xl p-6 mb-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
                    <div className="h-4 bg-gray-100 rounded w-64"></div>
                </div>
                <div className="flex gap-3 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                    ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-3 animate-pulse">
                            <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-16"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-4 pb-28 md:pb-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-brand-red to-red-700 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl md:text-2xl font-bold mb-1">
                        {store?.name || 'Mubarak Fresh Chicken'}
                    </h2>
                    <p className="text-sm opacity-90 mb-4">Fresh • Cleaned • Cut After Order</p>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-1.5 text-sm">
                            <Clock size={14} />
                            <span className="font-medium">20 min delivery</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                            <MapPin size={14} />
                            <span className="font-medium">{store?.address?.split(',')[0] || 'Your Area'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                            <Shield size={14} />
                            <span className="font-medium">100% Fresh Guarantee</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
                <div className="absolute -right-4 -bottom-12 w-24 h-24 bg-white/5 rounded-full"></div>
            </div>

            {/* Categories */}
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-brand-dark uppercase tracking-wider mb-2">
                    Shop by Category
                </h3>
                <CategoryRail
                    categories={categories}
                    activeId={activeCategory}
                    onSelect={setActiveCategory}
                />
            </div>

            {/* Products Grid — Cards link to PDP (no quick-add) */}
            {products.length === 0 ? (
                <div className="text-center py-12 text-brand-muted">
                    <p className="text-lg font-medium mb-2">No products found</p>
                    <p className="text-sm">Try selecting a different category</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}

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
    );
}
