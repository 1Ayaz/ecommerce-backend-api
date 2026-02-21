import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ArrowRight, MapPin, Truck, Phone, MessageCircle, MessageSquare, HelpCircle, ChevronRight, Package, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import API from '../config/api';

const STATUS_FLOW = [
    { key: 'placed', label: 'Order Placed', sub: 'Your order has been received', icon: <Package size={20} /> },
    { key: 'accepted', label: 'Order Confirmed', sub: 'Vendor has accepted your order', icon: <CheckCircle size={20} /> },
    { key: 'out_for_delivery', label: 'Out for Delivery', sub: 'Delivery partner is on the way', icon: <Truck size={20} /> },
    { key: 'delivered', label: 'Delivered', sub: 'Order reached your doorstep', icon: <CheckCircle size={20} /> },
];

function getStatusIndex(status) {
    const idx = STATUS_FLOW.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
}

function getProgress(status) {
    const map = {
        'placed': 10,
        'accepted': 35,
        'out_for_delivery': 75,
        'delivered': 100,
    };
    return map[status] || 10;
}

export default function OrderSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, token } = useAuthStore();

    // Get orderId from navigation state or sessionStorage (survives reload)
    const navOrderId = location.state?.orderId;
    const [orderId, setOrderId] = useState(navOrderId || sessionStorage.getItem('lastOrderId'));
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(10);
    const [statusIndex, setStatusIndex] = useState(0);
    const socketRef = useRef(null);

    // Persist orderId for page reloads
    useEffect(() => {
        if (navOrderId) {
            sessionStorage.setItem('lastOrderId', navOrderId);
            setOrderId(navOrderId);
        }
    }, [navOrderId]);

    // Fetch real order status from API
    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                const { data } = await API.get(`/orders/${orderId}`);
                const orderData = data.data;
                setOrder(orderData);
                setStatusIndex(getStatusIndex(orderData.status));
                setProgress(getProgress(orderData.status));
            } catch (err) {
                console.error('Failed to fetch order:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    // Real-time socket updates with JWT auth
    useEffect(() => {
        const localToken = localStorage.getItem('mubarak_token') || token;
        if (!orderId || !localToken) return;

        const socketUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin.replace('5173', '5000');
        const socket = io(socketUrl, {
            auth: { token: localToken },
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect_error', (err) => {
            console.warn('Socket auth failed, falling back to polling:', err.message);
        });

        socket.on('order-update', (data) => {
            if (data.orderId === orderId || data.orderId?.toString() === orderId) {
                const newIdx = getStatusIndex(data.status);
                const newProg = getProgress(data.status);
                setStatusIndex(newIdx);
                setProgress(newProg);

                // Update order data with new status
                setOrder(prev => prev ? { ...prev, status: data.status, statusTimeline: data.statusTimeline || prev.statusTimeline } : prev);
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [orderId, token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-[#D11243]" size={40} />
            </div>
        );
    }

    if (!orderId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-secondary mb-4">No order found</h2>
                    <button onClick={() => navigate('/')} className="bg-[#D11243] text-white font-bold px-6 py-3 rounded-xl">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const currentStatus = order?.status || 'placed';

    return (
        <div className="min-h-screen bg-white pb-32">
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">

                {/* Header Success Section */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8"
                    >
                        <CheckCircle size={48} className="text-emerald-500" strokeWidth={2.5} />
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-5xl font-bold text-secondary mb-4 tracking-tighter"
                    >
                        {currentStatus === 'delivered' ? 'Order Delivered!' : 'Order Placed!'}
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 font-medium"
                    >
                        {currentStatus === 'delivered'
                            ? 'Your fresh chicken has been delivered. Enjoy!'
                            : <>Your fresh build is on its way. Estimated arrival: <span className="text-secondary font-bold">18-20 mins</span></>
                        }
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Left: Real-time Tracker */}
                    <div className="lg:col-span-7 space-y-10">
                        <section className="bg-gray-50/50 rounded-[3rem] p-10 relative overflow-hidden">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Live Status Tracking</h3>

                            {/* Real-time Progress Bar */}
                            <div className="relative mb-12">
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        className="h-full bg-[#D11243] rounded-full"
                                    />
                                </div>
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full flex justify-between px-0.5">
                                    {STATUS_FLOW.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-4 h-4 rounded-full border-4 transition-colors duration-500 ${i <= statusIndex ? 'bg-[#D11243] border-white shadow-md' : 'bg-slate-200 border-white'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="space-y-8">
                                {STATUS_FLOW.map((status, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-6 transition-opacity duration-500 ${i > statusIndex ? 'opacity-30' : 'opacity-100'}`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${i <= statusIndex ? 'bg-white shadow-premium text-[#D11243]' : 'bg-gray-100 text-slate-300'}`}>
                                                {status.icon}
                                            </div>
                                            {i < STATUS_FLOW.length - 1 && <div className={`w-0.5 h-12 my-1 rounded-full ${i < statusIndex ? 'bg-[#D11243]' : 'bg-gray-200'}`} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className="text-base font-bold text-secondary">{status.label}</h4>
                                                {i <= statusIndex && (
                                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">✓ Done</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">{status.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => navigate('/')} className="flex-1 bg-gray-100 border border-gray-200 text-gray-800 font-bold py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                                Home <ArrowRight size={18} />
                            </button>
                            <button onClick={() => navigate('/account')} className="flex-1 bg-[#D11243] text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:bg-[#b00f38] transition-all">
                                My Orders
                            </button>
                        </div>
                    </div>

                    {/* Right: Delivery & Support */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Delivery PIN Card */}
                        {order?.customerId?.deliveryPin && (
                            <section className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100 flex items-center justify-between shadow-sm">
                                <div>
                                    <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <ShieldCheck size={14} /> Delivery PIN
                                    </h3>
                                    <p className="text-sm text-red-900 font-medium">Provide to driver</p>
                                </div>
                                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-red-100 text-2xl font-black tracking-widest text-[#D11243]">
                                    {order.customerId.deliveryPin}
                                </div>
                            </section>
                        )}

                        {/* Delivery Address */}
                        {order?.deliveryAddress && (
                            <section className="bg-white rounded-[2.5rem] shadow-premium p-8 border border-white">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Delivering To</h3>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-[#D11243] shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        {(order.deliveryAddress.flat || order.deliveryAddress.doorNumber) && (
                                            <p className="font-bold text-secondary text-sm">
                                                {order.deliveryAddress.flat || order.deliveryAddress.doorNumber}
                                                {order.deliveryAddress.building && `, ${order.deliveryAddress.building}`}
                                            </p>
                                        )}
                                        <p className="text-sm text-slate-600">
                                            {order.deliveryAddress.fullAddress || [order.deliveryAddress.area, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode].filter(Boolean).join(', ')}
                                        </p>
                                        {order.deliveryAddress.landmark && (
                                            <p className="text-xs text-slate-400 mt-1">📍 Near: {order.deliveryAddress.landmark}</p>
                                        )}
                                        {order.deliveryAddress.phone && (
                                            <p className="text-xs text-slate-400 mt-1">📞 {order.deliveryAddress.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Help Desk */}
                        <section className="bg-white rounded-[2.5rem] shadow-premium p-8 border border-white">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Need Assistance?</h3>
                            <div className="space-y-4">
                                {[
                                    { icon: <HelpCircle size={18} />, label: 'Order Support' },
                                    { icon: <MessageSquare size={18} />, label: 'Feedback' }
                                ].map((item, i) => (
                                    <button key={i} className="w-full flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3 text-secondary font-bold text-sm">
                                            <span className="text-[#D11243]">{item.icon}</span>
                                            {item.label}
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
