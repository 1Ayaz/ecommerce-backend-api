const axios = require('axios');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

class MapService {
    static _checkApiKey() {
        if (!GOOGLE_API_KEY) {
            throw new ApiError(503, 'Google Places API key is not configured. Set GOOGLE_PLACES_API_KEY in .env');
        }
    }

    /**
     * Get Address Suggestions (Google Places)
     */
    static async getAddressSuggestions(input) {
        this._checkApiKey();
        if (!input) return [];

        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
                {
                    params: {
                        input,
                        key: GOOGLE_API_KEY,
                        components: 'country:in', // Restricted to India
                    },
                }
            );

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                throw new Error(response.data.error_message || response.data.status);
            }

            return response.data.predictions;
        } catch (error) {
            logger.error('Google Places API Error:', error.message);
            throw new ApiError(502, 'Failed to fetch address suggestions');
        }
    }

    /**
     * Get Place Details (Lat/Lng)
     */
    static async getPlaceDetails(placeId) {
        this._checkApiKey();
        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/place/details/json`,
                {
                    params: {
                        place_id: placeId,
                        key: GOOGLE_API_KEY,
                        fields: 'geometry',
                    },
                }
            );

            if (response.data.status !== 'OK') {
                throw new Error(response.data.error_message || response.data.status);
            }

            return response.data.result.geometry.location;
        } catch (error) {
            logger.error('Google Place Details Error:', error.message);
            throw new ApiError(502, 'Failed to fetch place details');
        }
    }

    /**
     * Reverse Geocode (Lat/Lng to Address)
     */
    static async reverseGeocode(lat, lng) {
        this._checkApiKey();
        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json`,
                {
                    params: {
                        latlng: `${lat},${lng}`,
                        key: GOOGLE_API_KEY,
                    },
                }
            );

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                throw new Error(response.data.error_message || response.data.status);
            }

            if (response.data.status === 'ZERO_RESULTS') {
                return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }

            return response.data.results[0].formatted_address;
        } catch (error) {
            logger.error('Google Reverse Geocoding Error:', error.message);
            // Fallback to coordinates string instead of failing
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }

    /**
     * Calculate Distance (Haversine Formula - Mock or real)
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        // Simple haversine implementation for server-side distance checks
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Async wrapper for distance calculation (Haversine formula, no API cost)
     * Returns distance in km between two coordinate pairs.
     */
    static async getDistanceKm(from, to) {
        // { lat, lng } -> { lat, lng }
        return this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
    }
}

module.exports = MapService;
