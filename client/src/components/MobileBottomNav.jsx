import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Layers, Search, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '../store/useCartStore';

const tabs = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'categories', icon: Layers, label: 'Categories', path: '/categories' },
    { id: 'search', icon: Search, label: 'Search', path: '/search' },
    { id: 'reorder', icon: RotateCcw, label: 'Reorder', path: '/checkout' },
];

export default function MobileBottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { getTotalCount } = useCartStore();
    const count = getTotalCount();

    const activeTab = tabs.find(t => t.path === location.pathname)?.id
        || (location.pathname.startsWith('/product') ? 'home' : 'home');

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white border-t border-gray-100 safe-area-bottom">
            <div className="flex items-center justify-center gap-0 h-16">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full max-w-[25%]"
                        >
                            <div className="relative">
                                <Icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                    className={`transition-colors ${isActive ? 'text-[#D11243]' : 'text-slate-400'}`}
                                />
                                {tab.id === 'reorder' && count > 0 && (
                                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#D11243] text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                        {count > 9 ? '9+' : count}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-[#D11243]' : 'text-slate-400'}`}>
                                {tab.label}
                            </span>
                            {isActive && (
                                <motion.div layoutId="bottomNavIndicator" className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#D11243] rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
