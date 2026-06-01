import React, { useState, useEffect } from 'react';
import ownerService from '../../services/owner.service';
import { Trash2, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import Skeleton from '../../components/common/Skeleton';

const OwnerExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'manage'

    // Form
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Maintenance');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [expRes, anaRes] = await Promise.all([
                ownerService.getExpenses(),
                ownerService.getAnalytics()
            ]);
            if (expRes.success) setExpenses(expRes.data);
            if (anaRes.success) setAnalytics(anaRes.data);
        } catch (error) {
            console.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await ownerService.addExpense({ amount, category, description });
            if (res.success) {
                setExpenses([res.data, ...expenses]);
                setAmount('');
                setDescription('');
                // Refresh analytics to reflect new expense
                const anaRes = await ownerService.getAnalytics();
                if (anaRes.success) setAnalytics(anaRes.data);
            }
        } catch (error) {
            alert('Failed to add expense');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense record?')) return;
        try {
            await ownerService.deleteExpense(id);
            setExpenses(expenses.filter(e => e._id !== id));
            // Refresh analytics
            const anaRes = await ownerService.getAnalytics();
            if (anaRes.success) setAnalytics(anaRes.data);
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const handleExport = async () => {
        try {
            // Secure Blob Download via Service/Axios
            const response = await ownerService.getFinancialReport();
            // Service returns blob usually if configured, or we handle here.
            // Let's assume service handles blob
            if (response) {
                const url = window.URL.createObjectURL(new Blob([response]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'financial_report.csv');
                document.body.appendChild(link);
                link.click();
            }
        } catch (error) {
            alert('Export failed');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Financial Overview</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={handleExport}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <TrendingUp size={16} /> Export Report
                    </button>
                    <div className="flex space-x-2 bg-white p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'manage' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Expenses
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <>
                    {/* Analytics Section */}
                    {activeTab === 'overview' && analytics && (
                        <div className="space-y-6">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                            <TrendingUp size={20} />
                                        </div>
                                        <p className="text-slate-500 font-medium">Total Revenue</p>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800">₹{analytics.totalRevenue}</h3>
                                    <p className="text-xs text-green-600 mt-1">From Rent Collections</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                            <TrendingDown size={20} />
                                        </div>
                                        <p className="text-slate-500 font-medium">Total Expenses</p>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800">₹{analytics.totalExpenses}</h3>
                                    <p className="text-xs text-red-600 mt-1">Operational Costs</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <PieChart size={20} />
                                        </div>
                                        <p className="text-slate-500 font-medium">Net Profit</p>
                                    </div>
                                    <h3 className={`text-2xl font-bold ${analytics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{analytics.profit}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">Revenue - Expenses</p>
                                </div>
                            </div>

                            {/* Expense Breakdown */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4">Expense Breakdown by Category</h3>
                                {analytics.expenseBreakdown.length > 0 ? (
                                    <div className="space-y-4">
                                        {analytics.expenseBreakdown.map((item) => (
                                            <div key={item._id} className="flex items-center">
                                                <div className="w-32 text-sm text-slate-600 font-medium">{item._id}</div>
                                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-4">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${(item.total / analytics.totalExpenses) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <div className="w-20 text-right text-sm font-bold text-slate-800">₹{item.total}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-center py-4">No expenses recorded yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Manage Expenses Section */}
                    {activeTab === 'manage' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Add Expense Form */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                    <DollarSign size={18} className="mr-2" />
                                    Add New Expense
                                </h3>
                                <form onSubmit={handleAddExpense} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-700 mb-1">Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            className="w-full border p-2 rounded outline-none focus:ring-2 ring-primary/20"
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-700 mb-1">Category</label>
                                        <select
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                            className="w-full border p-2 rounded outline-none"
                                        >
                                            {['Electricity', 'Water', 'Maintenance', 'Staff Salary', 'Rent/Lease', 'Internet', 'Food/Groceries', 'Other'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-700 mb-1">Description</label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            className="w-full border p-2 rounded outline-none focus:ring-2 ring-primary/20"
                                            placeholder="e.g. June Monthly Bill"
                                        />
                                    </div>
                                    <button
                                        disabled={submitting}
                                        className="w-full bg-primary text-white py-2 rounded font-medium hover:bg-primary-dark transition-colors"
                                    >
                                        {submitting ? 'Adding...' : 'Log Expense'}
                                    </button>
                                </form>
                            </div>

                            {/* Expense History List */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-bold text-slate-800">Expense History</h3>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                                    {expenses.length === 0 ? (
                                        <p className="text-center py-8 text-slate-500">No records found.</p>
                                    ) : (
                                        expenses.map(exp => (
                                            <div key={exp._id} className="p-4 hover:bg-slate-50 flex justify-between items-center group">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-semibold text-slate-800">{exp.category}</span>
                                                        <span className="text-xs text-slate-400">• {new Date(exp.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-500">{exp.description || 'No description'}</p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="font-bold text-slate-700">₹{exp.amount}</span>
                                                    <button
                                                        onClick={() => handleDelete(exp._id)}
                                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default OwnerExpenses;
