import { MessageCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Floating WhatsApp + Call button for early-launch fallback ordering.
 * Appears on all customer-facing pages.
 * phone: full international number without +, e.g. "919876543210"
 */
export default function WhatsAppOrderButton() {
    const phone = import.meta.env.VITE_SUPPORT_PHONE || '919000000000';
    const message = encodeURIComponent("Hello! I'd like to place an order from The Fresh Cuts.");
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

    return (
        <div className="fixed bottom-20 right-4 z-[200] flex flex-col items-end gap-2 md:bottom-6">
            {/* Call Button */}
            <motion.a
                href={`tel:+${phone}`}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
                className="flex items-center gap-2 bg-blue-600 active:bg-blue-700 text-white pl-3 pr-4 py-2.5 rounded-full shadow-xl text-xs font-bold select-none"
                aria-label="Call to order"
            >
                <Phone size={15} />
                <span>Call Order</span>
            </motion.a>

            {/* WhatsApp Button */}
            <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, type: 'spring', stiffness: 200 }}
                className="flex items-center gap-2 bg-[#25D366] active:bg-[#1ebe5d] text-white pl-3 pr-4 py-2.5 rounded-full shadow-xl text-xs font-bold select-none"
                aria-label="Order via WhatsApp"
            >
                <MessageCircle size={15} />
                <span>WhatsApp Order</span>
            </motion.a>
        </div>
    );
}
