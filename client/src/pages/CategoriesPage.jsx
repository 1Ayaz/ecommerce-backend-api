import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../config/api';

export default function CategoriesPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await API.get('/categories');
                setCategories(res.data.data || []);
            } catch {
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#D11243]" size={28} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-28">
            {/* Header */}
            <div className="bg-white px-5 pt-5 pb-4">
                <h1 className="text-xl font-black text-secondary">Categories</h1>
                <p className="text-xs text-slate-400 mt-0.5">Browse by category</p>
            </div>

            {/* Category Grid */}
            <div className="px-4 md:px-8 pt-4 max-w-4xl mx-auto">
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-[22px]">
                    {categories.map((cat, idx) => (
                        <motion.button
                            key={cat._id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => navigate(`/category/${cat.slug || cat._id}`)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-[68px] h-[68px] md:w-[88px] md:h-[88px] rounded-full overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-all">
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => { e.target.src = 'https://placehold.co/200?text=' + cat.name; }}
                                />
                            </div>
                            <span className="text-[12px] md:text-[14px] font-semibold text-slate-600 text-center line-clamp-2 max-w-[72px] md:max-w-[92px] group-hover:text-[#D11243] transition-colors">
                                {cat.name}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
