import { useState, useEffect } from 'react';
import { Plus, Trash2, User, Mail, Phone, Loader2, X, Shield, Truck } from 'lucide-react';
import API from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'vendor',
        storeId: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchStores();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await API.get('/auth/users');
            setUsers(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchStores = async () => {
        try {
            const response = await API.get('/stores');
            setStores(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stores');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/auth/users', formData);
            toast.success('User created successfully');
            setShowForm(false);
            setFormData({ name: '', email: '', phone: '', password: '', role: 'vendor', storeId: '' });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this user?')) return;
        try {
            await API.delete(`/auth/users/${id}`);
            toast.success('User removed');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    if (loading && users.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-brand-dark">Staff & Vendors</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-brand-red text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-sm"
                >
                    <Plus size={18} /> Add Staff
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold font-black uppercase text-brand-dark">New Staff Member</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-brand-muted uppercase mb-1 block">Full Name</label>
                                    <input
                                        required
                                        className="w-full bg-brand-bg p-3 rounded-xl border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-brand-muted uppercase mb-1 block">Role</label>
                                    <select
                                        className="w-full bg-brand-bg p-3 rounded-xl border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="vendor">Vendor (Store Manager)</option>
                                        <option value="driver">Driver (Delivery Boy)</option>
                                        <option value="admin">System Admin</option>
                                    </select>
                                </div>
                                {formData.role !== 'admin' && (
                                    <div>
                                        <label className="text-[10px] font-black text-brand-muted uppercase mb-1 block">Assign Store</label>
                                        <select
                                            required
                                            className="w-full bg-brand-bg p-3 rounded-xl border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                            value={formData.storeId}
                                            onChange={e => setFormData({ ...formData, storeId: e.target.value })}
                                        >
                                            <option value="">Select Store</option>
                                            {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-brand-muted uppercase mb-1 block">Phone</label>
                                        <input
                                            required
                                            className="w-full bg-brand-bg p-3 rounded-xl border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-brand-muted uppercase mb-1 block">Email</label>
                                        <input
                                            type="email"
                                            className="w-full bg-brand-bg p-3 rounded-xl border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-brand-muted uppercase mb-1 block">Password</label>
                                    <input
                                        required
                                        type="password"
                                        className="w-full bg-brand-bg p-3 rounded-xl border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-brand-red text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs mt-4 flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50">
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : 'Create Account'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.filter(u => u.role !== 'customer').map(user => (
                    <div key={user._id} className="bg-white p-6 rounded-3xl border border-gray-100 flex justify-between items-center shadow-sm group">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                                user.role === 'vendor' ? 'bg-brand-red/10 text-brand-red' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {user.role === 'admin' ? <Shield size={20} /> :
                                    user.role === 'vendor' ? <User size={20} /> : <Truck size={20} />}
                            </div>
                            <div>
                                <h4 className="font-bold flex items-center gap-2">
                                    {user.name}
                                    <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                                        user.role === 'vendor' ? 'bg-brand-red text-white' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {user.role}
                                    </span>
                                </h4>
                                <p className="text-xs text-brand-muted flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1"><Phone size={10} /> {user.phone}</span>
                                    {user.email && <span className="flex items-center gap-1"><Mail size={10} /> {user.email}</span>}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(user._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
