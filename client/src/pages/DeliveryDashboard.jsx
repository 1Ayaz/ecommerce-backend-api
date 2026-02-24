import { useState, useEffect } from 'react';
import { Package, MapPin, Phone, MessageCircle, User, CheckCircle, LogOut, Home, IndianRupee, Power, Clock, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

export default function DeliveryDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);
    const [earnings, setEarnings] = useState({ todayDeliveries: 0, todayEarnings: 0, weeklyEarnings: 0 });
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    const [showTripHistory, setShowTripHistory] = useState(false);

    // OTP Modal State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [otpInput, setOtpInput] = useState('');

    useEffect(() => {
        fetchOrders();
        fetchEarnings();
        fetchDeliveredOrders();

        // Socket.io Real-time Connection for Drivers
        const token = localStorage.getItem('mubarak_token');
        if (!token || !isOnline) return;

        const socketUrl = import.meta.env.VITE_SOCKET_URL
            || (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
            || window.location.origin.replace('5173', '5000');
        const socket = io(socketUrl, {
            auth: { token },
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('🔗 Driver Real-time connected');
        });

        socket.on('delivery-assigned', (data) => {
            console.log('Live delivery assigned:', data);
            toast.success(`🛵 New Delivery Assigned! #${data.orderId?.slice(-6) || ''}`, {
                icon: '🛵',
                style: { borderRadius: '16px', fontWeight: 'bold' },
                autoClose: 6000,
            });
            fetchOrders(); // Immediately pull new assignment
        });

        // Polling fallback just in case
        const interval = setInterval(() => {
            if (isOnline) fetchOrders();
        }, 30000);

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [isOnline]);

    const fetchOrders = async () => {
        try {
            if (!isOnline) {
                setOrders([]);
                setLoading(false);
                return;
            }
            const response = await API.get('/delivery/orders');
            setOrders(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEarnings = async () => {
        try {
            const response = await API.get('/delivery/earnings');
            if (response.data.success) {
                setEarnings(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch earnings:', error);
        }
    };

    const fetchDeliveredOrders = async () => {
        try {
            const response = await API.get('/delivery/orders?status=delivered');
            setDeliveredOrders(response.data.data || []);
        } catch (error) {
            // silently fail — trip history is supplementary
            console.error('Failed to fetch trip history:', error);
        }
    };

    const handleToggleOnline = async () => {
        try {
            const response = await API.put('/delivery/online');
            setIsOnline(response.data.isOnline);
            if (!response.data.isOnline) {
                setOrders([]); // Clear assigned orders from view if going offline
            } else {
                fetchOrders();
            }
            toast.success(response.data.isOnline ? "You are now Online" : "You are now Offline");
        } catch (error) {
            toast.error("Failed to toggle online status");
        }
    };

    const handleUpdateStatus = async (orderId, newStatus, otp = null) => {
        try {
            await API.put(`/delivery/orders/${orderId}/status`, { status: newStatus, otp });

            if (newStatus === 'delivered') {
                toast.success('Order delivered successfully!');
                setShowOtpModal(false);
                setOtpInput('');
                setSelectedOrder(null);
                fetchEarnings(); // Refresh earnings after delivery
            } else {
                toast.success('Status updated successfully!');
            }

            fetchOrders();
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update status';
            toast.error(message);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            assigned: 'bg-yellow-100 text-yellow-800',
            picked_up: 'bg-blue-100 text-blue-800',
            out_for_delivery: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getNextStatusInfo = (currentStatus) => {
        const flow = {
            assigned: { next: 'out_for_delivery', label: 'Mark Picked Up (Out for Delivery)' },
            picked_up: { next: 'out_for_delivery', label: 'Start Delivery' }, // Fallback for old orders
            out_for_delivery: { next: 'delivered', label: 'Deliver Order' },
        };
        return flow[currentStatus];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20 md:pb-8">
            {/* Header with navigation */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center shadow-md">
                            <Package className="text-white" size={16} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-brand-dark leading-none">Delivery Partner</h1>
                            <p className="text-[10px] text-brand-muted font-bold mt-0.5">{user?.name || 'Driver'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleOnline}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isOnline ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}
                        >
                            <Power size={14} /> {isOnline ? 'Online' : 'Offline'}
                        </button>
                        <button
                            onClick={() => { logout(); navigate('/staff-login'); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-4 space-y-4">
                {/* Earnings Summary Widget */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Today's Trips</p>
                        <p className="text-xl font-black text-brand-dark mt-1">{earnings.todayDeliveries}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Today's Earnings</p>
                        <div className="flex items-center gap-1 mt-1 text-green-600">
                            <IndianRupee size={16} />
                            <p className="text-xl font-black">{earnings.todayEarnings}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Weekly Earnings</p>
                        <div className="flex items-center gap-1 mt-1 text-blue-600">
                            <IndianRupee size={16} />
                            <p className="text-xl font-black">{earnings.weeklyEarnings}</p>
                        </div>
                    </div>
                </div>

                {/* Trip History — clickable stat card */}
                <div className="mt-1">
                    <button
                        onClick={() => setShowTripHistory(!showTripHistory)}
                        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Clock size={18} className="text-indigo-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-secondary">Trip History</p>
                                <p className="text-[10px] text-slate-400 font-medium">{deliveredOrders.length} completed deliveries</p>
                            </div>
                        </div>
                        <ChevronDown size={18} className={`text-slate-300 transition-transform ${showTripHistory ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showTripHistory && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-2 pt-3">
                                    {deliveredOrders.length === 0 ? (
                                        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                                            <p className="text-slate-400 text-sm font-medium">No completed trips yet</p>
                                        </div>
                                    ) : (
                                        deliveredOrders.map((trip) => (
                                            <div key={trip._id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle size={14} className="text-green-500" />
                                                        <span className="text-xs font-bold text-secondary">#{trip._id.slice(-6)}</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-green-600">₹{trip.totalAmount}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium truncate">
                                                    {trip.customerId?.name || 'Customer'} • {trip.deliveryAddress?.fullAddress?.slice(0, 40) || 'Address'}...
                                                </p>
                                                <p className="text-[10px] text-slate-300 font-medium mt-1">
                                                    {trip.updatedAt ? new Date(trip.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {!isOnline ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 mt-6">
                        <Power className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-black text-brand-dark mb-2">You are Offline</h2>
                        <p className="text-sm font-medium text-slate-500">Go online to receive new delivery assignments.</p>
                        <button
                            onClick={handleToggleOnline}
                            className="mt-6 px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20"
                        >
                            Go Online Now
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 mt-6">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h2 className="text-lg font-black text-brand-dark mb-2">No Active Orders</h2>
                                <p className="text-sm font-medium text-slate-500">Waiting for new assignments...</p>
                            </div>
                        ) : (
                            orders.map((order) => {
                                const nextStep = getNextStatusInfo(order.status);
                                return (
                                    <motion.div
                                        key={order._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                                    >
                                        {/* Order Header */}
                                        <div className="p-5 border-b border-gray-50 flex justify-between items-start bg-slate-50/50">
                                            <div>
                                                <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)} mb-2 inline-block`}>
                                                    {order.status.replace(/_/g, ' ')}
                                                </span>
                                                <h3 className="font-bold text-brand-dark">Order #{order._id.slice(-6)}</h3>
                                            </div>
                                            <div className="text-right">
                                                {/* COD Tag */}
                                                {order.paymentMethod === 'COD' ? (
                                                    <div className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-right">
                                                        <p className="text-[10px] font-black tracking-widest uppercase">Collect Cash</p>
                                                        <p className="font-black text-lg">₹{order.totalAmount}</p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg text-right">
                                                        <p className="text-[10px] font-black tracking-widest uppercase">Prepaid</p>
                                                        <p className="font-black text-lg">₹{order.totalAmount}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-5">
                                            {/* Customer Info */}
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deliver To</p>
                                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-red shadow-sm flex-shrink-0">
                                                        <User size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-brand-dark text-sm">{order.customerId?.name || 'Customer'}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a
                                                            href={`tel:${order.customerId?.phone}`}
                                                            className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                        >
                                                            <Phone size={18} />
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/91${order.customerId?.phone}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors"
                                                        >
                                                            <MessageCircle size={18} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Address Info */}
                                            <div>
                                                <div className="flex gap-3">
                                                    <div className="mt-1 flex-shrink-0">
                                                        <MapPin className="text-brand-red" size={20} />
                                                    </div>
                                                    <div>
                                                        {order.deliveryAddress?.doorNumber && (
                                                            <p className="font-bold text-brand-dark text-sm mb-0.5">
                                                                Door: {order.deliveryAddress.doorNumber}
                                                                {order.deliveryAddress.floor && <span className="text-slate-500 font-medium"> • Floor {order.deliveryAddress.floor}</span>}
                                                            </p>
                                                        )}
                                                        {order.deliveryAddress?.landmark && (
                                                            <p className="text-xs font-semibold text-brand-dark mb-1">
                                                                📍 {order.deliveryAddress.landmark}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                            {order.deliveryAddress?.fullAddress}
                                                        </p>

                                                        {/* Google Maps Directions Button */}
                                                        {(() => {
                                                            const lat = order.deliveryAddress?.location?.lat || order.deliveryAddress?.lat;
                                                            const lng = order.deliveryAddress?.location?.lng || order.deliveryAddress?.lng;

                                                            let destination = '';
                                                            if (lat && lng) {
                                                                destination = `${lat},${lng}`;
                                                            } else if (order.deliveryAddress) {
                                                                // Exclude 'flat' and 'doorNumber' from the maps search string 
                                                                // to ensure Google Maps places autocomplete works.
                                                                const parts = [
                                                                    order.deliveryAddress.building, // Maps to Street in Checkout
                                                                    order.deliveryAddress.area,
                                                                    order.deliveryAddress.city,
                                                                    order.deliveryAddress.state,
                                                                    order.deliveryAddress.pincode
                                                                ].filter(Boolean);

                                                                const safeAddress = parts.length > 0 ? parts.join(', ') : order.deliveryAddress.fullAddress;
                                                                destination = safeAddress ? encodeURIComponent(safeAddress) : '';
                                                            }

                                                            if (!destination) return null;

                                                            return (
                                                                <a
                                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-brand-red/5 text-brand-red text-[11px] font-black uppercase tracking-wider rounded-lg hover:bg-brand-red/10 transition-colors"
                                                                >
                                                                    <MapPin size={12} /> Get Directions
                                                                </a>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Items Summary */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Summary</p>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs font-semibold text-brand-dark mb-2 last:mb-0">
                                                        <span>{item.quantity}x {item.name}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Action Button */}
                                            {nextStep && (
                                                <button
                                                    onClick={() => {
                                                        if (nextStep.next === 'delivered') {
                                                            setSelectedOrder(order);
                                                            setShowOtpModal(true);
                                                        } else {
                                                            handleUpdateStatus(order._id, nextStep.next);
                                                        }
                                                    }}
                                                    className="w-full bg-brand-dark hover:bg-black text-white py-4 rounded-xl font-black tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                                                >
                                                    <CheckCircle size={16} />
                                                    {nextStep.label}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* OTP Modal */}
            <AnimatePresence>
                {showOtpModal && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 text-center border-b border-gray-50">
                                <h3 className="text-xl font-black text-brand-dark mb-1">Verify Delivery</h3>
                                <p className="text-xs font-medium text-slate-500">Ask the customer for their 4-digit Delivery PIN</p>
                            </div>

                            <div className="p-6">
                                {selectedOrder.paymentMethod === 'COD' && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-center">
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Collect Cash First</p>
                                        <p className="text-2xl font-black text-brand-dark">₹{selectedOrder.totalAmount}</p>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <input
                                        type="text"
                                        maxLength="4"
                                        placeholder="Enter 4-Digit PIN"
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))} // only numbers
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center text-xl font-black tracking-[0.5em] text-brand-dark focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all placeholder:tracking-normal placeholder:font-medium placeholder:text-sm"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowOtpModal(false);
                                            setOtpInput('');
                                            setSelectedOrder(null);
                                        }}
                                        className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered', otpInput)}
                                        disabled={otpInput.length !== 4}
                                        className="flex-[2] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-green-500 hover:bg-green-600 disabled:bg-green-200 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-500/20"
                                    >
                                        Verify & Deliver
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
