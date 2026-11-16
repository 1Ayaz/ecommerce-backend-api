/**
 * Rapido Business API Service
 *
 * SETUP: Register at https://business.rapido.bike and get:
 *   - RAPIDO_CLIENT_ID
 *   - RAPIDO_CLIENT_SECRET
 *   - RAPIDO_BASE_URL (sandbox: https://api-sandbox.rapido.bike)
 *
 * Add to backend/.env:
 *   RAPIDO_CLIENT_ID=your_client_id
 *   RAPIDO_CLIENT_SECRET=your_client_secret
 *   RAPIDO_BASE_URL=https://api-sandbox.rapido.bike
 */

const axios = require('axios');

const BASE_URL = process.env.RAPIDO_BASE_URL || 'https://api-sandbox.rapido.bike';
const CLIENT_ID = process.env.RAPIDO_CLIENT_ID;
const CLIENT_SECRET = process.env.RAPIDO_CLIENT_SECRET;

let _cachedToken = null;
let _tokenExpiry = 0;

async function getAccessToken() {
    if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('Rapido credentials not configured. Add RAPIDO_CLIENT_ID and RAPIDO_CLIENT_SECRET to .env');
    }
    const res = await axios.post(`${BASE_URL}/oauth/token`, {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials',
    });
    _cachedToken = res.data.access_token;
    _tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
    return _cachedToken;
}

/**
 * Create a Rapido parcel order
 * @param {Object} params
 * @param {Object} params.pickup  - { lat, lng, address, contactName, contactPhone }
 * @param {Object} params.drop    - { lat, lng, address, contactName, contactPhone }
 * @param {string} params.orderId - Internal order ID (for reference)
 * @param {number} params.weight  - Weight in kg (default 1)
 * @returns {{ rapidoOrderId, trackingUrl, estimatedFare, captain }}
 */
async function createRapidoOrder({ pickup, drop, orderId, weight = 1 }) {
    const token = await getAccessToken();
    const payload = {
        pickup_details: {
            latitude: pickup.lat,
            longitude: pickup.lng,
            address: pickup.address,
            name: pickup.contactName,
            phone_number: pickup.contactPhone,
        },
        drop_details: {
            latitude: drop.lat,
            longitude: drop.lng,
            address: drop.address,
            name: drop.contactName,
            phone_number: drop.contactPhone,
        },
        package_details: {
            weight_in_kgs: weight,
            description: `Fresh Chicken Order #${orderId.toString().slice(-6)}`,
        },
        client_order_id: orderId.toString(),
        payment_method: 'POSTPAID', // Billed to business account
    };

    const res = await axios.post(`${BASE_URL}/v1/orders`, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    return {
        rapidoOrderId: res.data.order_id,
        trackingUrl: res.data.tracking_url || `https://rapido.bike/track/${res.data.order_id}`,
        estimatedFare: res.data.estimated_fare || 0,
        captain: res.data.captain || null,
    };
}

/**
 * Get real-time status of a Rapido order
 */
async function getRapidoStatus(rapidoOrderId) {
    const token = await getAccessToken();
    const res = await axios.get(`${BASE_URL}/v1/orders/${rapidoOrderId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return {
        status: res.data.status,         // e.g. SEARCHING, ASSIGNED, PICKED_UP, DELIVERED
        captain: res.data.captain,
        trackingUrl: res.data.tracking_url,
        currentLocation: res.data.captain_location,
    };
}

/**
 * Cancel a Rapido order
 */
async function cancelRapidoOrder(rapidoOrderId, reason = 'Cancelled by store') {
    const token = await getAccessToken();
    await axios.post(`${BASE_URL}/v1/orders/${rapidoOrderId}/cancel`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return { cancelled: true };
}

module.exports = { createRapidoOrder, getRapidoStatus, cancelRapidoOrder };
