import { useState, useEffect } from 'react';
import { Package, Clock, User, Phone, MapPin, CheckCircle, XCircle, Store, Users, ShoppingBag, LayoutDashboard, LogOut, FolderTree, BarChart3, Tag, FileText, Settings, Truck, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import ProductManagement from '../components/ProductManagement';
import StoreManagement from '../components/StoreManagement';
import UserManagement from '../components/UserManagement';
import CategoryManagement from '../components/CategoryManagement';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import CustomerManagement from '../components/CustomerManagement';
import CouponManagement from '../components/CouponManagement';
import AuditLogViewer from '../components/AuditLogViewer';
import SettingsPanel from '../components/SettingsPanel';
import DeliveryPricingPanel from '../components/DeliveryPricingPanel';
import DriverManagement from '../components/DriverManagement';

export default function VendorDashboard() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderFilter, setOrderFilter] = useState('all');

    // Quick stats
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0 });

    useEffect(() => {
        if (activeTab === 'orders' || activeTab === 'overview') {
            fetchOrders();
            fetchDrivers();
        }

        // Socket.io Real-time Connection for Vendors/Admins
        const token = localStorage.getItem('mubarak_token');
        if (!token) return;

        const socketUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin.replace('5173', '5000');
        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('🔗 Vendor/Admin Real-time connected');
        });

        socket.on('new-order', (data) => {
            console.log('Live new order received:', data);
            toast.success(`🚨 New Order Received! #${data.orderId?.slice(-6) || ''}`, {
                icon: '🛍️',
                style: { borderRadius: '16px', fontWeight: 'bold' },
                autoClose: 5000,
            });
            // Refresh orders if we are looking at them or overview
            if (activeTab === 'orders' || activeTab === 'overview') {
                fetchOrders();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [activeTab, orderFilter]);

    const fetchOrders = async () => {
        try {
            const statusParam = orderFilter !== 'all' ? `?status=${orderFilter}` : '';
            const endpoint = user.role === 'admin' ? `/orders${statusParam}` : `/orders/vendor/store-orders${statusParam}`;
            const response = await API.get(endpoint);
            const data = response.data.data || [];
            setOrders(data);

            // Calculate stats
            setStats({
                totalOrders: data.length,
                totalRevenue: data.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
                pendingOrders: data.filter(o => o.status === 'placed').length,
            });
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        if (user.role !== 'vendor') return;
        try {
            const response = await API.get('/auth/users');
            // Safely compare vendorId whether it's an object or string
            const storeDrivers = response.data.data.filter(u =>
                u.role === 'driver' &&
                u.vendorId &&
                user.vendorId &&
                u.vendorId.toString() === user.vendorId.toString()
            );
            setDrivers(storeDrivers.length > 0 ? storeDrivers : response.data.data.filter(u => u.role === 'driver'));
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        try {
            await API.put(`/orders/${orderId}/status`, { status });
            fetchOrders();
        } catch (error) {
            alert('Failed to update status');
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

    const handleSignOut = () => {
        logout();
        navigate('/staff-login');
    };

    const getStatusColor = (status) => {
        const colors = {
            placed: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-blue-100 text-blue-800',
            out_for_delivery: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3, roles: ['admin'] },
        { id: 'orders', label: 'Orders', icon: ShoppingBag, roles: ['vendor'] },
        { id: 'products', label: user.role === 'vendor' ? 'Inventory' : 'Products', icon: Package, roles: ['admin', 'vendor'] },
        { id: 'coupons', label: 'Coupons', icon: Tag, roles: ['vendor'] },
        { id: 'drivers', label: 'Delivery Boys', icon: Navigation, roles: ['vendor'] },
        { id: 'delivery-pricing', label: 'Delivery', icon: Truck, roles: ['vendor'] },
        { id: 'categories', label: 'Categories', icon: FolderTree, roles: ['admin'] },
        { id: 'stores', label: 'Stores', icon: Store, roles: ['admin'] },
        { id: 'customers', label: 'Customers', icon: Users, roles: ['admin'] },
        { id: 'users', label: 'Staff/Vendors', icon: Users, roles: ['admin'] },
        { id: 'audit-logs', label: 'Audit Logs', icon: FileText, roles: ['admin'] },
        { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
    ].filter(tab => tab.roles.includes(user.role));

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">
            {/* Sidebar — Desktop: full sidebar | Mobile: compact header + icon tabs */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-100 md:sticky md:top-0 md:h-screen md:flex md:flex-col">
                {/* Brand header */}
                <div className="flex items-center justify-between px-4 py-3 md:p-6 md:pb-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-[#D11243]'}`}>
                            <LayoutDashboard className="text-white" size={18} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black text-secondary leading-none">MUBARAK</h2>
                            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-indigo-600' : 'text-[#D11243]'}`}>
                                {user.role === 'admin' ? 'Admin Panel' : 'Vendor Panel'}
                            </span>
                        </div>
                    </div>
                    {/* Mobile: sign out inline */}
                    <button
                        onClick={handleSignOut}
                        className="md:hidden w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-red-400"
                    >
                        <LogOut size={16} />
                    </button>
                </div>

                {/* Desktop: Back to Store */}
                <div className="hidden md:block px-6 py-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-secondary hover:bg-gray-50 transition-all"
                    >
                        ← Back to Store
                    </button>
                </div>

                {/* Navigation tabs */}
                <nav className="flex md:flex-col gap-1 md:gap-2 overflow-x-auto md:overflow-visible px-3 md:px-4 py-2 md:py-0 md:flex-1 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                ? 'bg-[#D11243] text-white shadow-lg shadow-[#D11243]/20'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-secondary'
                                }`}
                        >
                            <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
                            <span className="hidden md:inline">{tab.label}</span>
                            <span className="md:hidden text-[10px]">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Desktop: user info and sign out */}
                <div className="mt-auto hidden md:flex flex-col gap-3 p-6 pt-4">
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Signed in as</p>
                        <p className="text-xs font-bold text-secondary truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 transition-all border border-red-100"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-10 max-w-6xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {/* Overview / Dashboard Tab (Admin) */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <AnalyticsDashboard />
                        </motion.div>
                    )}

                    {activeTab === 'orders' && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                <div>
                                    <h1 className="text-2xl font-black text-brand-dark">Live Orders</h1>
                                    <p className="text-sm text-brand-muted font-medium">Manage incoming orders and fulfillment</p>
                                </div>
                                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                                    {['all', 'placed', 'accepted', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setOrderFilter(status)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${orderFilter === status
                                                ? 'bg-brand-dark text-white'
                                                : 'bg-white text-brand-muted border border-gray-100 hover:border-brand-red/30'
                                                }`}
                                        >
                                            {status.replace(/_/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {orders.length === 0 ? (
                                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShoppingBag className="text-gray-300" />
                                        </div>
                                        <p className="text-brand-muted font-bold">No orders found in this category</p>
                                    </div>
                                ) : (
                                    orders.map((order) => (
                                        <motion.div
                                            key={order._id}
                                            layout
                                            className="bg-white rounded-3xl shadow-sm border border-gray-50 p-6 md:p-8"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                                <div className="space-y-4 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-black text-brand-red bg-brand-red/5 px-3 py-1 rounded-full uppercase tracking-tighter">
                                                            #{order._id.slice(-6)}
                                                        </span>
                                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                                            {order.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="text-[10px] font-black text-brand-muted uppercase">Items</p>
                                                                {user.role === 'admin' && order.vendorId && (
                                                                    <span className="text-[9px] bg-brand-bg text-brand-dark px-2 py-0.5 rounded-full font-bold">
                                                                        🏪 {order.vendorId.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <ul className="space-y-1">
                                                                {order.items.map((item, i) => (
                                                                    <li key={i} className="text-sm font-bold text-brand-dark flex justify-between">
                                                                        <span>{item.name} × {item.quantity}</span>
                                                                        <span className="text-brand-muted">₹{item.price * item.quantity}</span>
                                                                    </li>
                                                                ))}
                                                                <li className="pt-2 border-t border-gray-50 flex justify-between font-black text-brand-dark">
                                                                    <span>Total</span>
                                                                    <span>₹{order.totalAmount}</span>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-brand-muted uppercase mb-2">Customer / Address</p>
                                                            <div className="text-sm space-y-1">
                                                                <p className="font-bold text-brand-dark">{order.customerId?.name || 'Guest User'}</p>
                                                                <p className="text-brand-muted font-medium flex items-center gap-1"><Phone size={12} /> {order.customerId?.phone}</p>
                                                                <p className="text-brand-muted text-xs leading-relaxed mt-2 flex items-start gap-1">
                                                                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                                                    {order.deliveryAddress?.fullAddress}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-64 space-y-3">
                                                    {order.status === 'placed' && user.role === 'vendor' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'accepted')}
                                                            className="w-full bg-brand-red text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-red/20 hover:bg-red-700 transition-all"
                                                        >
                                                            Accept Order
                                                        </button>
                                                    )}

                                                    {/* Driver Assignment Section — only after accepting */}
                                                    {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'placed' && (
                                                        <div className="bg-brand-bg rounded-2xl p-4 space-y-3">
                                                            <p className="text-[10px] font-black text-brand-muted uppercase">Delivery Partner</p>
                                                            {order.driverId ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-brand-red shadow-sm">
                                                                        <User size={14} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-[10px] font-bold text-brand-dark leading-none">{order.driverId.name || 'Assigned'}</p>
                                                                        <p className="text-[9px] text-green-600 font-bold uppercase mt-0.5">Assigned</p>
                                                                    </div>
                                                                </div>
                                                            ) : user.role === 'vendor' ? (
                                                                <div className="space-y-2">
                                                                    <select
                                                                        className="w-full bg-white rounded-xl px-3 py-2 text-[10px] font-bold outline-none border border-gray-100"
                                                                        onChange={(e) => handleAssignDriver(order._id, e.target.value)}
                                                                        value=""
                                                                    >
                                                                        <option value="" disabled>Assign Partner</option>
                                                                        {drivers.map(d => (
                                                                            <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] font-bold text-gray-400">Not assigned yet</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {(order.status === 'placed' || order.status === 'accepted') && user.role === 'vendor' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                                                            className="w-full bg-white text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-red-100 hover:bg-red-50 transition-all"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'products' && (
                        <motion.div
                            key="products"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <ProductManagement storeId={user.vendorId} />
                        </motion.div>
                    )}

                    {activeTab === 'categories' && (
                        <motion.div
                            key="categories"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <CategoryManagement />
                        </motion.div>
                    )}

                    {activeTab === 'stores' && (
                        <motion.div
                            key="stores"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <StoreManagement />
                        </motion.div>
                    )}

                    {activeTab === 'customers' && (
                        <motion.div
                            key="customers"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <CustomerManagement />
                        </motion.div>
                    )}

                    {activeTab === 'coupons' && (
                        <motion.div
                            key="coupons"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <CouponManagement />
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <UserManagement />
                        </motion.div>
                    )}

                    {activeTab === 'audit-logs' && (
                        <motion.div
                            key="audit-logs"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <AuditLogViewer />
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <SettingsPanel />
                        </motion.div>
                    )}

                    {activeTab === 'delivery-pricing' && (
                        <motion.div
                            key="delivery-pricing"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <DeliveryPricingPanel storeId={user.vendorId} />
                        </motion.div>
                    )}

                    {activeTab === 'drivers' && (
                        <motion.div
                            key="drivers"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <DriverManagement />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

