import { ArrowRight, Clock } from 'lucide-react';

export default function StickyCart({ count, total, onClick }) {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-40 animate-slide-up md:hidden">
            <button
                onClick={onClick}
                className="w-full bg-brand-red text-white rounded-2xl shadow-float p-4 flex items-center justify-between hover:bg-red-700 active:scale-95 transition-all cursor-pointer relative overflow-hidden"
            >
                {/* Visual Glow Layer */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/10 to-red-600/0 animate-shimmer"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="flex flex-col items-start border-r border-white/20 pr-4">
                        <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest leading-none mb-1">
                            {count} {count === 1 ? 'UNIT' : 'UNITS'}
                        </span>
                        <span className="font-extrabold text-xl leading-none">₹{total}</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold opacity-70 flex items-center gap-1 leading-none uppercase">
                            Mubarak Fresh
                        </span>
                        <span className="text-[11px] font-bold flex items-center gap-1 mt-1 leading-none">
                            <Clock size={12} strokeWidth={3} className="text-white" />
                            20 MINS DELIVERY
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-sm bg-white/10 px-3 py-2 rounded-xl border border-white/10 relative z-10">
                    View Cart <ArrowRight size={18} strokeWidth={3} />
                </div>
            </button>
        </div>
    );
}
