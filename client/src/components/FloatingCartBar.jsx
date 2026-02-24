import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useCartStore from '../store/useCartStore';

export default function FloatingCartBar() {
    const { getTotalCount, getTotalPrice } = useCartStore();
    const navigate = useNavigate();
    const location = useLocation();

    const count = getTotalCount();
    const total = getTotalPrice();

    // Don't show on checkout page or if cart is empty
    if (count === 0 || location.pathname === '/checkout') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-20 md:bottom-8 left-0 right-0 mx-auto z-[100] w-[calc(100%-2rem)] max-w-md"
            >
                <button
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-[#15161D] text-white rounded-[2rem] shadow-2xl p-1 pl-6 flex items-center justify-between group overflow-hidden border border-white/10 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-start py-3">
                            <div className="flex items-center gap-2 mb-0.5">
                                <motion.span
                                    key={count}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-2 h-2 rounded-full bg-[#D11243]"
                                ></motion.span>
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] leading-none">
                                    {count} Item{count > 1 ? 's' : ''}
                                </span>
                            </div>
                            <span className="text-xl font-bold leading-none">₹{total}</span>
                        </div>

                        <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

                        <div className="hidden sm:flex flex-col items-start">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-[#D11243]">Priority Fresh</span>
                            <div className="flex items-center gap-1.5 text-white/70">
                                <Clock size={11} />
                                <span className="text-[10px] font-bold uppercase tracking-tight">18 MINS DELIVERY</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-[#D11243] group-hover:bg-[#b00f38] text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg">
                            <span className="uppercase text-sm tracking-widest font-bold">Checkout</span>
                            <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
