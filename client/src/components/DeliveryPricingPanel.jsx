import { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import API from '../config/api';
import { toast } from 'react-toastify';

export default function DeliveryPricingPanel({ storeId }) {
    const [config, setConfig] = useState({
        freeDeliveryRadiusKm: 5,
        freeDeliveryAboveAmount: 499,
        deliveryBoyFeePerOrder: 30,
        deliverySlabs: [
            { fromKm: 0, toKm: 5, fee: 0 },
            { fromKm: 5, toKm: 10, fee: 30 },
            { fromKm: 10, toKm: 15, fee: 50 }
        ]
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await API.get(`/stores/${storeId}`);
                if (res.data.data.deliveryConfig) {
                    setConfig(res.data.data.deliveryConfig);
                }
            } catch (err) {
                console.error('Failed to fetch delivery config:', err);
            } finally {
                setLoading(false);
            }
        };
        if (storeId) fetchConfig();
    }, [storeId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await API.put(`/stores/${storeId}/delivery-config`, config);
            toast.success('Delivery pricing updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const addSlab = () => {
        const lastSlab = config.deliverySlabs[config.deliverySlabs.length - 1];
        const newFrom = lastSlab ? lastSlab.toKm : 0;
        setConfig(prev => ({
            ...prev,
            deliverySlabs: [...prev.deliverySlabs, { fromKm: newFrom, toKm: newFrom + 5, fee: 0 }]
        }));
    };

    const removeSlab = (index) => {
        setConfig(prev => ({
            ...prev,
            deliverySlabs: prev.deliverySlabs.filter((_, i) => i !== index)
        }));
    };

    const updateSlab = (index, field, value) => {
        setConfig(prev => ({
            ...prev,
            deliverySlabs: prev.deliverySlabs.map((s, i) =>
                i === index ? { ...s, [field]: Number(value) } : s
            )
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-[#D11243]" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Truck size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-secondary text-lg">Delivery Pricing</h3>
                        <p className="text-xs text-slate-400">Set your delivery fees by distance</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#D11243] text-white px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-[#b00f38] transition-colors"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                </button>
            </div>

            {/* Global settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                        Free Delivery Radius (km)
                    </label>
                    <input
                        type="number"
                        value={config.freeDeliveryRadiusKm}
                        onChange={e => setConfig(prev => ({ ...prev, freeDeliveryRadiusKm: Number(e.target.value) }))}
                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-secondary outline-none border border-gray-100 focus:border-[#D11243]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Orders within this radius get free delivery</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                        Free Delivery Above Amount (₹)
                    </label>
                    <input
                        type="number"
                        value={config.freeDeliveryAboveAmount}
                        onChange={e => setConfig(prev => ({ ...prev, freeDeliveryAboveAmount: Number(e.target.value) }))}
                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-secondary outline-none border border-gray-100 focus:border-[#D11243]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Orders above this amount get free delivery</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                        Delivery Boy Fee Per Order (₹)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={config.deliveryBoyFeePerOrder}
                        onChange={e => setConfig(prev => ({ ...prev, deliveryBoyFeePerOrder: Number(e.target.value) }))}
                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-secondary outline-none border border-gray-100 focus:border-[#D11243]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Amount paid to delivery partner per completed delivery</p>
                </div>
            </div>

            {/* Distance slabs */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-secondary">Distance-Based Fees</h4>
                    <button onClick={addSlab} className="flex items-center gap-1 text-xs font-bold text-[#D11243] hover:underline">
                        <Plus size={14} /> Add Slab
                    </button>
                </div>
                <div className="space-y-2">
                    {config.deliverySlabs.map((slab, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">From (km)</label>
                                    <input type="number" value={slab.fromKm}
                                        onChange={e => updateSlab(i, 'fromKm', e.target.value)}
                                        className="w-full bg-gray-50 rounded-lg px-3 py-2 text-xs font-bold outline-none border border-gray-100" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">To (km)</label>
                                    <input type="number" value={slab.toKm}
                                        onChange={e => updateSlab(i, 'toKm', e.target.value)}
                                        className="w-full bg-gray-50 rounded-lg px-3 py-2 text-xs font-bold outline-none border border-gray-100" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Fee (₹)</label>
                                    <input type="number" value={slab.fee}
                                        onChange={e => updateSlab(i, 'fee', e.target.value)}
                                        className="w-full bg-gray-50 rounded-lg px-3 py-2 text-xs font-bold outline-none border border-gray-100" />
                                </div>
                            </div>
                            {config.deliverySlabs.length > 1 && (
                                <button onClick={() => removeSlab(i)} className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
