import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Store, MapPin, Navigation } from 'lucide-react';
import API from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

/**
 * Generates a GeoJSON Polygon (square) around a center point given a radius in km.
 * This is used as the store's serviceArea for geo-intersection queries.
 */
function buildServiceAreaPolygon(lat, lng, radiusKm) {
    const R = 111.32; // km per degree latitude
    const dLat = radiusKm / R;
    const dLng = radiusKm / (R * Math.cos((lat * Math.PI) / 180));

    const minLng = lng - dLng;
    const maxLng = lng + dLng;
    const minLat = lat - dLat;
    const maxLat = lat + dLat;

    return {
        type: 'Polygon',
        coordinates: [[
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat], // close the ring
        ]],
    };
}

const DEFAULT_FORM = {
    name: '',
    address: '',
    phone: '',
    city: 'Rajahmundry',
    lat: 17.0005,
    lng: 81.804,
    radiusKm: 6,
    servicePincodes: '533101,533103,533104,533105,533106',
    isOpen: true,
    isActive: true,
};

export default function StoreManagement() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(DEFAULT_FORM);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const circleRef = useRef(null);

    // Load Google Maps API dynamically if not already loaded
    useEffect(() => {
        if (window.google?.maps || document.getElementById('google-maps-script')) return;
        const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            console.warn('No Google Maps API key found — map will not load');
            return;
        }
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }, []);

    // Sync map when form opens or coords/radius change
    useEffect(() => {
        if (!showForm) return;

        // Wait for Google Maps to finish loading
        const tryInit = () => {
            if (!window.google?.maps) return;

            const container = document.getElementById('store-map');
            if (!container) return;

            const center = { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) };

            if (!mapRef.current) {
                mapRef.current = new window.google.maps.Map(container, {
                    center,
                    zoom: 13,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                markerRef.current = new window.google.maps.Marker({
                    position: center,
                    map: mapRef.current,
                    draggable: true,
                    title: 'Store Location'
                });

                circleRef.current = new window.google.maps.Circle({
                    strokeColor: '#3B82F6',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#3B82F6',
                    fillOpacity: 0.1,
                    map: mapRef.current,
                    center,
                    radius: formData.radiusKm * 1000,
                });

                // Update coords on marker drag
                markerRef.current.addListener('dragend', () => {
                    const pos = markerRef.current.getPosition();
                    setFormData(prev => ({ ...prev, lat: pos.lat(), lng: pos.lng() }));
                });
            } else {
                // Update existing components
                mapRef.current.setCenter(center);
                markerRef.current.setPosition(center);
                circleRef.current.setCenter(center);
                circleRef.current.setRadius(formData.radiusKm * 1000);
            }
        };

        // Retry until Google Maps is loaded (script may still be loading)
        const interval = setInterval(() => {
            if (window.google?.maps) {
                clearInterval(interval);
                tryInit();
            }
        }, 200);

        // Also try immediately
        setTimeout(tryInit, 100);

        return () => clearInterval(interval);
    }, [showForm, formData.lat, formData.lng, formData.radiusKm]);

    // Reset map refs on close
    useEffect(() => {
        if (!showForm) {
            mapRef.current = null;
            markerRef.current = null;
            circleRef.current = null;
        }
    }, [showForm]);

    useEffect(() => { fetchStores(); }, []);

    const fetchStores = async () => {
        try {
            const response = await API.get('/stores');
            setStores(response.data.data);
        } catch {
            toast.error('Failed to fetch stores');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (store) => {
        // Extract lat/lng from existing location point
        const [lng, lat] = store.location?.coordinates || [81.804, 17.0005];
        setFormData({
            name: store.name || '',
            address: store.address || '',
            phone: store.phone || '',
            city: store.city || 'Rajahmundry',
            lat,
            lng,
            radiusKm: store.serviceRadiusKm || 6,
            servicePincodes: (store.servicePincodes || []).join(','),
            isOpen: store.isOpen ?? true,
            isActive: store.isActive ?? true,
        });
        setIsEditing(store._id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const lat = parseFloat(formData.lat);
            const lng = parseFloat(formData.lng);
            const radiusKm = parseFloat(formData.radiusKm);

            const payload = {
                name: formData.name,
                address: formData.address,
                city: formData.city,
                phone: formData.phone || undefined,
                isOpen: formData.isOpen,
                isActive: formData.isActive,
                serviceRadiusKm: radiusKm,
                servicePincodes: formData.servicePincodes
                    ? formData.servicePincodes.split(',').map(p => p.trim()).filter(Boolean)
                    : [],
                location: {
                    type: 'Point',
                    coordinates: [lng, lat],
                },
                // Auto-generate the GeoJSON polygon from center + radius
                serviceArea: buildServiceAreaPolygon(lat, lng, radiusKm),
            };

            if (isEditing) {
                await API.put(`/stores/${isEditing}`, payload);
                toast.success('Store updated ✅');
            } else {
                await API.post('/stores', payload);
                toast.success('Store created ✅');
            }
            setShowForm(false);
            setIsEditing(null);
            setFormData(DEFAULT_FORM);
            fetchStores();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save store');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this store?')) return;
        try {
            await API.delete(`/stores/${id}`);
            toast.success('Store removed');
            fetchStores();
        } catch {
            toast.error('Failed to delete store');
        }
    };

    const field = (label, key, type = 'text', props = {}) => (
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">{label}</label>
            <input
                type={type}
                value={formData[key]}
                onChange={e => setFormData(prev => ({ ...prev, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-red-300 focus:bg-white transition-all"
                {...props}
            />
        </div>
    );

    if (loading && stores.length === 0) return (
        <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-brand-dark">Store Locations</h2>
                    <p className="text-xs text-brand-muted mt-0.5">Manage store geo-fences and service areas</p>
                </div>
                <button
                    onClick={() => { setFormData(DEFAULT_FORM); setIsEditing(null); setShowForm(true); }}
                    className="bg-brand-red text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-red-700 transition-all"
                >
                    <Plus size={18} /> Add Store
                </button>
            </div>

            {/* Store Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.97 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">{isEditing ? 'Edit Store' : 'New Store'}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Service area is auto-generated from center + radius</p>
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {field('Store Name *', 'name', 'text', { required: true, placeholder: 'Mubarak Fresh Chicken – Rajahmundry' })}
                                {field('Address', 'address', 'text', { placeholder: 'Main Road, Rajahmundry, AP 533101' })}
                                <div className="grid grid-cols-2 gap-4">
                                    {field('City', 'city', 'text', { placeholder: 'Rajahmundry' })}
                                    {field('Phone', 'phone', 'tel', { placeholder: '9876543210' })}
                                </div>

                                {/* Geo-fence section */}
                                <div className="bg-blue-50 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Navigation size={14} className="text-blue-500" />
                                            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">Geo-fence (Service Area)</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
                                            {formData.radiusKm} km radius
                                        </span>
                                    </div>

                                    {/* Map Container */}
                                    <div className="relative w-full h-48 bg-gray-200 rounded-xl overflow-hidden shadow-inner border border-blue-100">
                                        <div id="store-map" className="w-full h-full" />
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-sm p-2 rounded-lg text-[10px] font-bold text-blue-600">
                                            Drag center to move store
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {field('Latitude', 'lat', 'number', { step: '0.0001', placeholder: '17.0005' })}
                                        {field('Longitude', 'lng', 'number', { step: '0.0001', placeholder: '81.804' })}
                                    </div>
                                    {field('Service Radius (km)', 'radiusKm', 'number', { min: 0.5, max: 50, step: 0.5, placeholder: '6' })}
                                </div>

                                {field('Service Pincodes (comma-separated)', 'servicePincodes', 'text', { placeholder: '533101,533103,533104' })}

                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.isOpen} onChange={e => setFormData(p => ({ ...p, isOpen: e.target.checked }))} className="w-4 h-4 accent-red-500" />
                                        <span className="text-sm font-bold text-gray-700">Open for orders</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-red-500" />
                                        <span className="text-sm font-bold text-gray-700">Active</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-brand-red text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                                    {isEditing ? 'Update Store' : 'Create Store'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Store Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stores.map(store => (
                    <div key={store._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red shrink-0">
                                    <Store size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-dark">{store.name}</h4>
                                    <p className="text-xs text-brand-muted mt-0.5">{store.address}</p>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <MapPin size={11} className="text-brand-red" />
                                        <span className="text-[10px] font-bold text-brand-muted">
                                            {store.location?.coordinates?.[1]?.toFixed(4)}°N, {store.location?.coordinates?.[0]?.toFixed(4)}°E
                                            {store.serviceRadiusKm ? ` · ${store.serviceRadiusKm} km radius` : ''}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${store.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {store.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${store.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-500'}`}>
                                            {store.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        {store.serviceArea && (
                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase bg-purple-100 text-purple-700">
                                                Geo-fence ✓
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(store)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><Edit2 size={15} /></button>
                                <button onClick={() => handleDelete(store._id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"><Trash2 size={15} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
