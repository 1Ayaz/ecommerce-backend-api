import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';

export default function OrderSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const orderId = location.state?.orderId;

    return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
            {/* Success Animation */}
            <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
                <CheckCircle size={48} className="text-brand-green" />
            </div>

            <h1 className="text-2xl font-bold text-brand-dark mb-2">Order Placed! 🎉</h1>
            <p className="text-brand-muted text-sm mb-6">
                Your fresh chicken is being prepared right now
            </p>

            {/* ETA Card */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-border p-5 mb-6 inline-block">
                <div className="flex items-center gap-3 text-brand-dark">
                    <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center">
                        <Clock size={20} className="text-brand-red" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-brand-muted uppercase tracking-wider">Estimated Delivery</p>
                        <p className="text-lg font-bold">15 – 20 minutes</p>
                    </div>
                </div>
            </div>

            {/* Order ID */}
            {orderId && (
                <p className="text-xs text-brand-muted mb-6">
                    Order ID: <span className="font-mono text-brand-dark">{orderId}</span>
                </p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-brand-red text-white font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors cursor-pointer"
                >
                    Order More <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
