import { ArrowRight } from 'lucide-react';

export default function StickyCart({ count, total, onClick }) {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-40 animate-slide-up md:hidden">
            <button
                onClick={onClick}
                className="w-full bg-brand-red text-white rounded-xl shadow-float p-4 flex items-center justify-between hover:bg-red-700 transition-colors cursor-pointer"
            >
                <div className="flex flex-col items-start">
                    <span className="text-xs font-medium opacity-90 uppercase tracking-wide">
                        {count} {count === 1 ? 'ITEM' : 'ITEMS'}
                    </span>
                    <span className="font-bold text-lg leading-none">₹{total}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-sm">
                    View Cart <ArrowRight size={18} />
                </div>
            </button>
        </div>
    );
}
