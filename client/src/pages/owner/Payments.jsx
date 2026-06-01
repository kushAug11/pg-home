import React, { useState, useEffect } from 'react';
import ownerService from '../../services/owner.service';
import { Plus, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import Skeleton from '../../components/common/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { generateRentReceipt } from '../../utils/pdfGenerator';

const Payments = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        tenantId: '',
        amount: '',
        mode: 'CASH', // CASH, UPI_MANUAL, BANK_TRANSFER
        date: new Date().toISOString().split('T')[0],
        remarks: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [payRes, tenantRes] = await Promise.all([
                ownerService.getPayments(),
                ownerService.getTenants()
            ]);
            if (payRes.success) setPayments(payRes.data);
            if (tenantRes.success) setTenants(tenantRes.data);
        } catch (error) {
            console.error("Failed to load payments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await ownerService.recordManualPayment(formData);
            if (res.success) {
                alert('Payment Recorded Successfully!');
                setShowModal(false);
                setFormData({ tenantId: '', amount: '', mode: 'CASH', date: new Date().toISOString().split('T')[0], remarks: '' });
                loadData(); // Refresh list
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to record payment');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS': return 'text-green-600 bg-green-50';
            case 'FAILED': return 'text-red-600 bg-red-50';
            default: return 'text-yellow-600 bg-yellow-50';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Payments & Revenue</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                    <Plus size={20} /> Record Payment
                </button>
            </div>

            {/* Payment List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Tenant</th>
                                <th className="p-4 font-semibold">Amount</th>
                                <th className="p-4 font-semibold">Mode</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No payments found.</td></tr>
                            ) : (
                                payments.map(pay => (
                                    <tr key={pay._id} className="hover:bg-slate-50 transition">
                                        <td className="p-4">{new Date(pay.transaction_date).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium">
                                            {pay.tenant_id?.user_id?.name || 'Unknown'}
                                            <div className="text-xs text-slate-400">{pay.tenant_id?.user_id?.email}</div>
                                        </td>
                                        <td className="p-4 font-bold">₹{pay.amount}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{pay.payment_mode || 'ONLINE'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${getStatusColor(pay.status)}`}>
                                                {pay.status === 'SUCCESS' && <CheckCircle size={12} />}
                                                {pay.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {pay.status === 'SUCCESS' && (
                                                <button
                                                    onClick={() => generateRentReceipt(pay, user)}
                                                    className="text-indigo-600 hover:underline text-xs font-semibold"
                                                    title="Download PDF Receipt"
                                                >
                                                    Receipt
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

            {/* Record Payment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Record Manual Payment</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Tenant</label>
                                <select
                                    name="tenantId"
                                    value={formData.tenantId}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border p-2 rounded-lg"
                                >
                                    <option value="">-- Select Tenant --</option>
                                    {tenants.map(t => (
                                        <option key={t._id} value={t._id}>{t.user_id?.name} (Room {t.room_id?.number})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border p-2 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border p-2 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['CASH', 'UPI_MANUAL', 'BANK_TRANSFER'].map(mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, mode })}
                                            className={`py-2 px-1 rounded border text-xs font-semibold ${formData.mode === mode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
                                        >
                                            {mode.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                                <textarea
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    className="w-full border p-2 rounded-lg"
                                    rows="2"
                                    placeholder="e.g. Paid for Jan & Feb"
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md">
                                Record Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
