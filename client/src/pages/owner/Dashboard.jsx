import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ownerService from '../../services/owner.service';
import { Users, Bed, IndianRupee, AlertCircle, Plus, FileText, ArrowUpRight, ShieldCheck, Wifi } from 'lucide-react';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { useSocketListener } from '../../hooks/useSocketListener';
import toast from 'react-hot-toast';
import Skeleton from '../../components/common/Skeleton';
import RevenueChart from '../../components/charts/RevenueChart';

const OwnerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);

    const [stats, setStats] = useState({
        tenants: 0,
        occupancy: 0,
        pendingRent: 0,
        complaints: 0
    });
    const [revenueData, setRevenueData] = useState([]);

    const fetchStats = async () => {
        try {
            const [statsRes, paymentsRes] = await Promise.all([
                ownerService.getDashboardStats(),
                ownerService.getPayments()
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (paymentsRes.success) setRevenueData(paymentsRes.data);

        } catch (err) {
            console.error("Dashboard Fetch Error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Mocking live connection status for visual effect (socket connects in AuthContext)
        setTimeout(() => setIsLive(true), 1000);
    }, []);

    // Real-time Listeners
    useSocketListener('dashboard:update', () => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <IndianRupee className="h-10 w-10 text-emerald-500 bg-emerald-100 rounded-full p-2" />
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">New Payment Received!</p>
                            <p className="mt-1 text-sm text-gray-500">Refreshing dashboard stats...</p>
                        </div>
                    </div>
                </div>
            </div>
        ));
        fetchStats(); // Auto-refresh data
    });

    useSocketListener('complaint:new', () => {
        toast('New Complaint Logged', { icon: '⚠️' });
        fetchStats();
    });

    const quickActions = [
        { label: 'Add Tenant', icon: <Plus size={20} />, path: '/owner/tenants', color: 'bg-primary-50 text-primary-600' },
        { label: 'Record Rent', icon: <IndianRupee size={20} />, path: '/owner/payments', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'View Rooms', icon: <Bed size={20} />, path: '/owner/rooms', color: 'bg-blue-50 text-blue-600' },
        { label: 'Post Notice', icon: <FileText size={20} />, path: '/owner/notices', color: 'bg-amber-50 text-amber-600' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-heading font-bold text-slate-900">Dashboard</h1>
                        {isLive && (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/50 text-emerald-700 text-xs font-medium border border-emerald-200 animate-pulse-slow">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Live Updates
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500">Overview for <span className="font-semibold text-slate-700">{user?.name}</span></p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/pricing')}
                    className="w-full md:w-auto"
                >
                    <ShieldCheck size={18} className="mr-2" />
                    Upgrade to Pro
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        <StatsCard
                            title="Total Tenants"
                            value={stats.tenants}
                            icon={<Users size={24} />}
                            color="bg-indigo-50 text-indigo-600"
                            trend={12} // Mock trend for demo
                        />
                        <StatsCard
                            title="Occupancy"
                            value={`${stats.occupancy}%`}
                            icon={<Bed size={24} />}
                            color="bg-blue-50 text-blue-600"
                            trend={-2}
                        />
                        <StatsCard
                            title="Pending Rent"
                            value={`₹${stats.pendingRent}`}
                            icon={<IndianRupee size={24} />}
                            color="bg-amber-50 text-amber-600"
                        />
                        <StatsCard
                            title="Action Items"
                            value={stats.complaints}
                            icon={<AlertCircle size={24} />}
                            color="bg-red-50 text-red-600"
                        />
                    </>
                )}
            </div>

            {/* Revenue Chart */}
            <RevenueChart payments={revenueData} loading={loading} />

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions Panel */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-lg font-heading font-semibold text-slate-900 mb-6 flex items-center gap-2">
                        <ArrowUpRight size={20} className="text-primary-500" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => navigate(action.path)}
                                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all group bg-surface-subtle"
                            >
                                <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-transform group-hover:scale-110 ${action.color}`}>
                                    {action.icon}
                                </div>
                                <span className="text-sm font-medium text-slate-700 group-hover:text-primary-600">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* System Status / Promo */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg">
                    <div>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        <h3 className="text-xl font-heading font-bold mb-2">System Secure</h3>
                        <p className="text-primary-100 text-sm">
                            Your data is encrypted and backed up. Last backup was 2 hours ago.
                        </p>
                    </div>
                    <button onClick={() => navigate('/owner/expenses')} className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm border border-white/10">
                        View Financials
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;

