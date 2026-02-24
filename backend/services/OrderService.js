const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Settings = require('../models/Settings');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const VendorProduct = require('../models/VendorProduct');
const User = require('../models/User');
const MapService = require('./MapService');
const { emitToRoom } = require('../utils/socket');
const sendNotification = require('../utils/sendNotification');

// ─── Payment Method → Settings field map ────────────────────────────────────
const PAYMENT_TOGGLE_MAP = {
    COD: 'codEnabled',
    MOCK_UPI: 'mockUpiEnabled',
    UPI: 'upiEnabled',
    CARD: 'cardEnabled',
    WALLET: 'walletEnabled',
};

// ─── Delivery Fee Calculator ─────────────────────────────────────────────────
// Calculates fee from vendor's distance-based slab table
function calcDeliveryFeeFromSlabs(distanceKm, slabs, freeDeliveryAboveAmount, orderAmount, freeDeliveryRadiusKm) {
    // Check free delivery threshold first
    if (freeDeliveryAboveAmount && orderAmount >= freeDeliveryAboveAmount) {
        return 0;
    }

    // Explicitly enforce the free delivery radius setting if it's set and > 0
    if (freeDeliveryRadiusKm !== undefined && freeDeliveryRadiusKm !== null) {
        if (freeDeliveryRadiusKm > 0 && distanceKm <= freeDeliveryRadiusKm) {
            return 0; // Explicitly free within the radius
        }
    }

    // Find matching slab
    const slab = slabs.find(s => distanceKm >= s.fromKm && distanceKm < s.toKm);

    let fee = slab ? slab.fee : 0;

    // If the vendor explicitly set radius (including 0), 
    // and the slab mistakenly returns 0 when the distance is OUTSIDE the free radius, 
    // enforce a minimum fee to respect the vendor's strict radius setting.
    if (fee === 0) {
        if (freeDeliveryRadiusKm === 0 || (freeDeliveryRadiusKm > 0 && distanceKm > freeDeliveryRadiusKm)) {
            const nextSlab = slabs.find(s => s.fee > 0);
            fee = nextSlab ? nextSlab.fee : 30; // Fallback to 30 if no paid slabs exist
        }
    }

    return fee;
}

class OrderService {
    /**
     * Preview Order — calculates fees and totals without checking out or deducting stock.
     */
    static async previewOrder(orderData, customerId) {
        const { vendorId, items, deliveryAddress, paymentMethod, couponCode } = orderData;

        // ── 1. Load global settings (payment toggles + tax + platform fee) ────
        let settings = await Settings.findOne().lean();
        if (!settings) {
            settings = { paymentMethods: { codEnabled: true, mockUpiEnabled: true }, taxRate: 0, platformServiceFee: 0 };
        }

        // ── 2. Validate payment method ────────────────────────────────────────
        const payMethod = (paymentMethod || 'COD').toUpperCase();
        const toggleField = PAYMENT_TOGGLE_MAP[payMethod];
        if (!toggleField) {
            throw new ApiError(400, `Invalid payment method: ${paymentMethod}`);
        }
        if (!settings.paymentMethods?.[toggleField]) {
            throw new ApiError(400, `Payment method '${paymentMethod}' is currently disabled.`);
        }

        // ── 3. Verify vendor (Store) ──────────────────────────────────────────
        const vendor = await Store.findById(vendorId);
        if (!vendor) throw new ApiError(404, 'Vendor not found');
        if (!vendor.isActive) throw new ApiError(400, 'This store is currently inactive');
        if (!vendor.isOpen) throw new ApiError(400, 'This store is currently closed');

        // ── 4. Geo-fence validation ───────────────────────────────────────────
        if (deliveryAddress?.location?.lat && deliveryAddress?.location?.lng) {
            const lat = parseFloat(deliveryAddress.location.lat);
            const lng = parseFloat(deliveryAddress.location.lng);

            if (!isNaN(lat) && !isNaN(lng)) {
                const isServiceable = await Store.findOne({
                    _id: vendorId,
                    serviceArea: {
                        $geoIntersects: {
                            $geometry: { type: 'Point', coordinates: [lng, lat] }
                        }
                    }
                });
                if (!isServiceable) {
                    throw new ApiError(400, 'Your delivery address is outside this store\'s serviceable area');
                }
            }
        }

        // ── 5. Validate items, calculate itemsTotal ───────────────────────────
        let itemsTotal = 0;
        const validatedItems = [];

        for (const item of items) {
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new ApiError(400, `Invalid quantity for product ${item.productId}`);
            }

            const product = await Product.findById(item.productId);
            if (!product) throw new ApiError(400, `Product ${item.productId} not found`);

            const globalVariant = product.variations.find(v => v.label === item.variationLabel);
            if (!globalVariant) {
                throw new ApiError(400, `Variation '${item.variationLabel}' for ${product.name} not found`);
            }

            const override = await VendorProduct.findOne({
                vendorId,
                productId: item.productId,
                variationLabel: item.variationLabel,
                isActive: true
            });

            const finalPrice = override ? override.price : globalVariant.basePrice;
            const inStock = override ? override.inStock : true;

            if (!inStock) {
                throw new ApiError(400, `${product.name} (${item.variationLabel}) is out of stock`);
            }

            if (override && override.stockQty !== undefined && override.stockQty < item.quantity) {
                throw new ApiError(400, `Only ${override.stockQty} units available for ${product.name} (${item.variationLabel})`);
            }

            itemsTotal += finalPrice * item.quantity;
        }

        // ── 6. Calculate delivery fee from store slab ─────────────────────────
        let deliveryFee = 0;
        const cfg = vendor.deliveryConfig;
        if (cfg?.deliverySlabs?.length > 0) {
            let distanceKm = 0;
            try {
                if (deliveryAddress?.location?.lat && vendor.location?.coordinates?.length === 2) {
                    const result = await MapService.getDistanceKm(
                        { lat: parseFloat(deliveryAddress.location.lat), lng: parseFloat(deliveryAddress.location.lng) },
                        { lat: vendor.location.coordinates[1], lng: vendor.location.coordinates[0] }
                    );
                    distanceKm = result ?? 0;
                }
            } catch {
                distanceKm = 0;
            }
            deliveryFee = calcDeliveryFeeFromSlabs(
                distanceKm,
                cfg.deliverySlabs,
                cfg.freeDeliveryAboveAmount,
                itemsTotal,
                cfg.freeDeliveryRadiusKm
            );
        }

        // ── 7. Calculate tax and platform fee ─────────────────────────────────
        const taxRate = settings.taxRate ?? 0;
        const taxAmount = Math.round((itemsTotal * taxRate) / 100 * 100) / 100;
        const platformFee = settings.platformServiceFee ?? 0;

        // ── 8. Validate & apply coupon ───────────────────────────────────────
        let discountAmount = 0;
        let appliedCouponCode = null;
        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                storeId: vendorId,
                isActive: true,
                expirationDate: { $gte: new Date() }
            });

            if (!coupon) {
                throw new ApiError(400, 'Coupon is invalid, expired, or does not apply to this store');
            }
            if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, 'Coupon usage limit has been reached');
            }
            if (itemsTotal < coupon.minOrderAmount) {
                throw new ApiError(400, `Minimum order amount of ₹${coupon.minOrderAmount} required`);
            }

            if (coupon.discountType === 'percentage') {
                discountAmount = (itemsTotal * coupon.discountValue) / 100;
                if (coupon.maxDiscountAmount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            discountAmount = Math.min(discountAmount, itemsTotal);
            discountAmount = Math.round(discountAmount * 100) / 100;
            appliedCouponCode = coupon.code;
        }

        // ── 9. Final grand total ─────────────────────────────────────────────
        const grandTotal = Math.round(
            (itemsTotal - discountAmount + deliveryFee + taxAmount + platformFee) * 100
        ) / 100;

        return {
            financialSnapshot: {
                itemsTotal,
                deliveryFee,
                platformFee,
                taxAmount,
                discountAmount,
                grandTotal
            },
            appliedCouponCode
        };
    }
    /**
     * Place Order — single point of financial truth
     * All fees calculated here, locked in financialSnapshot, never recalculated.
     */
    static async placeOrder(orderData, customerId) {
        const { vendorId, items, deliveryAddress, paymentMethod, couponCode, specialInstructions, expectedTotal } = orderData;

        // ── 1. Load global settings (payment toggles + tax + platform fee) ────
        let settings = await Settings.findOne().lean();
        if (!settings) {
            // Bootstrap default if collection is empty
            settings = { paymentMethods: { codEnabled: true, mockUpiEnabled: true }, taxRate: 0, platformServiceFee: 0 };
        }

        // ── 2. Validate payment method ────────────────────────────────────────
        const payMethod = (paymentMethod || 'COD').toUpperCase();
        const toggleField = PAYMENT_TOGGLE_MAP[payMethod];
        if (!toggleField) {
            throw new ApiError(400, `Invalid payment method: ${paymentMethod}`);
        }
        if (!settings.paymentMethods?.[toggleField]) {
            throw new ApiError(400, `Payment method '${paymentMethod}' is currently disabled.`);
        }

        // ── 3. Verify vendor (Store) ──────────────────────────────────────────
        const vendor = await Store.findById(vendorId);
        if (!vendor) throw new ApiError(404, 'Vendor not found');
        if (!vendor.isActive) throw new ApiError(400, 'This store is currently inactive');
        if (!vendor.isOpen) throw new ApiError(400, 'This store is currently closed');

        // ── 4. Geo-fence validation ───────────────────────────────────────────
        if (deliveryAddress.location?.lat && deliveryAddress.location?.lng) {
            const lat = parseFloat(deliveryAddress.location.lat);
            const lng = parseFloat(deliveryAddress.location.lng);

            if (!isNaN(lat) && !isNaN(lng)) {
                const isServiceable = await Store.findOne({
                    _id: vendorId,
                    serviceArea: {
                        $geoIntersects: {
                            $geometry: { type: 'Point', coordinates: [lng, lat] }
                        }
                    }
                });
                if (!isServiceable) {
                    throw new ApiError(400, 'Your delivery address is outside this store\'s serviceable area');
                }
            }
        }

        // ── 5. Validate items, calculate itemsTotal, atomic stock deduction ───
        let itemsTotal = 0;
        const validatedItems = [];
        const stockUpdates = []; // track for atomic deduction

        for (const item of items) {
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new ApiError(400, `Invalid quantity for product ${item.productId}`);
            }

            const product = await Product.findById(item.productId);
            if (!product) throw new ApiError(400, `Product ${item.productId} not found`);

            const globalVariant = product.variations.find(v => v.label === item.variationLabel);
            if (!globalVariant) {
                throw new ApiError(400, `Variation '${item.variationLabel}' for ${product.name} not found`);
            }

            const override = await VendorProduct.findOne({
                vendorId,
                productId: item.productId,
                variationLabel: item.variationLabel,
                isActive: true
            });

            const finalPrice = override ? override.price : globalVariant.basePrice;
            const inStock = override ? override.inStock : true;

            if (!inStock) {
                throw new ApiError(400, `${product.name} (${item.variationLabel}) is out of stock`);
            }

            // Check quantified stock if tracked
            if (override && override.stockQty !== undefined && override.stockQty < item.quantity) {
                throw new ApiError(400, `Only ${override.stockQty} units available for ${product.name} (${item.variationLabel})`);
            }

            itemsTotal += finalPrice * item.quantity;
            validatedItems.push({
                productId: product._id,
                name: product.name,
                variationLabel: item.variationLabel,
                price: finalPrice,   // SNAPSHOTTED — never changes
                quantity: item.quantity,
            });

            if (override) {
                stockUpdates.push({
                    vendorProductId: override._id,
                    qty: item.quantity
                });
            }
        }

        // ── 6. Atomically deduct stock ────────────────────────────────────────
        for (const su of stockUpdates) {
            await VendorProduct.findByIdAndUpdate(
                su.vendorProductId,
                {
                    $inc: { stockQty: -su.qty },
                    // Auto-set inStock=false if stockQty reaches 0
                    $set: {}
                }
            );
            // Post-deduction: if stockQty <= 0, mark inStock false
            await VendorProduct.findOneAndUpdate(
                { _id: su.vendorProductId, stockQty: { $lte: 0 } },
                { $set: { inStock: false } }
            );
        }

        // ── 7. Calculate delivery fee from store slab ─────────────────────────
        // Distance calculation: use MapService if lat/lng available, else default slab
        let deliveryFee = 0; // default: free delivery unless store has slabs
        const cfg = vendor.deliveryConfig;
        if (cfg?.deliverySlabs?.length > 0) {
            // Use distance if available, else use closest slab (0–5km = free typically)
            let distanceKm = 0;
            try {
                if (deliveryAddress.location?.lat && vendor.location?.coordinates?.length === 2) {
                    const result = await MapService.getDistanceKm(
                        { lat: parseFloat(deliveryAddress.location.lat), lng: parseFloat(deliveryAddress.location.lng) },
                        { lat: vendor.location.coordinates[1], lng: vendor.location.coordinates[0] }
                    );
                    distanceKm = result ?? 0;
                }
            } catch {
                distanceKm = 0; // graceful fail — use first slab
            }
            deliveryFee = calcDeliveryFeeFromSlabs(
                distanceKm,
                cfg.deliverySlabs,
                cfg.freeDeliveryAboveAmount,
                itemsTotal,
                cfg.freeDeliveryRadiusKm
            );
        }

        // ── 8. Calculate tax ──────────────────────────────────────────────────
        const taxRate = settings.taxRate ?? 0;
        const taxAmount = Math.round((itemsTotal * taxRate) / 100 * 100) / 100;

        // ── 9. Platform service fee ───────────────────────────────────────────
        const platformFee = settings.platformServiceFee ?? 0;

        // ── 10. Validate & apply coupon ───────────────────────────────────────
        let discountAmount = 0;
        let appliedCouponCode = null;
        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                storeId: vendorId,           // MUST belong to same vendor
                isActive: true,
                expirationDate: { $gte: new Date() }
            });

            if (!coupon) {
                throw new ApiError(400, 'Coupon is invalid, expired, or does not apply to this store');
            }
            if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, 'Coupon usage limit has been reached');
            }
            if (itemsTotal < coupon.minOrderAmount) {
                throw new ApiError(400, `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`);
            }

            if (coupon.discountType === 'percentage') {
                discountAmount = (itemsTotal * coupon.discountValue) / 100;
                if (coupon.maxDiscountAmount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            // Floor: discount cannot exceed itemsTotal
            discountAmount = Math.min(discountAmount, itemsTotal);
            discountAmount = Math.round(discountAmount * 100) / 100;
            appliedCouponCode = coupon.code;

            // Increment usage counter
            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
        }

        // ── 11. Final grand total ─────────────────────────────────────────────
        const grandTotal = Math.round(
            (itemsTotal - discountAmount + deliveryFee + taxAmount + platformFee) * 100
        ) / 100;

        // ── 11a. Price Trust Sync ─────────────────────────────────────────────
        if (expectedTotal !== undefined && expectedTotal !== null) {
            if (Math.abs(grandTotal - expectedTotal) > 1) { // 1 rupee tolerance
                throw new ApiError(400, 'Price changed during checkout. Please refresh your cart and try again.');
            }
        }

        // ── 11b. Delivery boy fee (store-configured, not charged to customer) ──
        const deliveryBoyFee = cfg?.deliveryBoyFeePerOrder ?? 30;

        // ── 11c. Platform commission (store-level or global fallback) ──────────
        const commRate = vendor.commissionPercentage ?? settings.commissionPercentage ?? 0;
        const commissionAmount = Math.round((itemsTotal * commRate) / 100 * 100) / 100;

        // ── 12. Resolve address ───────────────────────────────────────────────
        let resolvedAddress = deliveryAddress.fullAddress;

        // Ensure location coordinates are properly preserved at the top level and in location object
        const finalLat = deliveryAddress.lat || deliveryAddress.location?.lat || null;
        const finalLng = deliveryAddress.lng || deliveryAddress.location?.lng || null;

        if (!resolvedAddress || resolvedAddress.length < 10) {
            const geocodeLat = finalLat || vendor.location.coordinates[1];
            const geocodeLng = finalLng || vendor.location.coordinates[0];
            try {
                resolvedAddress = await MapService.reverseGeocode(geocodeLat, geocodeLng);
            } catch {
                resolvedAddress = deliveryAddress.fullAddress || 'Address not resolved';
            }
        }

        // Construct the final delivery address object ensuring coordinates are saved
        const finalDeliveryAddress = {
            ...deliveryAddress,
            fullAddress: resolvedAddress,
            lat: finalLat,
            lng: finalLng,
            location: {
                lat: finalLat,
                lng: finalLng
            }
        };

        // ── 13. Create order with locked financial snapshot ───────────────────
        const order = await Order.create({
            customerId,
            vendorId,
            items: validatedItems,
            financialSnapshot: {
                itemsTotal,
                deliveryFee,
                platformFee,
                taxAmount,
                discountAmount,
                deliveryBoyFee,
                commissionAmount,
                grandTotal,
            },
            // Legacy fields (backward compat)
            subTotal: itemsTotal,
            discountAmount,
            couponCode: appliedCouponCode,
            totalAmount: grandTotal,      // = financialSnapshot.grandTotal

            deliveryAddress: finalDeliveryAddress,
            paymentMethod: payMethod,
            paymentStatus: payMethod === 'MOCK_UPI' ? 'paid' : 'pending', // mock auto-confirms
            specialInstructions: specialInstructions || '',
            status: 'placed',
            statusTimeline: [{
                status: 'placed',
                message: 'Order placed successfully'
            }]
        });

        // ── 14. Real-time notifications ───────────────────────────────────────
        emitToRoom(`vendor_${vendorId.toString()}`, 'new-order', {
            orderId: order._id,
            status: 'placed',
            message: 'You have a new order!'
        });

        // Emitting to the original room fallback
        emitToRoom(vendorId.toString(), 'new-order', {
            orderId: order._id,
            status: 'placed',
            message: 'You have a new order!'
        });

        emitToRoom('admin', 'new-order', {
            orderId: order._id,
            status: 'placed',
            message: 'A new order was just placed.'
        });

        // FCM Vendor
        const populatedVendor = await User.findOne({ vendorId }).select('fcmToken');
        if (populatedVendor && populatedVendor.fcmToken) {
            await sendNotification(
                populatedVendor.fcmToken,
                "New Order",
                "You received a new order!",
                {
                    type: "new_order_alarm",
                    orderId: order._id.toString()
                }
            );
        }

        return order;
    }

    /**
     * Update order status with forward-only transition guard
     */
    static async updateStatus(orderId, status, driverId, user, otp) {
        const order = await Order.findById(orderId).populate('customerId', 'name phone fcmToken');
        if (!order) throw new ApiError(404, 'Order not found');

        // Admins are observers only — they cannot modify order state
        if (user.role === 'admin') {
            throw new ApiError(403, 'Admins cannot modify order status. Only the assigned vendor can manage their orders.');
        }

        // Vendors can only modify their own orders
        if (user.role === 'vendor' && order.vendorId.toString() !== user.vendorId.toString()) {
            throw new ApiError(403, 'Permission denied: this order belongs to a different store');
        }

        // ── Forward-only state transition guard ───────────────────────────────
        const allowedNext = Order.ALLOWED_TRANSITIONS[order.status] || [];
        if (!allowedNext.includes(status)) {
            throw new ApiError(400,
                `Cannot transition from '${order.status}' to '${status}'. Allowed: [${allowedNext.join(', ') || 'none'}]`
            );
        }

        // ── Delivery OTP Check ────────────────────────────────────────────────
        if (status === 'delivered') {
            if (!otp || order.deliveryPin !== otp) {
                throw new ApiError(400, 'Invalid Delivery PIN (OTP). Cannot mark as delivered.');
            }
        }

        const messages = {
            'accepted': 'Order accepted by vendor',
            'assigned': 'Delivery partner assigned',
            'out_for_delivery': 'Delivery partner is on the way',
            'delivered': 'Order delivered successfully',
            'cancelled': 'Order cancelled',
            'refunded': 'Order refunded',
        };

        order.status = status;
        if (driverId) order.driverId = driverId;

        order.statusTimeline.push({
            status,
            message: messages[status] || `Status updated to ${status}`
        });

        const updatedOrder = await order.save();

        // Notify customer via Socket
        emitToRoom(order.customerId._id.toString(), 'orderStatusUpdate', {
            orderId: order._id,
            status: order.status
        });

        // Notify customer via FCM based on status
        if (status === 'out_for_delivery' && order.customerId.fcmToken) {
            await sendNotification(
                order.customerId.fcmToken,
                "Out for Delivery",
                "Your order is on the way",
                {
                    type: "order_status",
                    orderId: order._id.toString()
                }
            );
        } else if (status === 'delivered' && order.customerId.fcmToken) {
            await sendNotification(
                order.customerId.fcmToken,
                "Order Delivered",
                "Enjoy your meal!",
                {
                    type: "order_status",
                    orderId: order._id.toString()
                }
            );
        }

        // Notify driver on assignment
        if (status === 'accepted' && driverId) { // Changed 'assigned' to 'accepted' based on spec
            emitToRoom(`delivery_${driverId.toString()}`, 'delivery-assigned', {
                orderId: order._id,
                message: 'New delivery task assigned to you'
            });

            emitToRoom(driverId.toString(), 'delivery-assigned', {
                orderId: order._id,
                message: 'New delivery task assigned to you'
            });

            const driverUser = await User.findById(driverId).select('fcmToken');
            if (driverUser && driverUser.fcmToken) {
                await sendNotification(
                    driverUser.fcmToken,
                    "Order Assigned",
                    "You have a new delivery",
                    {
                        type: "delivery_assigned_alarm",
                        orderId: order._id.toString()
                    }
                );
            }
        }

        return updatedOrder;
    }

    /**
     * Get vendor-specific orders (scoped to their store only)
     */
    static async getVendorOrders(vendorId, status) {
        const filter = { vendorId };
        if (status && status !== 'all') filter.status = status;

        return await Order.find(filter)
            .populate('customerId', 'name phone')
            .populate('driverId', 'name phone')
            .sort({ placedAt: -1 });
    }
}

module.exports = OrderService;
