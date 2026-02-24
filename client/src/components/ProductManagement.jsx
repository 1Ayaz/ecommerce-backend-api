import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Package, Loader2, Info, Star, Eye, EyeOff } from 'lucide-react';
import API from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import useAuthStore from '../store/useAuthStore';

export default function ProductManagement({ storeId }) {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';
    const vendorId = storeId || user?.vendorId?._id || user?.vendorId;

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // Default 3 fixed variations
    const DEFAULT_VARIATIONS = [
        { label: '250g Pack', basePrice: 0, discountedPrice: '', stock: 0, sku: '', desc: '', isActive: true },
        { label: '500g Pack', basePrice: 0, discountedPrice: '', stock: 0, sku: '', desc: '', isActive: true },
        { label: '1000g Pack', basePrice: 0, discountedPrice: '', stock: 0, sku: '', desc: '', isActive: true },
    ];

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        shortDescription: '',
        fullDescription: '',
        image: '',
        categoryId: '',
        isFeatured: false,
        showShortDescription: true,
        showFullDescription: true,
        showSellerDetails: false,
        shareEnabled: true,
        wishlistEnabled: true,
        sellerDetails: { name: '', deliveryEstimate: '', location: '', foodLicense: '' },
        variations: DEFAULT_VARIATIONS,
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [vendorId]);

    const fetchProducts = async () => {
        try {
            const url = isAdmin ? '/products' : `/products?vendorId=${vendorId}`;
            const response = await API.get(url);
            setProducts(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await API.get('/products/categories');
            setCategories(response.data.data);
        } catch (error) {
            console.error('Failed to fetch categories');
        }
    };

    const handleVariationChange = (index, field, value) => {
        const updated = [...formData.variations];
        if (['basePrice', 'discountedPrice', 'stock'].includes(field)) {
            updated[index][field] = field === 'discountedPrice' && value === '' ? '' : (parseFloat(value) || 0);
        } else if (field === 'isActive') {
            updated[index][field] = value;
        } else {
            updated[index][field] = value;
        }
        setFormData({ ...formData, variations: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isAdmin) {
                const catalogData = {
                    name: formData.name,
                    description: formData.description,
                    shortDescription: formData.shortDescription,
                    fullDescription: formData.fullDescription,
                    image: formData.image,
                    categoryId: formData.categoryId,
                    isFeatured: formData.isFeatured,
                    showShortDescription: formData.showShortDescription,
                    showFullDescription: formData.showFullDescription,
                    showSellerDetails: formData.showSellerDetails,
                    shareEnabled: formData.shareEnabled,
                    wishlistEnabled: formData.wishlistEnabled,
                    sellerDetails: formData.sellerDetails,
                    variations: formData.variations.map(v => ({
                        label: v.label,
                        basePrice: v.basePrice,
                        discountedPrice: v.discountedPrice || null,
                        stock: v.stock || 0,
                        sku: v.sku || '',
                        desc: v.desc,
                        isActive: v.isActive,
                    })),
                };

                if (isEditing) {
                    await API.put(`/products/${isEditing}`, catalogData);
                    toast.success('Product updated');
                } else {
                    await API.post('/products', catalogData);
                    toast.success('Product added');
                }
            } else {
                // Vendor: override price & stock per variation
                for (const v of formData.variations) {
                    await API.put(`/products/vendor/override/${isEditing}`, {
                        variationLabel: v.label,
                        price: v.basePrice,
                        inStock: v.isActive
                    });
                }
                toast.success('Inventory updated for your store');
            }

            setShowAddForm(false);
            setIsEditing(null);
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setIsEditing(product._id);
        const vars = (product.variations || []).map(v => ({
            label: v.label || '',
            basePrice: v.price || v.basePrice || 0,
            discountedPrice: v.discountedPrice || '',
            stock: v.stock || 0,
            sku: v.sku || '',
            desc: v.desc || '',
            isActive: v.isActive !== undefined ? v.isActive : true,
        }));
        setFormData({
            name: product.name,
            description: product.description || '',
            shortDescription: product.shortDescription || '',
            fullDescription: product.fullDescription || '',
            image: product.image,
            categoryId: product.categoryId?._id || product.categoryId,
            isFeatured: product.isFeatured || false,
            showShortDescription: product.showShortDescription !== false,
            showFullDescription: product.showFullDescription !== false,
            showSellerDetails: product.showSellerDetails || false,
            shareEnabled: product.shareEnabled !== false,
            wishlistEnabled: product.wishlistEnabled !== false,
            sellerDetails: {
                name: product.sellerDetails?.name || '',
                deliveryEstimate: product.sellerDetails?.deliveryEstimate || '',
                location: product.sellerDetails?.location || '',
                foodLicense: product.sellerDetails?.foodLicense || '',
            },
            variations: vars.length > 0 ? vars : DEFAULT_VARIATIONS,
        });
        setShowAddForm(true);
    };

    const handleDelete = async (productId) => {
        if (!isAdmin) return;
        if (!window.confirm('Delete this product from the catalog?')) return;
        try {
            await API.delete(`/products/${productId}`);
            toast.success('Product removed');
            fetchProducts();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', description: '', shortDescription: '', fullDescription: '',
            image: '', categoryId: '', isFeatured: false,
            showShortDescription: true, showFullDescription: true,
            showSellerDetails: false, shareEnabled: true, wishlistEnabled: true,
            sellerDetails: { name: '', deliveryEstimate: '', location: '', foodLicense: '' },
            variations: DEFAULT_VARIATIONS,
        });
    };

    // Toggle helper for form
    const Toggle = ({ label, checked, onChange }) => (
        <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${checked ? 'bg-[#D11243]' : 'bg-gray-300'}`}
                onClick={() => onChange(!checked)}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-brand-muted uppercase">{label}</span>
        </label>
    );

    if (loading && products.length === 0) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-red" size={40} /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-brand-dark">
                        {isAdmin ? 'Catalog Management' : 'Store Inventory'}
                    </h2>
                    <p className="text-xs text-brand-muted font-medium">
                        {isAdmin ? 'Manage global master catalog' : 'Update prices and stock for your store'}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => { setShowAddForm(true); setIsEditing(null); resetForm(); }}
                        className="bg-brand-red text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-brand-red/20 active:scale-95 transition-all"
                    >
                        <Plus size={18} /> Add Product
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h3 className="text-xl font-black text-brand-dark">
                                    {isAdmin ? (isEditing ? 'Edit Product' : 'Add New Product') : 'Update Price & Stock'}
                                </h3>
                                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                                {isAdmin ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-black text-brand-muted uppercase mb-1">Product Name</label>
                                                    <input required className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm font-medium border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Chicken Biryani Cut" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-brand-muted uppercase mb-1">Category</label>
                                                    <select required className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm font-medium border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                                        value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                                                        <option value="">Select Category</option>
                                                        {categories.map(cat => (
                                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-brand-muted uppercase mb-1">Image URL</label>
                                                    <input required className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm font-medium border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                                        value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-black text-brand-muted uppercase mb-1">Description</label>
                                                    <textarea className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm font-medium border-2 border-transparent focus:border-brand-red/10 outline-none transition-all h-[80px]"
                                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Fresh • Cleaned • Cut After Order" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-brand-muted uppercase mb-1">Short Description</label>
                                                    <textarea className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm font-medium border-2 border-transparent focus:border-brand-red/10 outline-none transition-all h-[60px]"
                                                        value={formData.shortDescription} onChange={e => setFormData({ ...formData, shortDescription: e.target.value })} placeholder="Shown below product name on detail page" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-brand-muted uppercase mb-1">Full Description</label>
                                                    <textarea className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm font-medium border-2 border-transparent focus:border-brand-red/10 outline-none transition-all h-[80px]"
                                                        value={formData.fullDescription} onChange={e => setFormData({ ...formData, fullDescription: e.target.value })} placeholder="Expandable 'Product Details' section" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Visibility Toggles ── */}
                                        <div className="bg-brand-bg/50 rounded-2xl p-4 border border-gray-100">
                                            <h4 className="text-sm font-black text-brand-dark uppercase tracking-widest mb-3">Visibility & Controls</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                <Toggle label="Featured" checked={formData.isFeatured}
                                                    onChange={v => setFormData({ ...formData, isFeatured: v })} />
                                                <Toggle label="Short Desc" checked={formData.showShortDescription}
                                                    onChange={v => setFormData({ ...formData, showShortDescription: v })} />
                                                <Toggle label="Full Desc" checked={formData.showFullDescription}
                                                    onChange={v => setFormData({ ...formData, showFullDescription: v })} />
                                                <Toggle label="Seller Details" checked={formData.showSellerDetails}
                                                    onChange={v => setFormData({ ...formData, showSellerDetails: v })} />
                                                <Toggle label="Share" checked={formData.shareEnabled}
                                                    onChange={v => setFormData({ ...formData, shareEnabled: v })} />
                                                <Toggle label="Wishlist" checked={formData.wishlistEnabled}
                                                    onChange={v => setFormData({ ...formData, wishlistEnabled: v })} />
                                            </div>
                                        </div>

                                        {/* ── Seller Details ── */}
                                        {formData.showSellerDetails && (
                                            <div className="bg-brand-bg/50 rounded-2xl p-4 border border-gray-100">
                                                <h4 className="text-sm font-black text-brand-dark uppercase tracking-widest mb-3">Seller Info</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input className="bg-white rounded-lg px-3 py-2 text-xs font-bold border border-gray-100 outline-none"
                                                        value={formData.sellerDetails.name}
                                                        onChange={e => setFormData({ ...formData, sellerDetails: { ...formData.sellerDetails, name: e.target.value } })}
                                                        placeholder="Seller Name" />
                                                    <input className="bg-white rounded-lg px-3 py-2 text-xs font-bold border border-gray-100 outline-none"
                                                        value={formData.sellerDetails.deliveryEstimate}
                                                        onChange={e => setFormData({ ...formData, sellerDetails: { ...formData.sellerDetails, deliveryEstimate: e.target.value } })}
                                                        placeholder="e.g. 15-20 mins" />
                                                    <input className="bg-white rounded-lg px-3 py-2 text-xs font-bold border border-gray-100 outline-none"
                                                        value={formData.sellerDetails.location}
                                                        onChange={e => setFormData({ ...formData, sellerDetails: { ...formData.sellerDetails, location: e.target.value } })}
                                                        placeholder="Seller Location" />
                                                    <input className="bg-white rounded-lg px-3 py-2 text-xs font-bold border border-gray-100 outline-none"
                                                        value={formData.sellerDetails.foodLicense}
                                                        onChange={e => setFormData({ ...formData, sellerDetails: { ...formData.sellerDetails, foodLicense: e.target.value } })}
                                                        placeholder="FSSAI License" />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-brand-bg p-4 rounded-2xl flex items-center gap-4 mb-4">
                                        <img src={formData.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
                                        <div>
                                            <h4 className="font-bold text-brand-dark">{formData.name}</h4>
                                            <p className="text-xs text-brand-muted">Update pricing for your store</p>
                                        </div>
                                    </div>
                                )}

                                {/* Variations */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-brand-dark uppercase tracking-widest">
                                        Pack Sizes & Pricing
                                    </h4>
                                    <div className="space-y-3">
                                        {formData.variations.map((v, index) => (
                                            <div key={index} className="bg-brand-bg/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                                                <div className="flex flex-wrap md:flex-nowrap gap-3 items-end">
                                                    <div className="w-32 flex-shrink-0">
                                                        <label className="block text-[10px] font-black text-brand-muted uppercase mb-1">Pack</label>
                                                        <div className="bg-white rounded-lg px-3 py-2 text-xs font-bold text-brand-dark border border-gray-100">
                                                            {v.label}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-[80px]">
                                                        <label className="block text-[10px] font-black text-brand-muted uppercase mb-1">Price (₹)</label>
                                                        <input required type="number"
                                                            className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                                            value={v.basePrice} onChange={e => handleVariationChange(index, 'basePrice', e.target.value)} />
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="flex-1 min-w-[80px]">
                                                            <label className="block text-[10px] font-black text-brand-muted uppercase mb-1">Sale Price (₹)</label>
                                                            <input type="number"
                                                                className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                                                value={v.discountedPrice} onChange={e => handleVariationChange(index, 'discountedPrice', e.target.value)}
                                                                placeholder="—" />
                                                        </div>
                                                    )}
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex flex-wrap md:flex-nowrap gap-3 items-end">
                                                        <div className="flex-1 min-w-[80px]">
                                                            <label className="block text-[10px] font-black text-brand-muted uppercase mb-1">Stock</label>
                                                            <input type="number"
                                                                className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                                                value={v.stock} onChange={e => handleVariationChange(index, 'stock', e.target.value)} />
                                                        </div>
                                                        <div className="flex-1 min-w-[80px]">
                                                            <label className="block text-[10px] font-black text-brand-muted uppercase mb-1">SKU</label>
                                                            <input
                                                                className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                                                value={v.sku} onChange={e => handleVariationChange(index, 'sku', e.target.value)}
                                                                placeholder="e.g. MBK-BC-250" />
                                                        </div>
                                                        <div className="flex-1 min-w-[120px]">
                                                            <label className="block text-[10px] font-black text-brand-muted uppercase mb-1">Description</label>
                                                            <input
                                                                className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                                                value={v.desc} onChange={e => handleVariationChange(index, 'desc', e.target.value)}
                                                                placeholder="e.g. ~10 pcs" />
                                                        </div>
                                                        <div className="flex items-center gap-2 pb-2">
                                                            <Toggle label="Active" checked={v.isActive}
                                                                onChange={val => handleVariationChange(index, 'isActive', val)} />
                                                        </div>
                                                    </div>
                                                )}
                                                {!isAdmin && (
                                                    <div className="flex items-center gap-2">
                                                        <Toggle label="In Stock" checked={v.isActive}
                                                            onChange={val => handleVariationChange(index, 'isActive', val)} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
                                    <button type="submit" disabled={loading} className="flex-1 bg-brand-red text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-red/20 flex items-center justify-center gap-2 hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : (isEditing ? 'Save Changes' : 'Create Product')}
                                    </button>
                                    <button type="button" onClick={() => setShowAddForm(false)} className="px-8 bg-brand-bg text-brand-dark py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => {
                    const variations = product.variations || [];
                    const firstVar = variations[0];
                    return (
                        <motion.div key={product._id} layout className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative">
                            {product.isFeatured && (
                                <div className="absolute top-6 left-6 z-10 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-md text-[9px] font-black flex items-center gap-1">
                                    <Star size={10} /> Featured
                                </div>
                            )}
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-brand-dark leading-tight">{product.name}</h4>
                                        <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">{product.categoryId?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        {firstVar && (
                                            <>
                                                <p className="text-xs font-black text-brand-dark">₹{firstVar.discountedPrice || firstVar.basePrice || firstVar.price}</p>
                                                {firstVar.discountedPrice && <p className="text-[10px] text-slate-400 line-through">₹{firstVar.basePrice || firstVar.price}</p>}
                                                <p className="text-[10px] text-brand-muted font-bold uppercase">{firstVar.label}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-gray-50 mt-2">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="flex-1 py-2 bg-brand-bg hover:bg-brand-red hover:text-white text-brand-dark rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                    >
                                        <Edit2 size={14} /> {isAdmin ? 'Edit' : 'Update Price'}
                                    </button>
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(product._id)} className="w-10 h-10 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all flex items-center justify-center">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
