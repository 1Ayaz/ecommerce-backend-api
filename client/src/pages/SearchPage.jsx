import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../config/api';
import ChickenProduct from '../components/ChickenProduct';
import VariationSheet from '../components/VariationSheet';

const RECENT_KEY = 'mubarak_recent_searches';
const MAX_RECENT = 8;

export default function SearchPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const inputRef = useRef(null);

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recent, setRecent] = useState(
        JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    );

    // Variation sheet
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariations, setShowVariations] = useState(false);

    const saveSearch = (term) => {
        const updated = [term, ...recent.filter((r) => r !== term)].slice(0, MAX_RECENT);
        setRecent(updated);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    };

    const clearRecent = () => {
        setRecent([]);
        localStorage.removeItem(RECENT_KEY);
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await API.get(`/products/search?q=${encodeURIComponent(query.trim())}`);
                setResults(res.data.data || []);
                if (query.trim().length >= 3) saveSearch(query.trim());
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleShowVariations = (product) => {
        setSelectedProduct(product);
        setShowVariations(true);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-28">
            {/* Search Bar */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm px-4 md:px-8 py-3">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-secondary hover:bg-gray-100 flex-shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for products..."
                            className="w-full pl-9 pr-9 py-2.5 bg-gray-50 rounded-xl text-sm text-secondary placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#D11243]/20 transition-all"
                        />
                        {query && (
                            <button
                                onClick={() => { setQuery(''); setResults([]); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-8 pt-4">
                {/* Recent Searches */}
                {!query && recent.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent</h3>
                            <button onClick={clearRecent} className="text-[10px] text-[#D11243] font-bold">Clear</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recent.map((term, i) => (
                                <button
                                    key={i}
                                    onClick={() => setQuery(term)}
                                    className="px-3 py-1.5 bg-white border border-gray-100 rounded-full text-xs text-slate-600 font-medium hover:border-red-200"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#D11243]" size={24} />
                    </div>
                )}

                {/* Results */}
                {!loading && query && results.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-400 font-bold text-sm">No results for "{query}"</p>
                        <p className="text-slate-300 text-xs mt-1">Try a different search term</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
                    >
                        {results.map((product) => (
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
