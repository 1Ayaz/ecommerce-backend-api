import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { User, ChevronDown, MapPin, Search, Clock } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import LoginSheet from './LoginSheet';
import SearchOverlay from './SearchOverlay';

export default function Header({ onOpenLocationPicker }) {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { getTotalCount } = useCartStore();
    const [showLogin, setShowLogin] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [locationAddress, setLocationAddress] = useState('Select Location');

    useEffect(() => {
        const saved = localStorage.getItem('userLocation');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                const street = data.formattedAddress.split(',')[0];
                setLocationAddress(street);
            } catch (e) {
                console.error('Failed to parse location');
            }
        }
    }, [onOpenLocationPicker]);

    const handleProfileClick = () => {
        if (user) {
            navigate('/account');
        } else {
            setShowLogin(true);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-[90] bg-white/80 backdrop-blur-xl border-b border-gray-100">
                {/* ═══ MOBILE HEADER ═══ */}
                <div className="md:hidden flex items-center justify-between px-4 h-14">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-[#D11243] rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-lg">M</span>
                        </div>
                    </Link>

                    {/* Location & ETA */}
                    <button
                        onClick={onOpenLocationPicker}
                        className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 max-w-[50%]"
                    >
                        <MapPin size={14} className="text-[#D11243] flex-shrink-0" />
                        <div className="text-left min-w-0">
                            <p className="text-[10px] text-slate-400 font-bold leading-none truncate">{locationAddress}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Clock size={9} className="text-emerald-500" />
                                <span className="text-[9px] font-bold text-emerald-600">18 mins</span>
                            </div>
                        </div>
                        <ChevronDown size={12} className="text-slate-300 flex-shrink-0" />
                    </button>

                    {/* Profile Icon (top-right) */}
                    <button
                        onClick={handleProfileClick}
                        className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-secondary hover:bg-gray-100 transition-all border border-gray-100"
                    >
                        <User size={18} strokeWidth={2} className={user ? "text-[#D11243]" : "text-slate-400"} />
                    </button>
                </div>

                {/* ═══ DESKTOP HEADER ═══ */}
                <div className="hidden md:flex max-w-7xl mx-auto px-6 h-20 items-center justify-between gap-8">
                    {/* Brand & Location */}
                    <div className="flex items-center gap-10">
                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="w-11 h-11 bg-[#D11243] rounded-2xl flex items-center justify-center shadow-lg transform rotate-2">
                                <span className="text-white font-bold text-2xl">M</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-secondary font-bold text-lg leading-none tracking-tight">MUBARAK</h1>
                                <span className="text-[10px] text-[#D11243] font-bold uppercase tracking-widest mt-0.5">Fresh Chicken</span>
                            </div>
                        </Link>

                        <button
                            onClick={onOpenLocationPicker}
                            className="hidden lg:flex flex-col items-start cursor-pointer hover:opacity-70 transition-opacity"
                        >
                            <div className="flex items-center gap-1 text-[#D11243]">
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] leading-none">Delivering to</span>
                                <ChevronDown size={12} strokeWidth={3} />
                            </div>
                            <span className="text-sm font-bold text-secondary truncate max-w-[180px] leading-tight">
                                {locationAddress}
                            </span>
                        </button>
                    </div>

                    {/* Desktop Search */}
                    <div className="flex-1 max-w-xl group">
                        <div className="relative">
                            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#D11243] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search fresh cuts, marinates..."
                                className="w-full bg-gray-50/50 border-none rounded-2xl py-3.5 pl-14 pr-6 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all cursor-pointer"
                                onClick={() => setShowSearch(true)}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Desktop Right Actions */}
                    <div className="flex items-center gap-3">
                        {!user ? (
                            <button
                                onClick={() => setShowLogin(true)}
                                className="text-secondary font-bold text-sm px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Sign In
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/account')}
                                className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-secondary hover:bg-gray-100 transition-all border border-gray-100"
                                title="My Account"
                            >
                                <User size={20} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {createPortal(
                <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />,
                document.body
            )}
            {createPortal(
                <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />,
                document.body
            )}
        </>
    );
}
