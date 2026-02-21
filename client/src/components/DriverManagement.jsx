import { useState, useEffect } from 'react';
import { Plus, Trash2, Truck, Mail, Phone, Loader2, X } from 'lucide-react';
import API from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

export default function DriverManagement() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const response = await API.get('/auth/users');
            setDrivers(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch delivery boys');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/auth/users', { ...formData, role: 'driver' });
            toast.success('Delivery Boy added successfully');
            setShowForm(false);
            setFormData({ name: '', email: '', phone: '', password: '' });
            fetchDrivers();
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.error?.message || 'Failed to add delivery boy');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this delivery boy?')) return;
        try {
            await API.delete(`/auth/users/${id}`);
            toast.success('Delivery Boy removed');
            fetchDrivers();
        } catch (error) {
            toast.error('Failed to delete delivery boy');
        }
    };

    if (loading && drivers.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-dark" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-brand-dark">Delivery Boys</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-brand-red text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-sm"
                >
                    <Plus size={18} /> Add Delivery Boy
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
                                <h3 className="text-xl font-bold font-black uppercase text-brand-dark">New Delivery Boy</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                                    <input required type="text"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border border-gray-100 outline-none focus:border-brand-red" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Email (For Login)</label>
                                    <input required type="email"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border border-gray-100 outline-none focus:border-brand-red" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                                    <input required type="text"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border border-gray-100 outline-none focus:border-brand-red" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                                    <input required type="password"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border border-gray-100 outline-none focus:border-brand-red" />
                                </div>
                                <div className="pt-4">
                                    <button disabled={loading} type="submit" className="w-full bg-brand-red text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50">
                                        {loading ? 'Creating...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map(driver => (
                    <div key={driver._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center relative group">
                        <button
                            onClick={() => handleDelete(driver._id)}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                            <Truck size={28} />
                        </div>
                        <h4 className="font-bold text-lg text-brand-dark mb-1">{driver.name || 'Unnamed'}</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-blue-100 text-blue-600 mb-3">
                            Delivery Partner
                        </span>

                        <div className="w-full space-y-2 mt-2 pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-center gap-2 text-sm text-brand-muted">
                                <Mail size={14} /> <span className="truncate max-w-[180px]">{driver.email}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm text-brand-muted">
                                <Phone size={14} /> <span>{driver.phone || 'No phone'}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {drivers.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Truck size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No delivery boys added yet.</p>
                        <p className="text-sm mt-1">Add one to start assigning orders.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
