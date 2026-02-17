import { useState, useEffect } from 'react';
import { Package, Clock, User, Phone, MapPin, CheckCircle, XCircle } from 'lucide-react';
import API from '../config/api';
import { motion } from 'framer-motion';

export default function VendorDashboard() {
    const [orders, setOrders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
        fetchDrivers();
    }, [filter]);

    const fetchOrders = async () => {
        try {
            const statusParam = filter !== 'all' ? `?status=${filter}` : '';
            const response = await API.get(`/orders/vendor/store-orders${statusParam}`);
            setOrders(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            // Assuming you have an endpoint to get drivers for the vendor's store
            // For now, we'll skip this or you can add it to the backend
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            await API.put(`/orders/${orderId}/status`, { status: 'accepted' });
            fetchOrders();
        } catch (error) {
            alert('Failed to accept order');
        }
    };

    const handleRejectOrder = async (orderId) => {
        try {
            await API.put(`/orders/${orderId}/status`, { status: 'cancelled' });
            fetchOrders();
        } catch (error) {
            alert('Failed to reject order');
        }
    };

    const handleAssignDriver = async (orderId, driverId) => {
        try {
            await API.put(`/orders/${orderId}/assign-driver`, { driverId });
            fetchOrders();
        } catch (error) {
            alert('Failed to assign driver');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            placed: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-blue-100 text-blue-800',
            cutting: 'bg-purple-100 text-purple-800',
            ready: 'bg-green-100 text-green-800',
            out: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Vendor Dashboard</h1>
                    <p className="text-brand-muted">Manage your store orders</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['all', 'placed', 'accepted', 'cutting', 'ready', 'out', 'delivered'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${filter === status
                                    ? 'bg-brand-red text-white'
                                    : 'bg-white text-brand-muted hover:bg-gray-100'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-brand-muted">No orders found</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-sm p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-brand-dark">
                                                Order #{order._id.slice(-6)}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-brand-muted">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(order.placedAt).toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User size={14} />
                                                {order.customerId?.name || 'Customer'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone size={14} />
                                                {order.customerId?.phone}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-brand-dark">
                                            ₹{order.totalAmount}
                                        </div>
                                        <div className="text-xs text-brand-muted">
                                            {order.items.length} item(s)
                                        </div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="border-t border-gray-100 pt-4 mb-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm mb-2">
                                            <span className="text-brand-dark">
                                                {item.name} x {item.quantity}
                                            </span>
                                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Delivery Address */}
                                <div className="border-t border-gray-100 pt-4 mb-4">
                                    <div className="flex items-start gap-2 text-sm text-brand-muted">
                                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{order.deliveryAddress?.fullAddress}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {order.status === 'placed' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAcceptOrder(order._id)}
                                            className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} />
                                            Accept Order
                                        </button>
                                        <button
                                            onClick={() => handleRejectOrder(order._id)}
                                            className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} />
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {order.status === 'accepted' && !order.driverId && (
                                    <div>
                                        <p className="text-sm text-brand-muted mb-2">Assign delivery boy:</p>
                                        {/* You'll need to fetch and display available drivers here */}
                                        <button className="w-full bg-brand-red text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                                            Assign Driver
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
