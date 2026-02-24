const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * GET /sitemap.xml
 * Auto-generates an XML sitemap with all active, approved products.
 */
router.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;

        const products = await Product.find({ isActive: true, approved: true })
            .select('slug updatedAt')
            .lean();

        const urls = [
            // Homepage
            `  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
            // Product pages
            ...products.map(p => `  <url>
    <loc>${baseUrl}/product/${p.slug || p._id}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
        ];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        console.error('Sitemap error:', err);
        res.status(500).send('Error generating sitemap');
    }
});

module.exports = router;
