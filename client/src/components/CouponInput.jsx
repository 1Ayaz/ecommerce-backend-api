import { useState } from 'react';
import { Tag, CheckCircle } from 'lucide-react';
import API from '../config/api';
import { toast } from 'react-toastify';

/**
 * CouponInput — self-contained coupon apply/remove flow.
 *
 * Props:
 *   vendorId    {string}   – current vendor (used to scope coupon validation)
 *   subtotal    {number}   – current items total (needed for minOrderAmount check)
 *   applied     {object|null} – { couponCode, discountAmount } if a coupon is already active
 *   onApply     {fn}       – called with coupon object when successfully applied
 *   onRemove    {fn}       – called with no args when coupon is removed
 */
export default function CouponInput({ vendorId, subtotal, applied, onApply, onRemove }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleApply = async () => {
        if (!code.trim()) return;
        setError('');
        setLoading(true);
        try {
            const { data } = await API.post('/coupons/validate', {
                code: code.trim(),
                orderAmount: subtotal,
                vendorId,
            });
            onApply(data.data);
            toast.success('Coupon applied!');
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid or expired coupon';
            setError(msg);
            onRemove();
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        setCode('');
        setError('');
        onRemove();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleApply();
    };

    return (
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Tag size={12} /> Apply Coupon
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Enter code"
                    value={applied ? applied.couponCode : code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    disabled={!!applied || loading}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider focus:border-[#D11243]/30 outline-none disabled:opacity-60"
                />
                {applied ? (
                    <button
                        onClick={handleRemove}
                        className="bg-red-100 text-red-600 px-4 rounded-xl font-bold text-xs hover:bg-red-200 transition-colors"
                    >
                        Remove
                    </button>
                ) : (
                    <button
                        onClick={handleApply}
                        disabled={loading || !code.trim()}
                        className="bg-[#15161D] text-white px-4 rounded-xl font-bold text-xs disabled:opacity-50 transition-all"
                    >
                        {loading ? '...' : 'Apply'}
                    </button>
                )}
            </div>
            {error && <p className="text-red-500 text-[11px] font-bold mt-2">{error}</p>}
            {applied && (
                <p className="text-emerald-600 text-[11px] font-bold mt-2 flex items-center gap-1">
                    <CheckCircle size={12} /> You save ₹{applied.discountAmount}!
                </p>
            )}
        </section>
    );
}
