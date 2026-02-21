import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Calendar, Percent, DollarSign } from 'lucide-react';
import API from '../config/api';
import { toast } from 'react-toastify';

export default function CouponManagement() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '0',
        expirationDate: '',
        usageLimit: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await API.get('/coupons');
            setCoupons(res.data.data);
        } catch (error) {
            console.error('Failed to fetch coupons', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (payload.usageLimit === '') payload.usageLimit = null;

            await API.post('/coupons', payload);
            toast.success('Coupon created successfully');
            setShowModal(false);
            setFormData({
                code: '',
                discountType: 'percentage',
                discountValue: '',
                minOrderAmount: '0',
                expirationDate: '',
                usageLimit: ''
            });
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create coupon');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await API.delete(`/coupons/${id}`);
            toast.success('Coupon deleted');
            fetchCoupons();
        } catch (error) {
            toast.error('Failed to delete coupon');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-brand-dark">Coupons & Promotions</h2>
                    <p className="text-sm text-brand-muted">Manage discount codes</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-red/90 transition-colors"
                >
                    <Plus size={18} />
                    Create Coupon
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-brand-muted">
                        No active coupons found. Create one to get started!
                    </div>
                )}

                {coupons.map(coupon => (
                    <div key={coupon._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group">
                        <button
                            onClick={() => handleDelete(coupon._id)}
                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-red">
                                <Tag size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-brand-dark">{coupon.code}</h3>
                                <div className="flex items-center gap-1 text-xs font-bold text-brand-red uppercase tracking-wider">
                                    {coupon.discountType === 'percentage' ? <Percent size={12} /> : <DollarSign size={12} />}
                                    {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' OFF'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-brand-muted">
                            <div className="flex justify-between">
                                <span>Min Order:</span>
                                <span className="font-bold text-brand-dark">₹{coupon.minOrderAmount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Expires:</span>
                                <span className="font-bold text-brand-dark">
                                    {new Date(coupon.expirationDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Usage:</span>
                                <span className="font-bold text-brand-dark">
                                    {coupon.usedCount} / {coupon.usageLimit || '∞'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-scale-in">
                        <h3 className="text-xl font-black text-brand-dark mb-4">Create New Coupon</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Coupon Code</label>
                                <input
                                    type="text" required
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-red/20 font-mono"
                                    placeholder="SUMMER25"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Type</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-red/20"
                                        value={formData.discountType}
                                        onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Value</label>
                                    <input
                                        type="number" required min="0"
                                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-red/20"
                                        value={formData.discountValue}
                                        onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Min Order (₹)</label>
                                    <input
                                        type="number" min="0"
                                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-red/20"
                                        value={formData.minOrderAmount}
                                        onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Expires</label>
                                    <input
                                        type="date" required
                                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-red/20"
                                        value={formData.expirationDate}
                                        onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-brand-red text-white py-3 rounded-xl font-bold hover:bg-brand-red/90 transition-colors"
                            >
                                Create Coupon
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-full text-brand-muted py-2 text-sm font-bold hover:text-brand-dark"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
