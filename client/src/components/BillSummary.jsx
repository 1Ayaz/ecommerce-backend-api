import { Loader2 } from 'lucide-react';

/**
 * BillSummary — pure display component, no state, no API calls.
 *
 * Props:
 *   subtotal     {number}
 *   deliveryFee  {number}
 *   discount     {number}
 *   handlingFee  {number}  – platformFee + taxAmount combined
 *   grandTotal   {number}
 *   loading      {boolean} – shows a spinner overlay while preview is fetching
 */
export default function BillSummary({ subtotal, deliveryFee, discount, handlingFee, grandTotal, loading }) {
    return (
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#D11243]" size={24} />
                </div>
            )}
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bill Details</h3>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500">Item Total</span>
                    <span className="font-bold text-secondary">₹{(subtotal ?? 0).toFixed(2)}</span>
                </div>

                {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                        <span>Coupon Discount</span>
                        <span className="font-bold">-₹{discount.toFixed(2)}</span>
                    </div>
                )}

                <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Fee</span>
                    <span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-600' : 'text-secondary'}`}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                    </span>
                </div>

                {handlingFee > 0 && (
                    <div className="flex justify-between">
                        <span className="text-slate-500">Taxes & Platform Fees</span>
                        <span className="font-bold text-secondary">₹{handlingFee.toFixed(2)}</span>
                    </div>
                )}

                <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold text-secondary text-base">Grand Total</span>
                    <span className="font-black text-secondary text-base">₹{(grandTotal ?? 0).toFixed(2)}</span>
                </div>
            </div>
        </section>
    );
}
