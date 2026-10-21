import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, ShoppingBag, MessageCircle, Copy, Check, Users } from 'lucide-react';
import API from '../config/api';
import { toast } from 'react-toastify';

export default function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await API.get('/users/all?role=customer');
            setCustomers(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch customers', error);
            toast.error('Failed to load customer list');
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.includes(searchTerm))
    );

    const handleCopyAllPhones = () => {
        const phoneList = filteredCustomers
            .map(c => c.phone)
            .filter(Boolean)
            .map(p => p.replace(/\D/g, ''))
            .filter(p => p.length >= 10);

        if (phoneList.length === 0) {
            toast.error('No phone numbers to copy');
            return;
        }

        const text = phoneList.join(', ');
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`Copied ${phoneList.length} numbers for WhatsApp campaign! 📋`);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-brand-dark flex items-center gap-2">
                        <Users className="text-[#D11243]" size={24} /> Customer Database
                    </h2>
                    <p className="text-xs text-brand-muted mt-0.5">
                        {customers.length} total customers · View contact details and run WhatsApp marketing campaigns
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleCopyAllPhones}
                        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 shrink-0"
                        title="Copy all filtered phone numbers to clipboard for WhatsApp Broadcast"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy Numbers for WhatsApp'}
                    </button>

                    <div className="relative flex-1 sm:w-60">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#D11243]/20 w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Phone / Contact</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Orders</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Joined</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider text-right">Quick Contact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-brand-muted text-xs font-medium">Loading customers...</td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-brand-muted text-xs font-medium">No customers found.</td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => {
                                    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
                                    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                                    return (
                                        <tr key={customer._id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-red-50 text-[#D11243] font-black text-xs flex items-center justify-center shrink-0">
                                                        {(customer.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-brand-dark text-sm leading-tight">{customer.name || 'Unnamed Customer'}</p>
                                                        <p className="text-[10px] text-brand-muted">PIN: {customer.deliveryPin || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-0.5">
                                                    {customer.phone ? (
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                                                            <Phone size={13} className="text-gray-400" />
                                                            +{customer.phone}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No phone</span>
                                                    )}
                                                    {customer.email && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-brand-muted">
                                                            <Mail size={12} className="text-gray-400" />
                                                            {customer.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs">
                                                    <span className="font-black text-brand-dark">{customer.orderCount ?? '—'}</span>
                                                    <span className="text-brand-muted text-[10px] ml-1">orders</span>
                                                    {customer.totalSpent ? (
                                                        <p className="text-[10px] font-bold text-emerald-600">₹{customer.totalSpent.toFixed(0)} spent</p>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-brand-muted">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-gray-400" />
                                                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                {cleanPhone ? (
                                                    <a
                                                        href={`https://wa.me/${fullPhone}?text=${encodeURIComponent(`Hello ${customer.name || ''}, greetings from The Fresh Cuts!`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all"
                                                        title="Message customer on WhatsApp"
                                                    >
                                                        <MessageCircle size={14} /> WhatsApp
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
