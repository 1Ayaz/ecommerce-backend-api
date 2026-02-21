import { Star, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReviewCard({ review }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-full"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-bg rounded-full overflow-hidden border border-gray-100">
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.author_name}`}
                        alt={review.author_name}
                    />
                </div>
                <div>
                    <h4 className="text-xs font-black text-brand-dark uppercase tracking-tight">{review.author_name}</h4>
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={10}
                                className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                            />
                        ))}
                    </div>
                </div>
                <div className="ml-auto">
                    <ShieldCheck size={18} className="text-brand-green" />
                </div>
            </div>

            <p className="text-xs font-medium text-brand-muted leading-relaxed line-clamp-4 flex-1 italic">
                "{review.text}"
            </p>

            <div className="mt-4 pt-4 border-t border-gray-50">
                <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">
                    {review.relative_time_description}
                </span>
            </div>
        </motion.div>
    );
}
