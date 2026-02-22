import { useState, useEffect } from 'react';
import API from '../config/api';

const defaultBanner = {
    title: "Order <span class='text-[#D11243]'>Fresh</span> Halal Chicken",
    subtitle: "Rajahmundry's Most Hygienic Delivery Service",
    image: "https://images.unsplash.com/photo-1587593817658-403440e53f14?q=80&w=2070&auto=format&fit=crop"
};

export default function HeroSlider() {
    const [banner, setBanner] = useState(defaultBanner);

    // Fetch the primary admin-managed banner
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await API.get('/settings/public');
                const apiBanners = res.data?.data?.banners;
                if (apiBanners && apiBanners.length > 0) {
                    const b = apiBanners[0]; // Use the first banner statically
                    setBanner({
                        title: b.title || '',
                        subtitle: '',
                        image: b.imageUrl,
                    });
                }
            } catch {
                // Fallback to default
            }
        };
        fetchBanners();
    }, []);

    return (
        <div className="relative h-[200px] md:h-[350px] w-full overflow-hidden rounded-2xl md:rounded-3xl mb-8 shadow-sm">
            {/* Background Image with Simple Dark Overlay */}
            <div className="absolute inset-0 bg-black">
                <img
                    src={banner.image}
                    alt="Promotional Banner"
                    className="w-full h-full object-cover opacity-60"
                />
            </div>

            {/* Static Content */}
            {banner.title && (
                <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 text-white max-w-2xl">
                    {banner.subtitle && (
                        <p className="text-[#D11243] font-bold text-[10px] md:text-sm uppercase tracking-widest mb-2 shadow-black drop-shadow-lg">
                            {banner.subtitle}
                        </p>
                    )}
                    <h2
                        className="text-2xl md:text-5xl font-black leading-snug md:leading-tight shadow-black drop-shadow-lg"
                        dangerouslySetInnerHTML={{ __html: banner.title }}
                    />
                </div>
            )}
        </div>
    );
}
