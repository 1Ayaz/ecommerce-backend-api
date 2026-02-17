/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Find nearest store to given coordinates
 * @param {Array} stores - Array of store objects with location.coordinates
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @returns {Object|null} Nearest store within service radius or null
 */
function findNearestStore(stores, userLat, userLng) {
    let nearestStore = null;
    let minDistance = Infinity;

    for (const store of stores) {
        const [storeLng, storeLat] = store.location.coordinates;
        const distance = calculateDistance(userLat, userLng, storeLat, storeLng);

        // Check if within service radius
        if (distance <= store.serviceRadiusKm && distance < minDistance) {
            minDistance = distance;
            nearestStore = { ...store.toObject(), distance };
        }
    }

    return nearestStore;
}

module.exports = { calculateDistance, findNearestStore };
