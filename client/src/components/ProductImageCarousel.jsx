import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductImageCarousel({ images = [], alt = 'Product' }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    // Ensure we have at least one image
    const imageList = images.length > 0 ? images : ['https://placehold.co/300x300/F4F6FB/8D99AE?text=🐔'];

    // Auto-slide on hover
    useEffect(() => {
        if (!isHovering || imageList.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % imageList.length);
        }, 1500); // Change image every 1.5 seconds

        return () => clearInterval(interval);
    }, [isHovering, imageList.length]);

    // Reset to first image when mouse leaves
    const handleMouseLeave = () => {
        setIsHovering(false);
        setCurrentIndex(0);
    };

    return (
        <div
            className="relative w-full h-full group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={handleMouseLeave}
        >
            {/* Image Container */}
            <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-50">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentIndex}
                        src={imageList[currentIndex]}
                        alt={`${alt} - Image ${currentIndex + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/300x300/F4F6FB/8D99AE?text=🐔';
                        }}
                    />
                </AnimatePresence>
            </div>

            {/* Dot Indicators - Only show if multiple images */}
            {imageList.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    {imageList.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentIndex(index);
                            }}
                            className={`transition-all duration-300 rounded-full ${index === currentIndex
                                    ? 'w-4 h-1.5 bg-brand-red'
                                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/80'
                                }`}
                            aria-label={`Go to image ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Hover Indicator (subtle) */}
            {imageList.length > 1 && (
                <div className={`absolute top-2 right-2 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <div className="bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                        {currentIndex + 1}/{imageList.length}
                    </div>
                </div>
            )}
        </div>
    );
}
