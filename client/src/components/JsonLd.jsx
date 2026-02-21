/**
 * Reusable JSON-LD structured data component for SEO.
 * Injects <script type="application/ld+json"> into the page head.
 */
export function ProductJsonLd({ product, siteUrl = '' }) {
    if (!product) return null;

    const lowestPrice = product.variants?.length
        ? Math.min(...product.variants.map(v => v.price))
        : product.variations?.length
            ? Math.min(...product.variations.map(v => v.basePrice))
            : 0;

    const highestPrice = product.variants?.length
        ? Math.max(...product.variants.map(v => v.price))
        : product.variations?.length
            ? Math.max(...product.variations.map(v => v.basePrice))
            : lowestPrice;

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.metaTitle || product.name,
        description: product.metaDescription || product.description || `Fresh ${product.name} from Mubarak`,
        image: product.image,
        brand: {
            '@type': 'Brand',
            name: 'Mubarak Fresh Chicken',
        },
        offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: lowestPrice,
            highPrice: highestPrice,
            availability: product.isActive !== false
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: 'Mubarak Fresh Chicken',
            },
        },
        url: siteUrl ? `${siteUrl}/product/${product.slug || product._id}` : undefined,
        sku: product._id,
        category: 'Fresh Chicken',
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export function LocalBusinessJsonLd({ siteUrl = '' }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': siteUrl || undefined,
        name: 'Mubarak Fresh Chicken',
        description: 'Fresh chicken delivery in 20 minutes. Cleaned, cut after order, halaal certified.',
        url: siteUrl || undefined,
        telephone: '+91-XXXXXXXXXX',
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Rajahmundry',
            addressRegion: 'Andhra Pradesh',
            addressCountry: 'IN',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: '17.0005',
            longitude: '81.8040',
        },
        priceRange: '₹₹',
        servesCuisine: 'Fresh Chicken',
        openingHours: 'Mo-Su 07:00-22:00',
        image: siteUrl ? `${siteUrl}/logo.png` : undefined,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export function BreadcrumbJsonLd({ items, siteUrl = '' }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url ? (siteUrl + item.url) : undefined,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
