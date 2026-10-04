import { useState } from 'react';
import { Star, X, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config/api';
import { toast } from 'react-toastify';

/**
 * RatingModal — bottom sheet for rating a delivered order.
 *
 * Props:
 *   isOpen    {boolean}
 *   onClose   {fn}
 *   order     {object}  — the delivered order to rate
 *   onRated   {fn}      — called after successful submit to refresh orders list
 */
export default function RatingModal({ isOpen, onClose, order, onRated }) {
    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleClose = () => {
        setRating(0);
        setHoveredStar(0);
        setComment('');
        setSubmitted(false);
        onClose();
    };

    const handleSubmit = async () => {
        if (!rating) {
            toast.error('Please select a star rating');
            return;
        }
        if (!order?._id || !order?.items?.[0]?.productId) {
            toast.error('Order data missing — try again');
            return;
        }
        setLoading(true);
        try {
            await API.post('/ratings', {
                orderId: order._id,
                productId: order.items[0].productId,
                rating,
                comment: comment.trim(),
            });
            setSubmitted(true);
            toast.success('Thanks for your review! 🌟');
            onRated?.();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    const activeRating = hoveredStar || rating;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-[200] bg-black/40"
                    />
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[201] bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto safe-area-bottom"
                    >
                        <div className="p-6">
                            {/* Drag handle */}
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

                            {submitted ? (
                                /* ── Success State ── */
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center gap-4 py-8"
                                >
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                        <CheckCircle size={32} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-secondary">Review Submitted!</h3>
                                    <p className="text-sm text-slate-400 text-center">Your feedback helps us serve better. Thank you!</p>
                                    <button
                                        onClick={handleClose}
                                        className="w-full bg-[#15161D] text-white font-bold py-4 rounded-2xl mt-2"
                                    >
                                        Close
                                    </button>
                                </motion.div>
                            ) : (
                                /* ── Rating Form ── */
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-black text-secondary">Rate Your Order</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                #{order?._id?.slice(-6)} · {order?.items?.length} item{order?.items?.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <button onClick={handleClose} className="text-slate-300 hover:text-secondary">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Stars */}
                                    <div className="flex flex-col items-center gap-4 mb-6">
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <motion.button
                                                    key={star}
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoveredStar(star)}
                                                    onMouseLeave={() => setHoveredStar(0)}
                                                    className="w-12 h-12 flex items-center justify-center"
                                                >
                                                    <Star
                                                        size={36}
                                                        className={`transition-all duration-150 ${star <= activeRating
                                                            ? 'text-yellow-400 fill-yellow-400 scale-110'
                                                            : 'text-gray-200 fill-gray-200'
                                                            }`}
                                                    />
                                                </motion.button>
                                            ))}
                                        </div>
                                        {activeRating > 0 && (
                                            <motion.p
                                                key={activeRating}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-sm font-black text-secondary"
                                            >
                                                {starLabels[activeRating]}
                                            </motion.p>
                                        )}
                                    </div>

                                    {/* Comment */}
                                    <div className="mb-6">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                                            Tell us more (optional)
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={e => setComment(e.target.value.slice(0, 300))}
                                            placeholder="Was the meat fresh? Was delivery on time?..."
                                            rows={3}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium text-secondary resize-none outline-none focus:ring-1 focus:ring-[#D11243]/20 border border-gray-100"
                                        />
                                        <p className="text-right text-[10px] text-slate-300 mt-1">{comment.length}/300</p>
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !rating}
                                        className="w-full bg-[#D11243] text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200/40 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <>Submit Review <Star size={16} className="fill-white" /></>}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
