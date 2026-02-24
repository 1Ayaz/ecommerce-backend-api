const VendorProduct = require('../models/VendorProduct');
const ApiError = require('../utils/ApiError');

class VendorProductService {
    /**
     * Override or update product price/stock for a vendor
     */
    static async updateVendorPriceStock(vendorId, productId, overrides) {
        const { variationLabel, price, inStock, stockQty } = overrides;

        // Find or create override
        let vendorProduct = await VendorProduct.findOne({
            vendorId,
            productId,
            variationLabel
        });

        if (vendorProduct) {
            if (price !== undefined) vendorProduct.price = price;
            if (inStock !== undefined) vendorProduct.inStock = inStock;
            if (stockQty !== undefined) vendorProduct.stockQty = stockQty;
            await vendorProduct.save();
        } else {
            vendorProduct = await VendorProduct.create({
                vendorId,
                productId,
                variationLabel,
                price,
                inStock,
                stockQty
            });
        }

        return vendorProduct;
    }

    /**
     * Get all overrides for a specific vendor
     */
    static async getVendorOverrides(vendorId) {
        return await VendorProduct.find({ vendorId }).populate('productId', 'name image');
    }
}

module.exports = VendorProductService;
