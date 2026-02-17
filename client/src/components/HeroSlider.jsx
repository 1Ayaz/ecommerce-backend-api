import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
    {
        title: "Order <span class='text-brand-red'>Fresh</span> Halal Chicken",
        subtitle: "Rajahmundry's Most Hygienic Delivery Service",
        description: "Hand-picked from trusted farms, cut fresh for your order, and delivered in 20 mins.",
        bg: "bg-brand-dark",
        gradient: "from-brand-dark via-brand-dark/80 to-transparent",
        image: "https://images.unsplash.com/photo-1587593817658-403440e53f14?q=80&w=2070&auto=format&fit=crop", // High quality chicken dish
        cta: "Order Now"
    },
    {
        title: "Wholesale Prices for <span class='text-brand-red'>Bulk Orders</span>",
        subtitle: "Planning an Event or Gathering?",
        description: "Get massive discounts on high-volume orders for weddings and parties.",
        bg: "bg-red-900",
        gradient: "from-red-900 via-red-900/80 to-transparent",
        image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=2070&auto=format&fit=crop", // Catering/Party food
        cta: "Enquire Now"
    }
];

export default function HeroSlider() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const next = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="relative h-[250px] md:h-[400px] w-full overflow-hidden rounded-2xl mb-8 group">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 flex items-center"
                >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0">
                        <img
                            src={slides[current].image}
                            alt={slides[current].subtitle}
                            className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-r ${slides[current].gradient}`}></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 px-8 md:px-16 max-w-2xl text-white">
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-brand-red font-bold text-xs uppercase tracking-widest mb-2"
                        >
                            {slides[current].subtitle}
                        </motion.p>
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl md:text-5xl font-black mb-4 leading-tight"
                            dangerouslySetInnerHTML={{ __html: slides[current].title }}
                        />
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-sm md:text-lg opacity-80 mb-6 hidden md:block"
                        >
                            {slides[current].description}
                        </motion.p>
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-brand-red text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg hover:bg-red-700 transition-all active:scale-95"
                        >
                            {slides[current].cta}
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
            >
                <ChevronRight size={24} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`w-2 h-2 rounded-full transition-all ${current === i ? 'bg-brand-red w-6' : 'bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    );
}
