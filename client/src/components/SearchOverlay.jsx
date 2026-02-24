import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../config/api';

export default function SearchOverlay({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await API.get(`/products?search=${encodeURIComponent(query.trim())}`);
                setResults(res.data.data || []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-2xl mx-auto mt-20 bg-white rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <Search size={20} className="text-slate-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for fresh cuts, marinates..."
                        className="flex-1 text-base font-medium text-secondary outline-none placeholder:text-slate-300 bg-transparent"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-slate-300 hover:text-secondary">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="animate-spin text-[#D11243]" size={24} />
                        </div>
                    )}

                    {!loading && query && results.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-slate-400 font-medium text-sm">No results found for "{query}"</p>
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="p-3">
                            {results.map((product) => {
                                const variation = product.variations?.[0];
                                const price = variation?.price || variation?.basePrice || 0;
                                return (
                                    <button
                                        key={product._id}
                                        onClick={() => {
                                            onClose();
                                            navigate(`/product/${product.slug || product._id}`);
                                        }}
                                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>' }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-secondary text-sm truncate">{product.name}</p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {variation?.label || 'Standard'} · ₹{price}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!query && (
                        <div className="text-center py-10">
                            <p className="text-slate-300 font-medium text-sm">Start typing to search...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
