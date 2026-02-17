import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, LogOut, MapPin } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import LoginSheet from './LoginSheet';

export default function Header() {
    const { user, logout } = useAuthStore();
    const totalCount = useCartStore((s) => s.getTotalCount());
    const [showLogin, setShowLogin] = useState(false);

    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-brand-border">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-brand-red rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-brand-dark text-base leading-none">Mubarak</h1>
                        <p className="text-[10px] text-brand-muted font-medium tracking-wider uppercase">Fresh Chicken</p>
                    </div>
                </Link>

                {/* Delivery Info (Desktop) */}
                <div className="hidden md:flex items-center gap-1 text-sm text-brand-muted">
                    <MapPin size={14} className="text-brand-red" />
                    <span className="text-brand-dark font-medium">Delivery in 20 mins</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {/* Cart (Desktop) */}
                    <Link
                        to="/checkout"
                        className="hidden md:flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                        <ShoppingBag size={16} />
                        {totalCount > 0 && <span>{totalCount} items</span>}
                        {totalCount === 0 && <span>Cart</span>}
                    </Link>

                    {/* User */}
                    {user ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.name}
                                        className="w-8 h-8 rounded-full border-2 border-brand-red/20"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-brand-red/10 rounded-full flex items-center justify-center">
                                        <User size={16} className="text-brand-red" />
                                    </div>
                                )}
                                <span className="hidden md:block text-sm font-medium text-brand-dark">
                                    {user.name?.split(' ')[0]}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-brand-muted hover:text-brand-red transition-colors"
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowLogin(true)}
                            className="text-sm font-semibold text-brand-red hover:text-red-700 transition-colors"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>

            {/* Login Sheet */}
            <LoginSheet isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </header>
    );
}
