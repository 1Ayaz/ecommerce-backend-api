import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import API from '../config/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const STATUSES = ['all', 'placed', 'accepted', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_COLORS = {
    placed: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    assigned: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const NEXT_STATUS = {
    placed: 'accepted',
    accepted: 'assigned',
    assigned: 'out_for_delivery',
    out_for_delivery: 'delivered',
};

/**
 * AdminOrdersTable — paginated, filterable orders table for admin.
 * Fetches from GET /api/orders?status=&page=&limit=20
 * Admin can update order status inline.
 */
export default function AdminOrdersTable() {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const LIMIT = 20;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: LIMIT });
            if (statusFilter !== 'all') params.set('status', statusFilter);
            const { data } = await API.get(`/orders?${params.toString()}`);
            setOrders(data.data || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Reset to page 1 on filter change
    useEffect(() => {
        setPage(1);
    }, [statusFilter]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            await API.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order moved to "${newStatus.replace(/_/g, ' ')}"`);
            fetchOrders();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    // Client-side search filter (name/phone match from loaded page)
    const displayed = search.trim()
        ? orders.filter(o =>
            o.customerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.customerId?.phone?.includes(search) ||
            o._id.slice(-6).includes(search.toLowerCase())
        )
        : orders;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-brand-dark">All Orders</h1>
                    <p className="text-sm text-brand-muted font-medium">
                        {total.toLocaleString()} total orders · Page {page} of {pages}
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-brand-muted hover:text-secondary hover:border-gray-200 transition-all shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Status Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {STATUSES.map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${statusFilter === s
                            ? 'bg-brand-dark text-white shadow-sm'
                            : 'bg-white text-brand-muted border border-gray-100 hover:border-brand-red/30'
                            }`}
                    >
                        {s.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, phone, or order ID..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-medium outline-none focus:border-brand-red/20 shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <RefreshCw size={28} className="animate-spin text-brand-red" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-brand-muted">
                        <p className="font-bold text-sm">No orders found</p>
                        <p className="text-xs mt-1">Try a different filter or search term</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {displayed.map(order => (
                            <div key={order._id}>
                                {/* Row */}
                                <div
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                                >
                                    {/* Order ID */}
                                    <span className="text-xs font-black text-brand-red bg-brand-red/5 px-3 py-1 rounded-full uppercase tracking-tighter flex-shrink-0">
                                        #{order._id.slice(-6)}
                                    </span>

                                    {/* Customer */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-brand-dark truncate">
                                            {order.customerId?.name || 'Guest'}
                                        </p>
                                        <p className="text-[10px] text-brand-muted">{order.customerId?.phone}</p>
                                    </div>

                                    {/* Items count */}
                                    <span className="text-xs font-bold text-brand-muted hidden sm:block flex-shrink-0">
                                        {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                                    </span>

                                    {/* Total */}
                                    <span className="text-sm font-black text-brand-dark flex-shrink-0">
                                        ₹{order.totalAmount}
                                    </span>

                                    {/* Status badge */}
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex-shrink-0 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                        {order.status.replace(/_/g, ' ')}
                                    </span>

                                    {/* Time */}
                                    <span className="text-[10px] text-brand-muted hidden md:block flex-shrink-0">
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>

                                    {/* Expand chevron */}
                                    {expandedId === order._id
                                        ? <ChevronUp size={16} className="text-slate-300 flex-shrink-0" />
                                        : <ChevronDown size={16} className="text-slate-300 flex-shrink-0" />
                                    }
                                </div>

                                {/* Expanded Detail */}
                                <AnimatePresence>
                                    {expandedId === order._id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-5 pt-1 bg-gray-50/50 border-t border-gray-100">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">

                                                    {/* Items */}
                                                    <div>
                                                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2">Items</p>
                                                        <ul className="space-y-1">
                                                            {order.items?.map((item, i) => (
                                                                <li key={i} className="text-xs font-bold text-brand-dark flex justify-between">
                                                                    <span>{item.name} × {item.quantity}</span>
                                                                    <span className="text-brand-muted">₹{item.price * item.quantity}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {order.specialInstructions && (
                                                            <p className="text-[10px] text-slate-400 mt-2 italic">"{order.specialInstructions}"</p>
                                                        )}
                                                    </div>

                                                    {/* Delivery Address */}
                                                    <div>
                                                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2">Delivery To</p>
                                                        <p className="text-xs font-bold text-brand-dark">{order.customerId?.name}</p>
                                                        <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                                                            {order.deliveryAddress?.fullAddress}
                                                        </p>
                                                        {order.vendorId && (
                                                            <p className="text-[10px] font-bold text-brand-muted mt-2">
                                                                🏪 Store: {order.vendorId?.name}
                                                            </p>
                                                        )}
                                                        {order.driverId && (
                                                            <p className="text-[10px] font-bold text-indigo-600 mt-1">
                                                                🛵 Driver: {order.driverId?.name}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Status Actions */}
                                                    <div>
                                                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2">Actions</p>
                                                        <div className="space-y-2">
                                                            {NEXT_STATUS[order.status] && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order._id, NEXT_STATUS[order.status]); }}
                                                                    disabled={updatingId === order._id}
                                                                    className="w-full bg-brand-dark text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50"
                                                                >
                                                                    {updatingId === order._id ? '...' : `Move to ${NEXT_STATUS[order.status].replace(/_/g, ' ')}`}
                                                                </button>
                                                            )}
                                                            {(order.status === 'placed' || order.status === 'accepted') && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order._id, 'cancelled'); }}
                                                                    disabled={updatingId === order._id}
                                                                    className="w-full bg-white border border-red-100 text-red-500 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50"
                                                                >
                                                                    Cancel Order
                                                                </button>
                                                            )}
                                                            {order.status === 'delivered' && (
                                                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2.5 rounded-xl">
                                                                    <span className="text-[10px] font-black uppercase">✓ Delivered</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="w-10 h-10 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center text-brand-muted hover:text-secondary hover:border-gray-200 transition-all disabled:opacity-30"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-xs font-black text-brand-muted">
                        {page} / {pages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(pages, p + 1))}
                        disabled={page === pages || loading}
                        className="w-10 h-10 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center text-brand-muted hover:text-secondary hover:border-gray-200 transition-all disabled:opacity-30"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
