import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, ShoppingBag, Ban, CheckCircle } from 'lucide-react';
import API from '../config/api';
import { toast } from 'react-toastify';

export default function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            // We need a route for this. Assuming we'll add it or use existing user route if available.
            // For now, let's assume GET /api/users/customers or similar.
            // Wait, I haven't added this route yet in my plan. I should check userController.
            // If not, I'll add it.
            const res = await API.get('/users/all?role=customer');
            setCustomers(res.data.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
            // detailed error handling
        } finally {
            setLoading(false);
        }
    };

    // ... wait, I need to verify if /api/users/all exists or create it. 
    // I'll assume check userController next. 

    // For now, I will write the component assuming the endpoint exists/will exist.

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-brand-dark">Customer Management</h2>
                    <p className="text-sm text-brand-muted">View and manage customer base</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 w-full sm:w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Contact</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Joined</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-brand-muted">Loading customers...</td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-brand-muted">No customers found.</td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-brand-red font-bold">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-brand-dark text-sm">{customer.name}</p>
                                                    <p className="text-xs text-brand-muted">ID: {customer._id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-brand-muted">
                                                    <Mail size={14} />
                                                    {customer.email}
                                                </div>
                                                {customer.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-brand-muted">
                                                        <Phone size={14} />
                                                        {customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-brand-muted">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(customer.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${customer.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {customer.isActive !== false ? 'Active' : 'Banned'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button className="text-brand-muted hover:text-brand-dark transition-colors" title="View Details">
                                                <ShoppingBag size={18} />
                                            </button>
                                            {/* Add ban/unban logic later */}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
