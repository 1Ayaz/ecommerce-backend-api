import { useState } from 'react';
import { X, AlertCircle, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, Zap, Drumstick } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';

export default function LoginSheet({ isOpen, onClose }) {
    const { loginWithGoogle, loginWithEmail, signUpWithEmail, loading, error, clearError } = useAuthStore();
    const [view, setView] = useState('main');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

    const handleGoogleLogin = async () => {
        try { clearError(); await loginWithGoogle(); resetAndClose(); }
        catch { /* error shown via store */ }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) return;
        try { clearError(); await loginWithEmail(email, password); resetAndClose(); }
        catch { /* error shown via store */ }
    };

    const handleEmailSignUp = async (e) => {
        e.preventDefault();
        if (!email || !password) return;
        try { clearError(); await signUpWithEmail(email, password); resetAndClose(); }
        catch { /* error shown via store */ }
    };

    const resetAndClose = () => {
        setView('main'); setEmail(''); setPassword(''); setShowPassword(false); clearError(); onClose();
    };

    const handleClose = () => {
        setView('main'); setEmail(''); setPassword(''); setShowPassword(false); clearError(); onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[99999] backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Container — bottom sheet on mobile, centered on desktop */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="fixed inset-x-0 bottom-0 z-[100000] md:inset-0 md:flex md:items-center md:justify-center md:p-6"
                    >
                        <div
                            className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full md:max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle bar (mobile only) */}
                            <div className="md:hidden flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 bg-gray-200 rounded-full" />
                            </div>

                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all z-10"
                            >
                                <X size={16} />
                            </button>

                            <div className="px-6 pb-8 pt-3 md:pt-6">
                                {/* Branding */}
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-[#D11243] to-[#a00d33] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-200/50 transform rotate-3">
                                        <span className="text-white font-black text-3xl">M</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                        {view === 'email-signup' ? 'Create Account' : view === 'email-login' ? 'Welcome Back' : 'Welcome'}
                                    </h2>
                                    <p className="text-sm text-slate-400 font-medium mt-1">
                                        {view === 'email-signup'
                                            ? 'Join us for fresh deliveries'
                                            : view === 'email-login'
                                                ? 'Sign in to continue'
                                                : 'Fresh chicken, delivered in 20 mins'}
                                    </p>
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm p-3.5 rounded-2xl mb-4"
                                        >
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span className="flex-1 text-xs font-medium">{error}</span>
                                            <button onClick={clearError} className="text-red-300 hover:text-red-500"><X size={14} /></button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* ===== MAIN VIEW ===== */}
                                {view === 'main' && (
                                    <div className="space-y-3">
                                        {/* Google Sign-In */}
                                        <button
                                            onClick={handleGoogleLogin}
                                            disabled={loading}
                                            className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 hover:shadow-md active:scale-[0.98]"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-[#D11243] border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                    <span className="text-sm">Continue with Google</span>
                                                </>
                                            )}
                                        </button>

                                        {/* Divider */}
                                        <div className="flex items-center gap-3 py-1">
                                            <div className="flex-1 h-px bg-gray-100" />
                                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">or</span>
                                            <div className="flex-1 h-px bg-gray-100" />
                                        </div>

                                        {/* Email Sign-In */}
                                        <button
                                            onClick={() => { clearError(); setView('email-login'); }}
                                            className="w-full bg-[#D11243] hover:bg-[#b00f38] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-red-200/40"
                                        >
                                            <Mail size={18} />
                                            <span className="text-sm">Continue with Email</span>
                                        </button>

                                        {/* Sign up link */}
                                        <p className="text-center text-sm text-slate-400 pt-1">
                                            New here?{' '}
                                            <button onClick={() => { clearError(); setView('email-signup'); }}
                                                className="text-[#D11243] font-bold hover:underline">
                                                Create Account
                                            </button>
                                        </p>

                                        {/* Trust badges */}
                                        <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-50 mt-2">
                                            {[
                                                { icon: <ShieldCheck size={14} />, text: 'Secure' },
                                                { icon: <Zap size={14} />, text: '20 Min' },
                                                { icon: <Drumstick size={14} />, text: 'Farm Fresh' },
                                            ].map((badge) => (
                                                <div key={badge.text} className="flex items-center gap-1.5 text-slate-400">
                                                    <span className="text-[#D11243]">{badge.icon}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">{badge.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ===== EMAIL LOGIN VIEW ===== */}
                                {view === 'email-login' && (
                                    <form onSubmit={handleEmailLogin} className="space-y-3">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Email address" autoFocus required
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-11 pr-4 py-4 text-sm font-medium text-gray-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#D11243]/10 focus:border-[#D11243]/30 focus:bg-white outline-none transition-all" />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Password" required
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-11 pr-11 py-4 text-sm font-medium text-gray-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#D11243]/10 focus:border-[#D11243]/30 focus:bg-white outline-none transition-all" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>

                                        <button type="submit" disabled={loading || !email || !password}
                                            className="w-full bg-[#D11243] hover:bg-[#b00f38] text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-red-200/40 flex items-center justify-center gap-2 mt-1">
                                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
                                        </button>

                                        <p className="text-center text-sm text-slate-400 pt-1">
                                            New here?{' '}
                                            <button type="button" onClick={() => { clearError(); setView('email-signup'); }}
                                                className="text-[#D11243] font-bold hover:underline">Create Account</button>
                                        </p>

                                        <button type="button" onClick={() => { clearError(); setView('main'); }}
                                            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-slate-500 font-medium pt-1">
                                            <ArrowLeft size={12} /> All sign-in options
                                        </button>
                                    </form>
                                )}

                                {/* ===== EMAIL SIGNUP VIEW ===== */}
                                {view === 'email-signup' && (
                                    <form onSubmit={handleEmailSignUp} className="space-y-3">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Email address" autoFocus required
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-11 pr-4 py-4 text-sm font-medium text-gray-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#D11243]/10 focus:border-[#D11243]/30 focus:bg-white outline-none transition-all" />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Password (min 6 chars)" minLength={6} required
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-11 pr-11 py-4 text-sm font-medium text-gray-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#D11243]/10 focus:border-[#D11243]/30 focus:bg-white outline-none transition-all" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>

                                        <button type="submit" disabled={loading || !email || !password}
                                            className="w-full bg-[#D11243] hover:bg-[#b00f38] text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-red-200/40 flex items-center justify-center gap-2 mt-1">
                                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
                                        </button>

                                        <p className="text-center text-sm text-slate-400 pt-1">
                                            Already have an account?{' '}
                                            <button type="button" onClick={() => { clearError(); setView('email-login'); }}
                                                className="text-[#D11243] font-bold hover:underline">Sign In</button>
                                        </p>

                                        <button type="button" onClick={() => { clearError(); setView('main'); }}
                                            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-slate-500 font-medium pt-1">
                                            <ArrowLeft size={12} /> All sign-in options
                                        </button>
                                    </form>
                                )}

                                <p className="text-[10px] text-slate-300 text-center mt-5">
                                    By continuing, you agree to our Terms of Service & Privacy Policy
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
