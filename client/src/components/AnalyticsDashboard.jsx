import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ShoppingBag, Users, DollarSign, BarChart3, Loader2, Store, Percent, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../config/api';
import { toast } from 'react-toastify';

const PERIODS = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: '1Y', value: '1y' },
];

export default function AnalyticsDashboard() {
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, newCustomers: 0 });
    const [storeAnalytics, setStoreAnalytics] = useState([]);
    const [editingCommission, setEditingCommission] = useState(null);
    const [commissionInput, setCommissionInput] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [kpiRes, storeRes] = await Promise.all([
                API.get(`/analytics/dashboard?period=${period}`),
                API.get(`/analytics/store-analytics?period=${period}`),
            ]);
            setKpis(kpiRes.data.data);
            setStoreAnalytics(storeRes.data.data);
        } catch (err) {
            console.error('Analytics fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Totals
    const platformTotals = useMemo(() => {
        return storeAnalytics.reduce((acc, s) => ({
            totalOrders: acc.totalOrders + s.totalOrders,
            grossRevenue: acc.grossRevenue + s.grossRevenue,
            commissionEarned: acc.commissionEarned + s.commissionEarned,
            deliveryBoyPayout: acc.deliveryBoyPayout + s.deliveryBoyPayout,
            vendorPayout: acc.vendorPayout + s.vendorPayout,
        }), { totalOrders: 0, grossRevenue: 0, commissionEarned: 0, deliveryBoyPayout: 0, vendorPayout: 0 });
    }, [storeAnalytics]);

    const handleSaveCommission = async (storeId) => {
        try {
            await API.put(`/stores/${storeId}/commission`, {
                commissionPercentage: commissionInput === '' ? null : Number(commissionInput)
            });
            toast.success('Commission updated!');
            setEditingCommission(null);
            fetchAnalytics();
        } catch (err) {
            toast.error('Failed to update commission');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-[#D11243]" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-brand-dark">Platform Analytics</h1>
                    <p className="text-sm text-brand-muted font-medium">Store-wise revenue, commission & payouts</p>
                </div>
                <div className="flex gap-2 bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${period === p.value
                                ? 'bg-brand-dark text-white shadow-sm'
                                : 'text-brand-muted hover:text-brand-dark'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Platform-Level KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    icon={<DollarSign size={20} />}
                    label="Total Revenue"
                    value={`₹${kpis.totalRevenue.toLocaleString()}`}
                    color="#D11243"
                    bgColor="#FEE2E2"
                />
                <KpiCard
                    icon={<ShoppingBag size={20} />}
                    label="Total Orders"
                    value={kpis.totalOrders.toLocaleString()}
                    color="#3B82F6"
                    bgColor="#DBEAFE"
                />
                <KpiCard
                    icon={<Percent size={20} />}
                    label="Commission Earned"
                    value={`₹${platformTotals.commissionEarned.toLocaleString()}`}
                    color="#059669"
                    bgColor="#D1FAE5"
                />
                <KpiCard
                    icon={<Users size={20} />}
                    label="New Customers"
                    value={kpis.newCustomers.toLocaleString()}
                    color="#8B5CF6"
                    bgColor="#EDE9FE"
                />
            </div>

            {/* Store-wise Analytics Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Store size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-secondary text-lg">Store Performance</h3>
                            <p className="text-xs text-slate-400">Revenue, commission & payout breakdown per store</p>
                        </div>
                    </div>
                </div>

                {storeAnalytics.length === 0 ? (
                    <div className="p-12 text-center text-brand-muted">
                        No orders data available for this period.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Store</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Orders</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Delivered</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Cancelled</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Revenue</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Commission %</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Commission ₹</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Driver Costs</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Vendor Payout</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {storeAnalytics.map(store => (
                                    <tr key={store.storeId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-brand-dark">{store.storeName}</p>
                                            {store.businessName && (
                                                <p className="text-[10px] text-slate-400">{store.businessName}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-bold text-brand-dark text-center">{store.totalOrders}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{store.deliveredOrders}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">{store.cancelledOrders}</span>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-bold text-brand-dark text-right">₹{store.grossRevenue.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-center">
                                            {editingCommission === store.storeId ? (
                                                <div className="flex items-center gap-1 justify-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.5"
                                                        value={commissionInput}
                                                        onChange={e => setCommissionInput(e.target.value)}
                                                        className="w-16 bg-gray-50 rounded-lg px-2 py-1 text-xs font-bold text-center outline-none border border-brand-red/30"
                                                        autoFocus
                                                        placeholder="Global"
                                                    />
                                                    <button
                                                        onClick={() => handleSaveCommission(store.storeId)}
                                                        className="text-[10px] font-black text-white bg-brand-red px-2 py-1 rounded-lg"
                                                    >
                                                        OK
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCommission(null)}
                                                        className="text-[10px] font-black text-slate-400"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingCommission(store.storeId);
                                                        setCommissionInput(store.commissionRate ?? '');
                                                    }}
                                                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                                >
                                                    {store.commissionRate != null ? `${store.commissionRate}%` : 'Global'}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-bold text-emerald-600 text-right">₹{store.commissionEarned.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm font-bold text-orange-500 text-right">₹{store.deliveryBoyPayout.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm font-black text-brand-dark text-right">₹{store.vendorPayout.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 border-t-2 border-gray-200">
                                    <td className="px-6 py-4 text-sm font-black text-brand-dark">TOTAL</td>
                                    <td className="px-4 py-4 text-sm font-black text-brand-dark text-center">{platformTotals.totalOrders}</td>
                                    <td className="px-4 py-4" colSpan={2}></td>
                                    <td className="px-4 py-4 text-sm font-black text-brand-dark text-right">₹{platformTotals.grossRevenue.toLocaleString()}</td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 text-sm font-black text-emerald-600 text-right">₹{platformTotals.commissionEarned.toLocaleString()}</td>
                                    <td className="px-4 py-4 text-sm font-black text-orange-500 text-right">₹{platformTotals.deliveryBoyPayout.toLocaleString()}</td>
                                    <td className="px-4 py-4 text-sm font-black text-brand-dark text-right">₹{platformTotals.vendorPayout.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// KPI Card component
function KpiCard({ icon, label, value, color, bgColor }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: bgColor, color }}>
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-black text-brand-dark mb-1">{value}</p>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">{label}</p>
        </motion.div>
    );
}
