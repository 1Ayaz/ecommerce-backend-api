import { useState, useEffect } from 'react';
import { Save, Settings, Shield, DollarSign, Power, Image, Trash2, Plus, GripVertical, Loader2 } from 'lucide-react';
import API from '../config/api';
import { toast } from 'react-toastify';

export default function SettingsPanel() {
    const [settings, setSettings] = useState({
        siteName: '',
        supportEmail: '',
        supportPhone: '',
        deliveryFee: 0,
        freeDeliveryThreshold: 0,
        taxRate: 0,
        platformServiceFee: 0,
        commissionPercentage: 0,
        maintenanceMode: false,
        allowRegistrations: true,
        logoUrl: '',
        banners: [],
        paymentMethods: {
            codEnabled: true,
            mockUpiEnabled: true,
            upiEnabled: false,
            cardEnabled: false,
            walletEnabled: false,
        }
    });
    const [loading, setLoading] = useState(true);
    const [savingBanners, setSavingBanners] = useState(false);
    const [savingLogo, setSavingLogo] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await API.get('/settings');
            setSettings(res.data.data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await API.put('/settings', settings);
            toast.success('Settings updated successfully');
        } catch (error) {
            toast.error('Failed to update settings');
        }
    };

    const handleSaveBanners = async () => {
        setSavingBanners(true);
        try {
            await API.put('/settings/banners', { banners: settings.banners });
            toast.success('Banners updated!');
        } catch (error) {
            toast.error('Failed to update banners');
        } finally {
            setSavingBanners(false);
        }
    };

    const handleSaveLogo = async () => {
        setSavingLogo(true);
        try {
            await API.put('/settings/logo', { logoUrl: settings.logoUrl });
            toast.success('Logo updated!');
        } catch (error) {
            toast.error('Failed to update logo');
        } finally {
            setSavingLogo(false);
        }
    };

    const addBanner = () => {
        setSettings(prev => ({
            ...prev,
            banners: [...(prev.banners || []), { imageUrl: '', linkUrl: '', title: '', isActive: true, order: (prev.banners?.length || 0) }]
        }));
    };

    const removeBanner = (index) => {
        setSettings(prev => ({
            ...prev,
            banners: prev.banners.filter((_, i) => i !== index)
        }));
    };

    const updateBanner = (index, field, value) => {
        setSettings(prev => ({
            ...prev,
            banners: prev.banners.map((b, i) => i === index ? { ...b, [field]: value } : b)
        }));
    };

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#D11243]" size={24} />
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center text-white">
                    <Settings size={20} />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-brand-dark">System Settings</h2>
                    <p className="text-xs text-brand-muted">Configure application parameters, branding & banners</p>
                </div>
            </div>

            {/* ═══ Logo Management ═══ */}
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-base font-black text-brand-dark flex items-center gap-2">
                    <Image size={18} className="text-blue-500" /> Logo
                </h3>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    {settings.logoUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    )}
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Logo URL</label>
                        <input
                            type="url"
                            value={settings.logoUrl || ''}
                            onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                            placeholder="https://example.com/logo.png"
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#D11243] outline-none text-sm"
                        />
                    </div>
                    <button onClick={handleSaveLogo} disabled={savingLogo}
                        className="flex items-center gap-2 bg-[#D11243] text-white px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 whitespace-nowrap">
                        {savingLogo ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Logo
                    </button>
                </div>
            </div>

            {/* ═══ Banner Management ═══ */}
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-brand-dark flex items-center gap-2">
                        <Image size={18} className="text-emerald-500" /> Hero Banners
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={addBanner}
                            className="flex items-center gap-1 text-xs font-bold text-[#D11243] hover:underline">
                            <Plus size={14} /> Add Banner
                        </button>
                        <button onClick={handleSaveBanners} disabled={savingBanners}
                            className="flex items-center gap-2 bg-[#D11243] text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">
                            {savingBanners ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                        </button>
                    </div>
                </div>

                {(!settings.banners || settings.banners.length === 0) && (
                    <p className="text-sm text-brand-muted text-center py-6">No banners yet. Add one to display on the homepage.</p>
                )}

                <div className="space-y-3">
                    {(settings.banners || []).map((banner, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3 relative">
                            <div className="flex items-center gap-2 mb-1">
                                <GripVertical size={14} className="text-gray-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Banner {i + 1}</span>
                                <button onClick={() => removeBanner(i)} className="ml-auto text-red-400 hover:text-red-600">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Image URL</label>
                                    <input type="url" value={banner.imageUrl}
                                        onChange={e => updateBanner(i, 'imageUrl', e.target.value)}
                                        placeholder="https://..."
                                        className="w-full p-2.5 bg-white rounded-lg border border-gray-100 text-xs outline-none focus:border-[#D11243]" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Link URL</label>
                                    <input type="url" value={banner.linkUrl}
                                        onChange={e => updateBanner(i, 'linkUrl', e.target.value)}
                                        placeholder="/categories"
                                        className="w-full p-2.5 bg-white rounded-lg border border-gray-100 text-xs outline-none focus:border-[#D11243]" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Title (optional)</label>
                                    <input type="text" value={banner.title || ''}
                                        onChange={e => updateBanner(i, 'title', e.target.value)}
                                        className="w-full p-2.5 bg-white rounded-lg border border-gray-100 text-xs outline-none focus:border-[#D11243]" />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer mt-4">
                                    <input type="checkbox" checked={banner.isActive}
                                        onChange={e => updateBanner(i, 'isActive', e.target.checked)}
                                        className="w-4 h-4 rounded text-[#D11243]" />
                                    <span className="text-xs font-bold text-secondary">Active</span>
                                </label>
                            </div>
                            {banner.imageUrl && (
                                <div className="w-full h-24 md:h-32 rounded-lg overflow-hidden bg-gray-100">
                                    <img src={banner.imageUrl} alt={banner.title || `Banner ${i + 1}`}
                                        className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ General + Financial Settings ═══ */}
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-black text-brand-dark flex items-center gap-2">
                        <Shield size={18} className="text-brand-red" /> General
                    </h3>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Site Name</label>
                        <input type="text" value={settings.siteName}
                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#D11243] outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Support Email</label>
                        <input type="email" value={settings.supportEmail}
                            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#D11243] outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Support Phone</label>
                        <input type="text" value={settings.supportPhone}
                            onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#D11243] outline-none text-sm" />
                    </div>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-black text-brand-dark flex items-center gap-2">
                        <DollarSign size={18} className="text-brand-red" /> Tax
                    </h3>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Tax Rate (%)</label>
                        <p className="text-[9px] text-slate-400 mb-1">Applied to every order's item total</p>
                        <input type="number" min="0" step="0.1" value={settings.taxRate}
                            onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#D11243] outline-none text-sm" />
                    </div>
                </div>

                {/* ═══ Platform Fees ═══ */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-black text-brand-dark flex items-center gap-2">
                        <DollarSign size={18} className="text-emerald-500" /> Platform Fees
                    </h3>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Platform Service Fee (₹)</label>
                        <p className="text-[9px] text-slate-400 mb-1">Flat fee added to every order by the platform</p>
                        <input type="number" min="0" value={settings.platformServiceFee || 0}
                            onChange={(e) => setSettings({ ...settings, platformServiceFee: Number(e.target.value) })}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#D11243] outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Commission (%)</label>
                        <p className="text-[9px] text-slate-400 mb-1">Percentage of order total taken by platform from vendor payout</p>
                        <input type="number" min="0" max="100" step="0.1" value={settings.commissionPercentage || 0}
                            onChange={(e) => setSettings({ ...settings, commissionPercentage: Number(e.target.value) })}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#D11243] outline-none text-sm" />
                    </div>
                </div>

                {/* ═══ Payment Methods ═══ */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 md:col-span-2">
                    <h3 className="text-base font-black text-brand-dark flex items-center gap-2">
                        <Shield size={18} className="text-indigo-500" /> Payment Methods
                    </h3>
                    <p className="text-xs text-slate-400">Toggle which payment options customers see at checkout</p>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                        {[
                            { key: 'codEnabled', label: 'Cash on Delivery (COD)' },
                            { key: 'mockUpiEnabled', label: 'Mock UPI (Test Mode)' },
                            { key: 'upiEnabled', label: 'Real UPI' },
                            { key: 'cardEnabled', label: 'Credit / Debit Card' },
                            { key: 'walletEnabled', label: 'Wallet' },
                        ].map(pm => (
                            <label key={pm.key} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={settings.paymentMethods?.[pm.key] ?? false}
                                    onChange={e => setSettings(s => ({
                                        ...s,
                                        paymentMethods: { ...s.paymentMethods, [pm.key]: e.target.checked }
                                    }))}
                                    className="w-5 h-5 rounded text-[#D11243]" />
                                <span className="font-bold text-sm text-brand-dark">{pm.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 md:col-span-2">
                    <h3 className="text-base font-black text-brand-dark flex items-center gap-2">
                        <Power size={18} className="text-brand-red" /> System Controls
                    </h3>
                    <div className="flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={settings.maintenanceMode}
                                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                className="w-5 h-5 rounded text-brand-red" />
                            <span className="font-bold text-sm text-brand-dark">Maintenance Mode</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={settings.allowRegistrations}
                                onChange={(e) => setSettings({ ...settings, allowRegistrations: e.target.checked })}
                                className="w-5 h-5 rounded text-brand-red" />
                            <span className="font-bold text-sm text-brand-dark">Allow Registrations</span>
                        </label>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <button type="submit"
                        className="w-full bg-brand-dark text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-brand-dark/90 transition-all flex items-center justify-center gap-2 text-sm">
                        <Save size={18} /> Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
