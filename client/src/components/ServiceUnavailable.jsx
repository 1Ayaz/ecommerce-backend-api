import { motion } from 'framer-motion';
import { MapPinOff, Home } from 'lucide-react';

export default function ServiceUnavailable({ onTryAgain }) {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
            >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPinOff className="w-12 h-12 text-gray-400" />
                </div>

                <h2 className="text-2xl font-bold text-brand-dark mb-3">
                    Service Not Available
                </h2>

                <p className="text-brand-muted mb-6">
                    We're not serving your area yet, but we're expanding fast! Check back soon or try a different location.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={onTryAgain}
                        className="w-full py-3 bg-brand-red text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        Try Different Location
                    </button>

                    <p className="text-xs text-brand-muted">
                        Currently serving: Rajahmundry, Kakinada, Visakhapatnam
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
