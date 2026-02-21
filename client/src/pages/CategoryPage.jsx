import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../config/api';
import ChickenProduct from '../components/ChickenProduct';
import VariationSheet from '../components/VariationSheet';

export default function CategoryPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSlug, setActiveSlug] = useState(slug || 'all');

    // Variation sheet
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariations, setShowVariations] = useState(false);

    useEffect(() => {
        API.get('/categories')
            .then((res) => setCategories(res.data.data || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        setActiveSlug(slug || 'all');
    }, [slug]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/categories/${activeSlug}/products`);
                setProducts(res.data.data || []);
            } catch {
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [activeSlug]);

    const handleCategoryTap = (catSlug) => {
        navigate(`/category/${catSlug}`, { replace: true });
    };

    const handleShowVariations = (product) => {
        setSelectedProduct(product);
        setShowVariations(true);
    };

    const allCategories = [{ _id: 'all', name: 'All', slug: 'all' }, ...categories];

    return (
        <div className="min-h-screen bg-gray-50/50 pb-28">
            {/* ── Header ── */}
            <div className="sticky top-0 z-[80] bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-secondary hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h2 className="text-base font-bold text-secondary capitalize">
                        {activeSlug === 'all' ? 'All Products' : categories.find(c => c.slug === activeSlug)?.name || activeSlug}
                    </h2>
                </div>

                {/* ── Horizontal Category Circles ── */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 md:gap-[22px] px-4 md:px-8 pb-3 overflow-x-auto scrollbar-hide"
                >
                    {allCategories.map((cat) => (
                        <button
                            key={cat._id}
                            onClick={() => handleCategoryTap(cat.slug)}
                            className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
                        >
                            <div className={`w-[68px] h-[68px] md:w-[88px] md:h-[88px] rounded-full overflow-hidden transition-all ${activeSlug === cat.slug
                                    ? 'ring-2 ring-[#D11243] ring-offset-2 shadow-md shadow-red-200/40'
                                    : 'bg-gray-50 shadow-sm group-hover:shadow-md'
                                }`}>
                                {cat.image ? (
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-red-50 flex items-center justify-center text-[#D11243] font-black text-xl">
                                        {cat.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span className={`text-[12px] md:text-[14px] font-semibold text-center line-clamp-1 max-w-[72px] md:max-w-[92px] transition-colors ${activeSlug === cat.slug ? 'text-[#D11243]' : 'text-slate-500 group-hover:text-[#D11243]'
                                }`}>
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Product Grid ── */}
            <div className="max-w-4xl mx-auto px-4 md:px-8 pt-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#D11243]" size={28} />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-400 font-bold text-sm">No products found</p>
                        <p className="text-slate-300 text-xs mt-1">Try selecting a different category</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
                    >
                        {products.map((product) => (
                            <ChickenProduct
                                key={product._id}
                                product={product}
                                onShowVariations={handleShowVariations}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Variation Sheet */}
            <VariationSheet
                product={selectedProduct}
                isOpen={showVariations}
                onClose={() => setShowVariations(false)}
            />
        </div>
    );
}
