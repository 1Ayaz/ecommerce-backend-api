import { useState, useEffect } from 'react';
import { Package, MapPin, Phone, User, CheckCircle } from 'lucide-react';
import API from '../config/api';
import { motion } from 'framer-motion';

export default function DeliveryDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
        // Poll for new orders every 30 seconds
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await API.get('/delivery/orders');
            setOrders(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await API.put(`/delivery/orders/${orderId}/status`, { status: newStatus });
            fetchOrders();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            accepted: 'bg-blue-100 text-blue-800',
            cutting: 'bg-purple-100 text-purple-800',
            ready: 'bg-green-100 text-green-800',
            out: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getNextStatus = (currentStatus) => {
        const flow = {
            accepted: 'cutting',
            cutting: 'ready',
            ready: 'out',
            out: 'delivered',
        };
        return flow[currentStatus];
    };

    const getNextStatusLabel = (currentStatus) => {
        const labels = {
            accepted: 'Start Cutting',
            cutting: 'Mark Ready',
            ready: 'Out for Delivery',
            out: 'Mark Delivered',
        };
        return labels[currentStatus];
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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Delivery Dashboard</h1>
                    <p className="text-brand-muted">Your assigned deliveries</p>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-brand-muted">No deliveries assigned</p>
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

                                {/* Customer Info */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <h3 className="font-semibold text-brand-dark mb-3">Customer Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-brand-muted" />
                                            <span>{order.customerId?.name || 'Customer'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-brand-muted" />
                                            <a
                                                href={`tel:${order.customerId?.phone}`}
                                                className="text-brand-red font-semibold"
                                            >
                                                {order.customerId?.phone}
                                            </a>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <MapPin size={16} className="text-brand-muted mt-0.5 flex-shrink-0" />
                                            <span>{order.deliveryAddress?.fullAddress}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="border-t border-gray-100 pt-4 mb-4">
                                    <h3 className="font-semibold text-brand-dark mb-2">Order Items</h3>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm mb-2">
                                            <span className="text-brand-dark">
                                                {item.name} x {item.quantity}
                                            </span>
                                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Button */}
                                {order.status !== 'delivered' && (
                                    <button
                                        onClick={() => handleUpdateStatus(order._id, getNextStatus(order.status))}
                                        className="w-full bg-brand-red text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        {getNextStatusLabel(order.status)}
                                    </button>
                                )}

                                {order.status === 'delivered' && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-center font-semibold">
                                        ✓ Delivered Successfully
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
