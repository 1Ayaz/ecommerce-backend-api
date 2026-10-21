import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Store, MapPin, Navigation, Hexagon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import API from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

// Fix leaflet default icon in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const storeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

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

/**
 * Builds a GeoJSON polygon from lat/lng + radiusKm (circle approximation with 32 points).
 * This is used when no custom polygon is drawn.
 */
function buildCirclePolygon(lat, lng, radiusKm) {
    const R = 111.32; // km per degree latitude
    const points = 32;
    const coords = [];
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const dLat = (radiusKm / R) * Math.cos(angle);
        const dLng = (radiusKm / (R * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
        coords.push([lng + dLng, lat + dLat]);
    }
    return { type: 'Polygon', coordinates: [coords] };
}

/**
 * StoreMapEditor — inner component that lives inside MapContainer.
 * Handles:
 *  - Draggable store center marker
 *  - Geoman polygon draw/edit controls
 *  - Circle overlay for radius reference
 */
function StoreMapEditor({ lat, lng, radiusKm, onCenterMove, onPolygonChange, existingPolygon }) {
    const map = useMap();
    const markerRef = useRef(null);
    const circleRef = useRef(null);
    const polygonLayerRef = useRef(null);
    const geomanReady = useRef(false);

    // Re-center map when coords change from outside
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);

    // Update circle radius overlay
    useEffect(() => {
        if (circleRef.current) {
            circleRef.current.setLatLng([lat, lng]);
            circleRef.current.setRadius(radiusKm * 1000);
        } else {
            circleRef.current = L.circle([lat, lng], {
                radius: radiusKm * 1000,
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '6 4',
            }).addTo(map);
        }
    }, [lat, lng, radiusKm, map]);

    // Set up Geoman controls once
    useEffect(() => {
        if (geomanReady.current) return;
        geomanReady.current = true;

        map.pm.addControls({
            position: 'topright',
            drawMarker: false,
            drawCircle: false,
            drawCircleMarker: false,
            drawPolyline: false,
            drawRectangle: true,
            drawPolygon: true,
            editMode: true,
            dragMode: false,
            cutPolygon: false,
            removalMode: true,
            rotateMode: false,
        });

        map.pm.setGlobalOptions({
            snappable: true,
            snapDistance: 10,
        });

        // If there's a saved polygon, load it
        if (existingPolygon?.coordinates) {
            // Convert GeoJSON [lng, lat] → Leaflet [lat, lng]
            const latlngs = existingPolygon.coordinates[0].map(([lng, lat]) => [lat, lng]);
            const layer = L.polygon(latlngs, {
                color: '#D11243',
                fillColor: '#D11243',
                fillOpacity: 0.15,
                weight: 2,
            }).addTo(map);
            layer.pm.enable();
            polygonLayerRef.current = layer;
        }

        // Capture newly drawn shapes
        map.on('pm:create', (e) => {
            // Remove previous polygon if any
            if (polygonLayerRef.current) {
                map.removeLayer(polygonLayerRef.current);
            }
            polygonLayerRef.current = e.layer;
            e.layer.setStyle({ color: '#D11243', fillColor: '#D11243', fillOpacity: 0.15, weight: 2 });
            emitPolygon(e.layer);
        });

        // Capture edits
        map.on('pm:edit', (e) => {
            if (e.layer === polygonLayerRef.current) emitPolygon(e.layer);
        });

        // Capture removal
        map.on('pm:remove', () => {
            polygonLayerRef.current = null;
            onPolygonChange(null); // revert to radius-based
        });

        function emitPolygon(layer) {
            const latlngs = layer.getLatLngs()[0];
            const coords = latlngs.map(p => [p.lng, p.lat]);
            // Close ring
            coords.push(coords[0]);
            onPolygonChange({ type: 'Polygon', coordinates: [coords] });
        }

        return () => {
            map.pm.removeControls();
            map.off('pm:create');
            map.off('pm:edit');
            map.off('pm:remove');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Clicking map moves store center
    useMapEvents({
        contextmenu(e) {
            onCenterMove(e.latlng.lat, e.latlng.lng);
        },
    });

    return (
        <Marker
            position={[lat, lng]}
            icon={storeIcon}
            draggable={true}
            ref={markerRef}
            eventHandlers={{
                dragend() {
                    const m = markerRef.current;
                    if (m) {
                        const { lat, lng } = m.getLatLng();
                        onCenterMove(lat, lng);
                    }
                },
            }}
        />
    );
}

export default function StoreManagement() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(DEFAULT_FORM);
    // Stores the custom-drawn polygon (GeoJSON). null = use circle auto-gen
    const [customPolygon, setCustomPolygon] = useState(null);
    const [existingPolygon, setExistingPolygon] = useState(null);

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
        // Load existing service area polygon if it exists
        setExistingPolygon(store.serviceArea || null);
        setCustomPolygon(null);
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
                location: { type: 'Point', coordinates: [lng, lat] },
                serviceArea: customPolygon || buildCirclePolygon(lat, lng, radiusKm),
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
            setCustomPolygon(null);
            setExistingPolygon(null);
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
                    <p className="text-xs text-brand-muted mt-0.5">Draw a polygon on the map to define your exact delivery zone</p>
                </div>
                <button
                    onClick={() => { setFormData(DEFAULT_FORM); setIsEditing(null); setCustomPolygon(null); setExistingPolygon(null); setShowForm(true); }}
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
                            className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">{isEditing ? 'Edit Store' : 'New Store'}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Draw a polygon for custom delivery zone, or use the radius slider
                                    </p>
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {field('Store Name *', 'name', 'text', { required: true, placeholder: 'The Fresh Cuts – Rajahmundry' })}
                                {field('Address', 'address', 'text', { placeholder: 'Main Road, Rajahmundry, AP 533101' })}
                                <div className="grid grid-cols-2 gap-4">
                                    {field('City', 'city', 'text', { placeholder: 'Rajahmundry' })}
                                    {field('Phone', 'phone', 'tel', { placeholder: '9876543210' })}
                                </div>

                                {/* Geo-fence / Map section */}
                                <div className="bg-blue-50 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Hexagon size={14} className="text-blue-500" />
                                            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">Delivery Zone</p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            {customPolygon ? (
                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Custom Polygon ✓</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">{formData.radiusKm} km radius</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Instructions */}
                                    <div className="bg-white/70 rounded-xl px-4 py-2.5 text-[10px] font-semibold text-blue-700 space-y-0.5">
                                        <p>🔴 Drag red marker to move store center</p>
                                        <p>⬡ Click the polygon/rectangle tool (top-right) to draw delivery zone</p>
                                        <p>✏️ Click edit tool to adjust polygon vertices</p>
                                        <p>🗑️ Remove tool to delete and revert to radius circle</p>
                                        <p>Right-click map to also reposition store center</p>
                                    </div>

                                    {/* Leaflet Map */}
                                    <div className="rounded-xl overflow-hidden border border-blue-100 shadow-inner" style={{ height: 320 }}>
                                        {showForm && (
                                            <MapContainer
                                                center={[formData.lat, formData.lng]}
                                                zoom={13}
                                                style={{ height: '100%', width: '100%' }}
                                                scrollWheelZoom={true}
                                            >
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                                                />
                                                <StoreMapEditor
                                                    lat={parseFloat(formData.lat)}
                                                    lng={parseFloat(formData.lng)}
                                                    radiusKm={parseFloat(formData.radiusKm)}
                                                    onCenterMove={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))}
                                                    onPolygonChange={setCustomPolygon}
                                                    existingPolygon={existingPolygon}
                                                />
                                            </MapContainer>
                                        )}
                                    </div>

                                    {/* Lat/Lng + Radius controls */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {field('Latitude', 'lat', 'number', { step: '0.0001', placeholder: '17.0005' })}
                                        {field('Longitude', 'lng', 'number', { step: '0.0001', placeholder: '81.804' })}
                                    </div>

                                    {/* Radius slider */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                                            Circle Radius — {formData.radiusKm} km
                                            <span className="text-[9px] font-normal text-gray-400 ml-2">(used only if no polygon is drawn)</span>
                                        </label>
                                        <input
                                            type="range"
                                            min={0.5}
                                            max={30}
                                            step={0.5}
                                            value={formData.radiusKm}
                                            onChange={e => setFormData(prev => ({ ...prev, radiusKm: parseFloat(e.target.value) }))}
                                            className="w-full accent-blue-500"
                                        />
                                        <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-1">
                                            <span>0.5 km</span><span>30 km</span>
                                        </div>
                                    </div>
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
                                    <div className="flex gap-2 mt-2 flex-wrap">
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
