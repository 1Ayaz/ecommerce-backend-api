export default function CategoryRail({ categories, activeId, onSelect }) {
    return (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-3 px-1">
            <button
                onClick={() => onSelect(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${activeId === null
                        ? 'bg-brand-red text-white shadow-sm'
                        : 'bg-white text-brand-dark border border-brand-border hover:border-brand-red/30'
                    }`}
            >
                All
            </button>
            {categories.map((cat) => (
                <button
                    key={cat._id}
                    onClick={() => onSelect(cat._id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${activeId === cat._id
                            ? 'bg-brand-red text-white shadow-sm'
                            : 'bg-white text-brand-dark border border-brand-border hover:border-brand-red/30'
                        }`}
                >
                    {cat.image && (
                        <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-5 h-5 rounded-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
