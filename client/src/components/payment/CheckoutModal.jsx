import React, { useState } from 'react';
import { ShieldCheck, Lock, CreditCard, TicketPercent, X } from 'lucide-react';

const CheckoutModal = ({ plan, basePrice, onClose, onConfirm }) => {
    const [coupon, setCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isValidCoupon, setIsValidCoupon] = useState(false);
    const [couponMsg, setCouponMsg] = useState('');

    // Parse price (remove currency symbol if present)
    const numericPrice = parseFloat(basePrice.toString().replace(/[^0-9.]/g, ''));

    const gstRate = 0.18;
    const gstAmount = numericPrice * gstRate;
    const subTotal = numericPrice;
    const finalAmount = (subTotal + gstAmount - discount).toFixed(2);

    const handleApplyCoupon = () => {
        if (coupon.toUpperCase() === 'WELCOME10') {
            const disc = numericPrice * 0.10;
            setDiscount(disc);
            setIsValidCoupon(true);
            setCouponMsg('Coupon applied! 10% Off');
        } else {
            setDiscount(0);
            setIsValidCoupon(false);
            setCouponMsg('Invalid Coupon Code');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold uppercase tracking-wider mb-1">
                            <Lock size={14} /> Secure Checkout
                        </div>
                        <h2 className="text-2xl font-bold">Review Your Order</h2>
                        <p className="text-slate-400 text-sm mt-1">Complete your subscription for {plan}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* Plan Summary Card */}
                    <div className="flex items-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
                        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-4">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{plan} Plan</h3>
                            <p className="text-sm text-slate-600">Monthly Subscription</p>
                        </div>
                        <div className="ml-auto font-bold text-lg text-slate-800">
                            ₹{numericPrice}
                        </div>
                    </div>

                    {/* Bill Details */}
                    <div className="space-y-3 mb-6">
                        <h4 className="font-bold text-slate-800 text-sm">Bill Details</h4>
                        <div className="flex justify-between text-slate-600 text-sm">
                            <span>Item Total</span>
                            <span>₹{numericPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-sm">
                            <span>GST (18%)</span>
                            <span>₹{gstAmount.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 text-sm font-medium">
                                <span>Discount (WELCOME10)</span>
                                <span>- ₹{discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center">
                            <span className="font-bold text-slate-800">To Pay</span>
                            <span className="font-bold text-2xl text-indigo-600">₹{finalAmount}</span>
                        </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Have a Coupon?</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <TicketPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Enter Code (Try WELCOME10)"
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${isValidCoupon ? 'border-green-500 focus:ring-green-200' : 'border-slate-300 focus:ring-indigo-200'}`}
                                    value={coupon}
                                    onChange={(e) => setCoupon(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleApplyCoupon}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                        {couponMsg && (
                            <p className={`text-xs mt-1 ${isValidCoupon ? 'text-green-600' : 'text-red-500'}`}>{couponMsg}</p>
                        )}
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                            <ShieldCheck size={16} className="text-green-600" />
                            <span>SSL Encrypted Payment</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">R</div>
                            <span>Trusted by Razorpay</span>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={() => onConfirm(finalAmount)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Lock size={18} />
                        Pay ₹{finalAmount} Securely
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        By proceeding, you agree to our Terms of Service & Refund Policy.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default CheckoutModal;
