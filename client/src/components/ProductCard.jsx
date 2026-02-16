import { Plus, Minus } from 'lucide-react';

export default function ProductCard({ product, count, onAdd, onRemove }) {
    return (
        <div className="bg-white rounded-xl p-3 shadow-sm border border-brand-border flex flex-col h-full relative hover:shadow-md transition-shadow">
            {/* Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 mb-3">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'https://placehold.co/300x300/F4F6FB/8D99AE?text=🐔';
                    }}
                />
                {product.marketPrice && product.marketPrice > product.price && (
                    <span className="absolute top-0 left-0 bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">
                        {Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100)}% OFF
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1">
                <div className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                    {product.deliveryTime || 20} mins
                </div>
                <h3 className="text-brand-dark font-semibold text-sm leading-tight mb-1 line-clamp-2">
                    {product.name}
                </h3>
                <div className="text-xs text-brand-muted mb-2">{product.weightLabel}</div>
            </div>

            {/* Price & Action */}
            <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex flex-col">
                    {product.marketPrice && product.marketPrice > product.price && (
                        <span className="text-xs text-brand-muted line-through">₹{product.marketPrice}</span>
                    )}
                    <span className="text-brand-dark font-bold text-sm">₹{product.price}</span>
                </div>

                {count === 0 ? (
                    <button
                        onClick={onAdd}
                        className="bg-white border border-brand-border text-brand-red font-bold text-xs px-5 py-2 rounded-lg shadow-sm hover:bg-brand-red hover:text-white transition-all uppercase cursor-pointer"
                    >
                        ADD
                    </button>
                ) : (
                    <div className="flex items-center bg-brand-red text-white rounded-lg px-1 py-1 shadow-sm">
                        <button
                            onClick={onRemove}
                            className="p-1 hover:bg-red-800 rounded cursor-pointer"
                            aria-label="Decrease quantity"
                        >
                            <Minus size={12} />
                        </button>
                        <span className="font-bold text-xs mx-1 w-4 text-center">{count}</span>
                        <button
                            onClick={onAdd}
                            className="p-1 hover:bg-red-800 rounded cursor-pointer"
                            aria-label="Increase quantity"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
