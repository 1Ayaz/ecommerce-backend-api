import { useState, useRef } from 'react';
import { X, AlertCircle, Phone, ArrowLeft, ShieldCheck, Zap, Drumstick, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';

// ─── OLD FLOWS (Google + Email) — kept but commented out for easy re-enable ──
// import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
// const handleGoogleLogin = async () => { ... };
// const handleEmailLogin = async (e) => { ... };
// const handleEmailSignUp = async (e) => { ... };
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginSheet({ isOpen, onClose }) {
    const { sendOTP, verifyOTP, loading, error, clearError } = useAuthStore();

    const [view, setView] = useState('phone'); // 'phone' | 'otp' | 'name'
    const [phone, setPhone] = useState('');
    const [normalizedPhone, setNormalizedPhone] = useState('');
    const [name, setName] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);

    if (!isOpen) return null;

    // Format phone for display
    const formatPhoneDisplay = (p) => {
        const digits = p.replace(/\D/g, '');
        if (digits.length <= 5) return digits;
        return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    };

    const resetAndClose = () => {
        setView('phone'); setPhone(''); setOtp(['', '', '', '', '', '']);
        setName(''); setIsNewUser(false); clearError(); onClose();
    };

    // ── Step 1: Send OTP ──────────────────────────────────────────────────────
    const handleSendOTP = async (e) => {
        e.preventDefault();
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10) return;
        try {
            clearError();
            // Prepend 91 (India) if only 10 digits provided
            const fullPhone = digits.length === 10 ? `91${digits}` : digits;
            const result = await sendOTP(fullPhone);
            setNormalizedPhone(result.phone);
            setView('otp');
        } catch { /* error shown from store */ }
    };

    // ── Step 2: Handle OTP digit input ────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // only 1 digit per box
        setOtp(newOtp);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    // ── Step 3: Verify OTP ────────────────────────────────────────────────────
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) return;
        try {
            clearError();
            const result = await verifyOTP(normalizedPhone, code, name || undefined);
            // If new user (no name set yet), ask for name first
            if (!result.user.name || result.user.name.startsWith('User')) {
                setIsNewUser(true);
                setView('name');
            } else {
                resetAndClose();
            }
        } catch { /* error shown from store */ }
    };

    // ── Step 4 (optional): Save name for new users ────────────────────────────
    const handleSaveName = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        // Re-verify with name (re-logging in is fine, token is already saved)
        // Just close — name update can be done via profile API separately
        resetAndClose();
    };

    const otpComplete = otp.join('').length === 6;

    // Dynamic header text per view
    const headerTitle = view === 'otp' ? 'Enter OTP' : view === 'name' ? 'One last thing!' : 'Login / Sign up';
    const headerSub = view === 'otp'
        ? `Sent to +${normalizedPhone}`
        : view === 'name'
            ? 'Tell us your name'
            : 'Fresh chicken, delivered in 20 mins';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[99999] backdrop-blur-sm"
                        onClick={resetAndClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="fixed inset-x-0 bottom-0 z-[100000] md:inset-0 md:flex md:items-center md:justify-center md:p-6"
                    >
                        <div
                            className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full md:max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle bar (mobile) */}
                            <div className="md:hidden flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 bg-gray-200 rounded-full" />
                            </div>

                            {/* Close */}
                            <button onClick={resetAndClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all z-10">
                                <X size={16} />
                            </button>

                            <div className="px-6 pb-8 pt-3 md:pt-6">
                                {/* Branding */}
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-[#D11243] to-[#a00d33] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-200/50 transform rotate-3">
                                        <span className="text-white font-black text-lg">TFC</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{headerTitle}</h2>
                                    <p className="text-sm text-slate-400 font-medium mt-1">{headerSub}</p>
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                            className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm p-3.5 rounded-2xl mb-4"
                                        >
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span className="flex-1 text-xs font-medium">{error}</span>
                                            <button onClick={clearError} className="text-red-300 hover:text-red-500"><X size={14} /></button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* ══ VIEW: Phone Input ══ */}
                                {view === 'phone' && (
                                    <form onSubmit={handleSendOTP} className="space-y-4">
                                        <div className="relative">
                                            {/* India flag + prefix */}
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-600 font-semibold text-sm select-none pointer-events-none">
                                                <span>🇮🇳</span>
                                                <span className="text-gray-400">+91</span>
                                                <span className="text-gray-200">|</span>
                                            </div>
                                            <input
                                                type="tel" inputMode="numeric" maxLength={10}
                                                value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                placeholder="Enter mobile number"
                                                autoFocus required
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-28 pr-4 py-4 text-sm font-semibold text-gray-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#D11243]/10 focus:border-[#D11243]/30 focus:bg-white outline-none transition-all tracking-widest"
                                            />
                                        </div>

                                        <button type="submit" disabled={loading || phone.replace(/\D/g, '').length < 10}
                                            className="w-full bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-green-200/40 flex items-center justify-center gap-2">
                                            {loading
                                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <><MessageCircle size={18} /> Send OTP via WhatsApp</>
                                            }
                                        </button>

                                        <p className="text-center text-xs text-slate-400 leading-relaxed">
                                            We'll send a 6-digit verification code to your WhatsApp. No password needed.
                                        </p>

                                        {/* Trust badges */}
                                        <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-50">
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

                                        {/* ── OLD FLOWS commented out — uncomment to re-enable ──
                                        <div className="flex items-center gap-3 py-1">
                                            <div className="flex-1 h-px bg-gray-100" />
                                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">or</span>
                                            <div className="flex-1 h-px bg-gray-100" />
                                        </div>
                                        <button onClick={handleGoogleLogin} className="w-full bg-white border-2 border-gray-200 ...">Continue with Google</button>
                                        <button onClick={() => setView('email-login')} className="w-full bg-[#D11243] ...">Continue with Email</button>
                                        ── END OLD FLOWS ── */}
                                    </form>
                                )}

                                {/* ══ VIEW: OTP Input ══ */}
                                {view === 'otp' && (
                                    <form onSubmit={handleVerifyOTP} className="space-y-5">
                                        <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                            {otp.map((digit, i) => (
                                                <input
                                                    key={i}
                                                    ref={(el) => (otpRefs.current[i] = el)}
                                                    type="text" inputMode="numeric" maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                    autoFocus={i === 0}
                                                    className="w-12 h-14 text-center text-xl font-black border-2 rounded-2xl transition-all outline-none bg-gray-50
                                                        border-gray-200 focus:border-[#D11243] focus:ring-2 focus:ring-[#D11243]/10 focus:bg-white
                                                        text-gray-900"
                                                />
                                            ))}
                                        </div>

                                        <button type="submit" disabled={loading || !otpComplete}
                                            className="w-full bg-[#D11243] hover:bg-[#b00f38] text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-red-200/40 flex items-center justify-center gap-2">
                                            {loading
                                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : 'Verify & Login'}
                                        </button>

                                        <div className="flex items-center justify-between text-sm">
                                            <button type="button" onClick={() => { clearError(); setView('phone'); }}
                                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium">
                                                <ArrowLeft size={12} /> Change number
                                            </button>
                                            <button type="button" onClick={handleSendOTP} disabled={loading}
                                                className="text-xs text-[#D11243] font-bold hover:underline disabled:opacity-50">
                                                Resend OTP
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* ══ VIEW: Name input for new users ══ */}
                                {view === 'name' && (
                                    <form onSubmit={handleSaveName} className="space-y-4">
                                        <p className="text-sm text-slate-500 text-center">What should we call you?</p>
                                        <input
                                            type="text" value={name} onChange={(e) => setName(e.target.value)}
                                            placeholder="Your full name" autoFocus
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-sm font-semibold text-gray-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#D11243]/10 focus:border-[#D11243]/30 focus:bg-white outline-none transition-all"
                                        />
                                        <button type="submit" disabled={!name.trim()}
                                            className="w-full bg-[#D11243] hover:bg-[#b00f38] text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-red-200/40">
                                            Let's go! 🚀
                                        </button>
                                        <button type="button" onClick={resetAndClose}
                                            className="w-full text-xs text-slate-400 hover:text-slate-600 font-medium py-1">
                                            Skip for now
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
