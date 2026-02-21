import { motion } from 'framer-motion';

export default function CategoryCircles({ categories, activeId, onSelect }) {
    return (
        <div className="py-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-brand-dark uppercase tracking-tighter">Shop by Category</h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 justify-items-center">
                {categories.map((category) => (
                    <button
                        key={category._id}
                        onClick={() => onSelect(category._id)}
                        className="flex flex-col items-center gap-3 group transition-transform hover:scale-105"
                    >
                        <div
                            className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 transition-all ${activeId === category._id
                                    ? 'border-brand-red bg-brand-red/5 shadow-xl'
                                    : 'border-transparent bg-white shadow-md group-hover:shadow-lg'
                                }`}
                        >
                            <img
                                src={category.image || 'https://placehold.co/100x100?text=' + category.name[0]}
                                alt={category.name}
                                className="w-full h-full object-cover p-2"
                            />
                        </div>
                        <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest text-center ${activeId === category._id ? 'text-brand-red' : 'text-brand-dark'
                            }`}>
                            {category.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
