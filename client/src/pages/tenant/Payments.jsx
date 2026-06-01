import React, { useState, useEffect } from 'react';
import tenantService from '../../services/tenant.service';
import { generateRentReceipt } from '../../utils/pdfGenerator';

// Load Razorpay Script dynamically if not present in index.html, 
// usually it's better to have it in index.html <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
// We assume it is available as window.Razorpay

const Payments = () => {
    const [rentAmount, setRentAmount] = useState(0);
    const [messDues, setMessDues] = useState(0);
    const [activeVouchersCount, setActiveVouchersCount] = useState(0);
    const [payments, setPayments] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchPayments = async () => {
        try {
            const [paymentsRes, dashboardRes] = await Promise.all([
                tenantService.getPayments(),
                tenantService.getDashboard()
            ]);
            if (paymentsRes.success) {
                setRentAmount(paymentsRes.data.rentAmount);
                setMessDues(paymentsRes.data.messDues || 0);
                setActiveVouchersCount(paymentsRes.data.activeVouchersCount || 0);
                setPayments(paymentsRes.data.payments);
            }
            if (dashboardRes.success) {
                setProfile(dashboardRes.data);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handlePayRent = async () => {
        setLoading(true);
        try {
            const res = await tenantService.initiateRentPayment();

            if (res.success) {
                const options = {
                    key: res.key_id,
                    amount: res.amount,
                    currency: "INR",
                    name: "Hostel Rent Payment",
                    description: "Monthly Rent",
                    order_id: res.order_id,
                    handler: async function (response) {
                        try {
                            const verifyRes = await tenantService.verifyPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            if (verifyRes.success) {
                                alert('Payment Successful!');
                                fetchPayments();
                            } else {
                                alert('Payment Verification Failed');
                            }
                        } catch (err) {
                            console.error(err);
                            alert('Payment Verification Error');
                        }
                    },
                    prefill: {
                        name: "Tenant", // Ideally get from user context
                        email: "tenant@example.com",
                        contact: ""
                    },
                    theme: {
                        color: "#3399cc"
                    }
                };

                // MOCK MODE DETECTION
                if (res.key_id.startsWith('mock_') || res.key_id === 'rzp_test_missing') {
                    if (window.confirm("DEV MODE: Simulate Successful Payment?")) {
                        // Simulate delay
                        setTimeout(async () => {
                            // Call Handler with Mock Response
                            options.handler({
                                razorpay_order_id: res.order_id,
                                razorpay_payment_id: 'pay_mock_' + Date.now(),
                                razorpay_signature: 'mock_signature' // Service will accept this because key is mock
                            });
                        }, 1000);
                        return;
                    } else {
                        return; // User cancelled simulation
                    }
                }

                const rzp1 = new window.Razorpay(options);
                rzp1.on('payment.failed', function (response) {
                    alert(`Payment Failed: ${response.error.description}`);
                    setLoading(false);
                });
                rzp1.open();
            } else {
                alert('Failed to initiate payment');
                setLoading(false);
            }
        } catch (error) {
            console.error('Payment Error:', error);
            alert('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="p-6 relative">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Payments & Rent</h1>

            {/* Processing Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-lg font-semibold text-slate-700">Processing Payment...</p>
                    <p className="text-sm text-slate-500">Please do not close this window.</p>
                </div>
            )}

            {/* Test Mode Banner */}
            {/* Logic: We don't have the key directly here until they click pay, 
                but we can check if the environment variable is exposed or just assume based on failure. 
                Instead, we'll check if the backend response key had 'test' in it during the last attempt or generally indicate caution. 
                But better, let's just show a general 'How to Pay' hint. 
            */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <p className="text-blue-700 font-medium">Payment Information</p>
                <p className="text-sm text-blue-600 mt-1">
                    If using <strong>Test Mode</strong> cards/UPI, real scanning (GPay/PhonePe) will <span className="underline decoration-wavy">not work</span>.
                    Please use the "Test UPI" option or simulate success if available.
                </p>
            </div>

            {/* Pay Rent Section */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all hover:shadow-lg">
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-800">Dynamic Payment Invoice</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-slate-500 border-b border-dashed border-slate-100 pb-2">
                        <span>Base Rent:</span>
                        <span className="font-bold text-slate-800">₹{rentAmount}</span>
                        {messDues > 0 && (
                            <>
                                <span className="flex items-center gap-1">
                                    Mess Add-On Dues: 
                                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 rounded font-black border uppercase">
                                        {activeVouchersCount} Vouchers
                                    </span>
                                </span>
                                <span className="font-bold text-slate-800">₹{messDues}</span>
                            </>
                        )}
                    </div>
                    <div className="pt-1 flex items-center gap-4">
                        <span className="text-slate-600 font-semibold">Total Invoice Due:</span>
                        <span className="text-3xl font-black text-slate-900">₹{rentAmount + messDues}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <button
                        onClick={handlePayRent}
                        disabled={loading || (rentAmount + messDues) <= 0}
                        className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-extrabold hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                        <span>💳</span> {loading ? 'Processing...' : 'Pay Invoice Now'}
                    </button>
                    {(rentAmount + messDues) > 0 && <span className="text-xs text-slate-500 text-center">Secured by Razorpay</span>}
                </div>
            </div>

            {/* Payment History */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">payment History</h2>
                    <button onClick={fetchPayments} className="text-sm text-indigo-600 hover:underline">Refresh</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b">
                                <th className="p-3 text-slate-600 font-medium">Date</th>
                                <th className="p-3 text-slate-600 font-medium">Amount</th>
                                <th className="p-3 text-slate-600 font-medium">Type</th>
                                <th className="p-3 text-slate-600 font-medium">Status</th>
                                <th className="p-3 text-slate-600 font-medium">Reference ID</th>
                                <th className="p-3 text-slate-600 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500 italic">No payment history available.</td>
                                </tr>
                            ) : (
                                payments.map((pay) => (
                                    <tr key={pay._id} className="border-b hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-slate-800">{new Date(pay.transaction_date).toLocaleDateString()}</td>
                                        <td className="p-3 text-slate-800 font-semibold">₹{pay.amount}</td>
                                        <td className="p-3 text-slate-600 text-sm">{pay.type}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border 
                                                ${pay.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    pay.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs text-slate-400 font-mono tracking-wide">{pay.gateway_order_id}</td>
                                        <td className="p-3 text-right">
                                            {pay.status === 'SUCCESS' && (
                                                <button
                                                    onClick={() => generateRentReceipt(pay, profile)}
                                                    className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold flex items-center gap-1 ml-auto"
                                                    title="Download PDF Receipt"
                                                >
                                                    📥 Receipt
                                                </button>
                                            )}
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
};

export default Payments;
