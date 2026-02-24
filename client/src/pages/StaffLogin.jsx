import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ChevronRight, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ROLES = [
    { id: 'admin', label: 'Admin', icon: '🛡️', desc: 'Full system access' },
    { id: 'vendor', label: 'Vendor', icon: '🏪', desc: 'Store management' },
    { id: 'driver', label: 'Delivery', icon: '🛵', desc: 'Order delivery' },
];

export default function StaffLogin() {
    const navigate = useNavigate();
    const { adminLogin, loading, error, clearError } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        try {
            await adminLogin(email, password);
            // redirect is handled inside adminLogin based on role
        } catch (err) {
            // error is set in store
        }
    };

    const placeholders = {
        admin: 'Enter admin email',
        vendor: 'Enter vendor email',
        driver: 'Enter driver email',
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
            {/* Back to store */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 text-white/40 hover:text-white/70 text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
                ← Back to store
            </button>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-[#D11243] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-900/40 transform rotate-3">
                        <span className="text-white font-bold text-3xl">M</span>
                    </div>
                    <h1 className="text-white font-bold text-2xl tracking-tight">Staff Portal</h1>
                    <p className="text-white/40 text-sm mt-1">Mubarak Fresh Chicken — Internal Access</p>
                </div>

                {/* Role Selector */}
                <div className="grid grid-cols-3 gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl">
                    {ROLES.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => { setSelectedRole(role.id); clearError(); }}
                            className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all ${selectedRole === role.id
                                ? 'bg-[#D11243] text-white shadow-lg shadow-red-900/30'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                }`}
                        >
                            <span className="text-xl mb-1">{role.icon}</span>
                            <span className="text-xs font-bold">{role.label}</span>
                            <span className={`text-[9px] mt-0.5 ${selectedRole === role.id ? 'text-white/70' : 'text-white/30'}`}>
                                {role.desc}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Login Form */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3.5 rounded-xl mb-5">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={placeholders[selectedRole]}
                                    required
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#D11243]/50 focus:bg-white/8 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl py-3.5 pl-11 pr-11 text-sm focus:outline-none focus:border-[#D11243]/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#D11243] hover:bg-[#b00f38] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-red-900/30 active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In as {ROLES.find(r => r.id === selectedRole)?.label}</span>
                                    <ChevronRight size={18} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>


            </div>
        </div>
    );
}
