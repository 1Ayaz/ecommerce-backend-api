import { useState, useEffect } from 'react';
import {
    User, MapPin, ShoppingBag, LogOut, ChevronRight, Plus, Trash2, Edit2,
    Loader2, RotateCcw, ArrowLeft, ShieldCheck, Phone, Mail, Package,
    HelpCircle, FileText, Lock, Settings, MessageSquare, Truck, ChevronDown, ChevronUp, X,
    Home, Briefcase, MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import { toast } from 'react-toastify';

export default function CustomerDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { addItem, clearCart } = useCartStore();

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', deliveryPin: '' });

    // Expandable sections
    const [expandedSection, setExpandedSection] = useState(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

    // Add address form
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddr, setNewAddr] = useState({
        label: 'Home', name: '', phone: '', flat: '', building: '',
        area: '', landmark: '', city: '', state: '', pincode: ''
    });

    useEffect(() => {
        if (!user) { navigate('/'); return; }
        loadAllData();
    }, [user?._id]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [profileRes, ordersRes, addressRes] = await Promise.all([
                API.get('/users/profile'),
                API.get('/orders/history'),
                API.get('/users/addresses'),
            ]);
            const p = profileRes.data.data;
            setProfileData({ name: p.name || '', email: p.email || '', phone: p.phone || '', deliveryPin: p.deliveryPin || '' });
            setEditForm({ name: p.name || '', email: p.email || '', phone: p.phone || '' });
            setOrders(ordersRes.data.data || []);
            setAddresses(addressRes.data.data || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await API.put('/users/profile', editForm);
            setProfileData(prev => ({ ...prev, ...editForm }));
            setEditingProfile(false);
            toast.success('Profile updated!');
        } catch (err) {
            toast.error('Failed to update profile');
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('Delete this address?')) return;
        try {
            await API.delete(`/users/addresses/${id}`);
            setAddresses(prev => prev.filter(a => a._id !== id));
            useAuthStore.getState().fetchProfile(); // Keep global map sync updated
            toast.success('Address deleted');
        } catch { toast.error('Could not delete address'); }
    };

    const handleReorder = async (order) => {
        try {
            clearCart();
            for (const item of order.items) {
                const product = {
                    _id: item.productId?._id || item.productId,
                    name: item.name || item.productName || 'Product',
                    image: item.image || '',
                    vendorId: order.vendorId?._id || order.vendorId,
                    storeId: order.vendorId?._id || order.vendorId,
                };
                const variation = { label: item.variationLabel, price: item.price };
                for (let i = 0; i < item.quantity; i++) addItem(product, variation);
            }
            toast.success('Items added to cart!');
            setTimeout(() => navigate('/checkout'), 400);
        } catch {
            toast.error('Could not reorder.');
            navigate('/');
        }
    };

    const handleSaveNewAddress = async () => {
        if (!newAddr.flat.trim() || !newAddr.area.trim() || !newAddr.city.trim() || !newAddr.pincode.trim()) {
            toast.error('Please fill in Flat, Area, City, and Pincode');
            return;
        }
        if (!newAddr.phone || newAddr.phone.trim().length < 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }
        try {
            const fullAddress = [newAddr.flat, newAddr.building, newAddr.area, newAddr.landmark, newAddr.city, newAddr.state, newAddr.pincode].filter(Boolean).join(', ');

            // Try to get GPS coords from localStorage
            let lat = null, lng = null;
            try {
                const loc = JSON.parse(localStorage.getItem('userLocation'));
                if (loc?.lat && loc?.lng) { lat = loc.lat; lng = loc.lng; }
            } catch { }

            await API.post('/users/addresses', {
                label: newAddr.label,
                name: newAddr.name.trim(),
                phone: newAddr.phone.trim(),
                flat: newAddr.flat.trim(),
                building: newAddr.building.trim(),
                area: newAddr.area.trim(),
                landmark: newAddr.landmark.trim(),
                city: newAddr.city.trim(),
                state: newAddr.state.trim(),
                pincode: newAddr.pincode.trim(),
                fullAddress,
                location: { lat, lng },
            });
            toast.success('Address saved!');
            setShowAddAddress(false);
            setNewAddr({ label: 'Home', name: '', phone: '', flat: '', building: '', area: '', landmark: '', city: '', state: '', pincode: '' });
            const [res] = await Promise.all([
                API.get('/users/addresses'),
                useAuthStore.getState().fetchProfile() // Synchronize localStorage
            ]);
            setAddresses(res.data.data || []);
        } catch { toast.error('Failed to save address'); }
    };

    const toggleSection = (key) => setExpandedSection(prev => prev === key ? null : key);

    const ongoingOrders = orders.filter(o => !['delivered', 'cancelled', 'rejected'].includes(o.status));
    const pastOrders = orders.filter(o => ['delivered', 'cancelled', 'rejected'].includes(o.status));

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-[#D11243]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/80 pb-24 md:pb-12">
            <div className="max-w-lg mx-auto px-4 pt-6">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-secondary mb-6 transition-colors"
                >
                    <ArrowLeft size={18} /> Back to Shopping
                </button>

                {/* ═══════════════════════════════════════════════ */}
                {/* 🟢 TOP: User Info Card                        */}
                {/* ═══════════════════════════════════════════════ */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#D11243] to-[#ff4d6d] rounded-2xl flex items-center justify-center shadow-lg shadow-red-100">
                            <span className="text-white text-2xl font-black">{profileData.name?.charAt(0)?.toUpperCase() || 'M'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-black text-secondary truncate">{profileData.name || 'Customer'}</h2>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {profileData.phone && (
                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                        <Phone size={11} /> {profileData.phone}
                                    </span>
                                )}
                                {profileData.email && (
                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                        <Mail size={11} /> {profileData.email}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Delivery PIN */}
                    {profileData.deliveryPin && (
                        <div className="bg-red-50 rounded-2xl p-4 flex items-center justify-between mb-5 border border-red-100">
                            <div>
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <ShieldCheck size={12} /> Delivery PIN
                                </p>
                                <p className="text-[11px] text-red-900/60 font-medium mt-0.5">Show to driver on delivery</p>
                            </div>
                            <div className="bg-white px-5 py-2 rounded-xl border border-red-100 shadow-sm text-xl font-black tracking-[0.3em] text-[#D11243]">
                                {profileData.deliveryPin}
                            </div>
                        </div>
                    )}

                    {/* Edit Profile Toggle */}
                    <AnimatePresence>
                        {editingProfile ? (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-3 pt-2 border-t border-gray-100">
                                    <input
                                        type="text" value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="Full Name"
                                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-secondary border-none focus:ring-2 focus:ring-[#D11243]/10 outline-none"
                                    />
                                    <input
                                        type="email" value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        placeholder="Email"
                                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-secondary border-none focus:ring-2 focus:ring-[#D11243]/10 outline-none"
                                    />
                                    <input
                                        type="tel" value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        placeholder="Phone Number"
                                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-secondary border-none focus:ring-2 focus:ring-[#D11243]/10 outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdateProfile}
                                            className="flex-1 bg-[#D11243] text-white font-bold py-3 rounded-xl text-sm hover:bg-red-700 transition-colors">
                                            Save Changes
                                        </button>
                                        <button onClick={() => setEditingProfile(false)}
                                            className="px-4 py-3 bg-gray-100 text-slate-500 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <button
                                onClick={() => setEditingProfile(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl text-sm font-bold text-secondary hover:bg-gray-100 transition-colors"
                            >
                                <Edit2 size={14} /> Edit Profile
                            </button>
                        )}
                    </AnimatePresence>
                </section>

                {/* ═══════════════════════════════════════════════ */}
                {/* Ongoing Orders (always visible if present)     */}
                {/* ═══════════════════════════════════════════════ */}
                {ongoingOrders.length > 0 && (
                    <section className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100 mb-4">
                        <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Truck size={14} /> Ongoing Orders ({ongoingOrders.length})
                        </h3>
                        <div className="space-y-3">
                            {ongoingOrders.map(order => (
                                <div key={order._id}
                                    onClick={() => navigate('/order-success', { state: { orderId: order._id } })}
                                    className="flex items-center justify-between p-3 bg-orange-50/50 rounded-2xl cursor-pointer hover:bg-orange-50 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-secondary">₹{order.totalAmount}</p>
                                        <p className="text-[11px] text-slate-400">{order.items?.length} item{order.items?.length > 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                            {order.status?.replace(/_/g, ' ')}
                                        </span>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/* 🟡 Past Orders (expandable)                    */}
                {/* ═══════════════════════════════════════════════ */}
                <SectionCard
                    title="Order History" icon={<ShoppingBag size={18} />}
                    expanded={expandedSection === 'orders'}
                    onToggle={() => toggleSection('orders')}
                    count={pastOrders.length}
                >
                    {pastOrders.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag size={28} className="text-[#D11243]" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm mb-1">No orders yet</p>
                            <p className="text-slate-300 text-xs font-medium mb-4">Your order history will appear here</p>
                            <button onClick={() => navigate('/')} className="bg-[#D11243] text-white text-xs font-bold px-5 py-2.5 rounded-xl">Browse Menu</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pastOrders.map(order => (
                                <div key={order._id} className="p-4 bg-gray-50/80 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-base font-bold text-secondary">₹{order.totalAmount}</span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {order.status?.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button onClick={() => handleReorder(order)}
                                            className="flex items-center gap-1 text-[11px] font-bold text-[#D11243] hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                            <RotateCcw size={12} /> Reorder
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {order.items?.map((item, idx) => (
                                            <p key={idx} className="text-xs text-slate-500">
                                                <span className="font-bold text-slate-400">{item.quantity}x</span> {item.name || 'Item'} <span className="text-slate-300">({item.variationLabel})</span>
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                {/* ═══════════════════════════════════════════════ */}
                {/* 🟠 Saved Addresses (expandable)                */}
                {/* ═══════════════════════════════════════════════ */}
                <SectionCard
                    title="Saved Addresses" icon={<MapPin size={18} />}
                    expanded={expandedSection === 'addresses'}
                    onToggle={() => toggleSection('addresses')}
                    count={addresses.length}
                >
                    {/* Add New Address Button */}
                    <button
                        onClick={() => setShowAddAddress(!showAddAddress)}
                        className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-red-50 border border-dashed border-red-200 rounded-2xl text-xs font-bold text-[#D11243] hover:bg-red-100 transition-colors"
                    >
                        <Plus size={14} /> Add New Address
                    </button>

                    {/* Add Address Form */}
                    <AnimatePresence>
                        {showAddAddress && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mb-4"
                            >
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                                    {/* Address Type */}
                                    <div className="flex gap-2">
                                        {[{ id: 'Home', icon: <Home size={12} /> }, { id: 'Work', icon: <Briefcase size={12} /> }, { id: 'Other', icon: <MoreHorizontal size={12} /> }].map(t => (
                                            <button key={t.id} onClick={() => setNewAddr({ ...newAddr, label: t.id })}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${newAddr.label === t.id ? 'bg-[#D11243] text-white' : 'bg-white text-slate-500 border border-gray-200'}`}
                                            >
                                                {t.icon} {t.id}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Name & Phone */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" value={newAddr.name} onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                                            placeholder="Full Name *" className="bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                        <input type="tel" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                            placeholder="Phone (10 digits) *" className="bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                    </div>
                                    {/* Flat & Building */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" value={newAddr.flat} onChange={(e) => setNewAddr({ ...newAddr, flat: e.target.value })}
                                            placeholder="Flat / House No. *" className="bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                        <input type="text" value={newAddr.building} onChange={(e) => setNewAddr({ ...newAddr, building: e.target.value })}
                                            placeholder="Building / Street" className="bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                    </div>
                                    {/* Area & Landmark */}
                                    <input type="text" value={newAddr.area} onChange={(e) => setNewAddr({ ...newAddr, area: e.target.value })}
                                        placeholder="Area / Locality *" className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                    <input type="text" value={newAddr.landmark} onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                                        placeholder="Landmark (optional)" className="w-full bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                    {/* City, State, Pincode */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="text" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                                            placeholder="City *" className="bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                        <input type="text" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                                            placeholder="State" className="bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                        <input type="text" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                            placeholder="Pincode *" className="bg-white rounded-xl px-3 py-2.5 text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-[#D11243]/20 outline-none" />
                                    </div>
                                    {/* Save */}
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveNewAddress}
                                            className="flex-1 bg-[#D11243] text-white font-bold py-2.5 rounded-xl text-xs hover:bg-red-700 transition-colors">
                                            Save Address
                                        </button>
                                        <button onClick={() => setShowAddAddress(false)}
                                            className="px-4 py-2.5 bg-white text-slate-500 font-bold rounded-xl text-xs border border-gray-200 hover:bg-gray-100 transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Saved Addresses List */}
                    {addresses.length === 0 ? (
                        <div className="text-center py-8">
                            <MapPin size={28} className="text-slate-200 mx-auto mb-2" />
                            <p className="text-slate-400 text-xs font-bold">No saved addresses</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {addresses.map(addr => (
                                <div key={addr._id} className="p-3 bg-gray-50/80 rounded-2xl group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center text-[#D11243] shrink-0 mt-0.5">
                                                <MapPin size={15} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black uppercase bg-gray-200 px-2 py-0.5 rounded text-slate-600">{addr.label || 'Home'}</span>
                                                    {addr.name && <span className="text-xs font-bold text-secondary">{addr.name}</span>}
                                                </div>
                                                {addr.phone && (
                                                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
                                                        <Phone size={10} /> {addr.phone}
                                                    </p>
                                                )}
                                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                                    {[addr.flat, addr.building, addr.area, addr.landmark, addr.city, addr.pincode]
                                                        .filter(Boolean).join(', ') || addr.fullAddress || 'Address'}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteAddress(addr._id)}
                                            className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>



                {/* ═══════════════════════════════════════════════ */}
                {/* 🔴 LOGOUT                                     */}
                {/* ═══════════════════════════════════════════════ */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white rounded-3xl shadow-sm border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors mb-8"
                >
                    <LogOut size={18} /> Sign Out
                </button>

                <p className="text-center text-[10px] text-slate-300 font-medium pb-4">Mubarak Fresh Chicken • v1.0</p>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Reusable Expandable Section Card                          */
/* ═══════════════════════════════════════════════════════════ */
function SectionCard({ title, icon, expanded, onToggle, count, children }) {
    return (
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="text-[#D11243]">{icon}</div>
                    <span className="text-sm font-bold text-secondary">{title}</span>
                    {count !== undefined && count > 0 && (
                        <span className="bg-gray-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-md">{count}</span>
                    )}
                </div>
                {expanded ? <ChevronUp size={18} className="text-slate-300" /> : <ChevronDown size={18} className="text-slate-300" />}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
