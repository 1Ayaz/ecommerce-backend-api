import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, FolderTree, ImageIcon } from 'lucide-react';
import API from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

export default function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({ name: '', image: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await API.get('/products/categories');
            setCategories(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                await API.put(`/categories/${isEditing}`, formData);
                toast.success('Category updated');
            } else {
                await API.post('/categories', formData);
                toast.success('Category created');
            }
            setShowForm(false);
            setIsEditing(null);
            setFormData({ name: '', image: '' });
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (cat) => {
        setIsEditing(cat._id);
        setFormData({ name: cat.name, image: cat.image });
        setShowForm(true);
    };

    const handleDelete = async (catId) => {
        if (!window.confirm('Delete this category? Products in it will become uncategorized.')) return;
        try {
            await API.delete(`/categories/${catId}`);
            toast.success('Category deleted');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    if (loading && categories.length === 0) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-red" size={40} /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-brand-dark">Categories</h2>
                    <p className="text-xs text-brand-muted font-medium">Organize products into browsable categories</p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setIsEditing(null);
                        setFormData({ name: '', image: '' });
                    }}
                    className="bg-brand-red text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-brand-red/20 active:scale-95 transition-all"
                >
                    <Plus size={18} />
                    Add Category
                </button>
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-black text-brand-dark">
                                    {isEditing ? 'Edit Category' : 'New Category'}
                                </h3>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-brand-muted uppercase mb-1">Category Name</label>
                                    <input
                                        required
                                        className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm font-medium border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Chicken, Mutton, Eggs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-brand-muted uppercase mb-1">Image URL</label>
                                    <input
                                        required
                                        className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm font-medium border-2 border-transparent focus:border-brand-red/10 outline-none transition-all"
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        placeholder="https://..."
                                    />
                                    {formData.image && (
                                        <img src={formData.image} alt="" className="w-20 h-20 rounded-xl object-cover mt-3 border border-gray-100" />
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="submit" disabled={loading} className="flex-1 bg-brand-red text-white py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-red/20 flex items-center justify-center gap-2 hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : (isEditing ? 'Save Changes' : 'Create Category')}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-brand-bg text-brand-dark py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <motion.div
                        key={cat._id}
                        layout
                        className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all group flex items-center gap-4"
                    >
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                            {cat.image ? (
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="text-gray-300" size={24} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-brand-dark truncate">{cat.name}</h4>
                            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Category</p>
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => handleEdit(cat)}
                                className="w-9 h-9 bg-brand-bg hover:bg-brand-red hover:text-white text-brand-dark rounded-xl transition-all flex items-center justify-center"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(cat._id)}
                                className="w-9 h-9 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all flex items-center justify-center"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FolderTree className="text-gray-300" />
                    </div>
                    <p className="text-brand-muted font-bold">No categories yet</p>
                    <p className="text-xs text-brand-muted mt-1">Add your first category to organize products</p>
                </div>
            )}
        </div>
    );
}
