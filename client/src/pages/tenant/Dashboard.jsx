import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { CreditCard, AlertCircle, Home, Megaphone, LogOut, History, User, UserPlus } from 'lucide-react';
import tenantService from '../../services/tenant.service';
import securityService from '../../services/security.service';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import Skeleton from '../../components/common/Skeleton';

const TenantDashboard = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Guest Request State
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestData, setGuestData] = useState({ guest_name: '', relation: '', fromDate: '', toDate: '' });
    const [submittingGuest, setSubmittingGuest] = useState(false);
    const [myRequests, setMyRequests] = useState([]);
    const [showExitModal, setShowExitModal] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const fetchDashboard = async () => {
        try {
            const res = await tenantService.getDashboard();
            setDashboardData(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchGuestRequests = async () => {
        try {
            const res = await securityService.getMyRequests();
            setMyRequests(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchDashboard();
        fetchGuestRequests();
    }, []);

    const handleRequestGuest = async (e) => {
        e.preventDefault();
        setSubmittingGuest(true);
        try {
            await securityService.createGuestRequest(guestData);
            toast.success('Guest request submitted');
            setShowGuestModal(false);
            setGuestData({ guest_name: '', relation: '', fromDate: '', toDate: '' });
            fetchGuestRequests();
        } catch (error) {
            toast.error('Failed to submit request');
        } finally {
            setSubmittingGuest(false);
        }
    };

    // UI-019 FIX: Proper multi-card skeleton matching page layout
    if (loading) return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const pg = dashboardData?.pg;
    const tenant = dashboardData?.tenant;

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-slate-900">Welcome, {user?.name}</h1>
                        <p className="text-slate-500 flex items-center gap-2">
                            <Home size={14} />
                            {pg?.name} • {pg?.address}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setShowGuestModal(true)}
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                    >
                        <UserPlus size={18} className="mr-2" />
                        Request Guest
                    </Button>

                    {tenant?.exit_request?.status === 'PENDING' ? (
                        <div className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium flex items-center gap-2">
                            <History size={16} /> Exit Request Pending
                        </div>
                    ) : tenant?.status === 'on_notice' ? (
                        <div className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium">
                            On Notice (Ends: {new Date(tenant?.exit_date).toLocaleDateString()})
                        </div>
                    ) : (
                        <Button
                            variant="danger"
                            onClick={() => setShowExitModal(true)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        >
                            <LogOut size={18} className="mr-2" />
                            Request Exit
                        </Button>
                    )}
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="My Room"
                    value={dashboardData?.room?.number || 'Not Assigned'}
                    icon={<Home size={24} />}
                    color="bg-blue-50 text-blue-600"
                    trend={0}
                />
                <StatsCard
                    title="Rent Due"
                    value={`₹${dashboardData?.tenant?.rentAmount || 0}`}
                    icon={<CreditCard size={24} />}
                    color="bg-emerald-50 text-emerald-600"
                >
                    {dashboardData?.tenant?.rentAmount > 0 && (
                        <Link to="/tenant/payments">
                            <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-colors animate-pulse-slow">
                                Pay Now
                            </button>
                        </Link>
                    )}
                </StatsCard>

                <StatsCard
                    title="Last Cleaned"
                    value={dashboardData?.lastCleaned ? new Date(dashboardData.lastCleaned).toLocaleDateString() : 'Pending'}
                    icon={<div className="text-purple-600">✨</div>}
                    color="bg-purple-50 text-purple-600"
                />
            </div>

            {/* UI-009 FIX: Two-column grid with content in both columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Guest History */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-heading font-semibold text-slate-900">Guest History</h3>
                    </div>
                    <div className="space-y-2">
                        {myRequests.length === 0 ? (
                            <p className="text-slate-400 text-sm">No recent guest requests.</p>
                        ) : (
                            myRequests.slice(0, 3).map(req => (
                                <div key={req._id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg text-sm">
                                    <div>
                                        <span className="font-semibold text-slate-700">{req.guest_name}</span>
                                        <span className="text-slate-500 text-xs ml-2">({new Date(req.fromDate).toLocaleDateString()})</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {req.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Links panel */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Quick Links</h3>
                    <div className="space-y-3">
                        <Link to="/tenant/payments" className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm">
                            <CreditCard size={18} />
                            View Payment History
                        </Link>
                        <Link to="/tenant/complaints" className="flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium text-sm">
                            <AlertCircle size={18} />
                            My Complaints
                        </Link>
                        <Link to="/tenant/food" className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm">
                            <Megaphone size={18} />
                            Food & Menu
                        </Link>
                    </div>
                </div>
            </div>

            {/* UI-024 FIX: Accessible Modal with focus trap + ARIA */}
            <Modal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                title="Request Overnight Guest"
            >
                <div className="p-6">
                    <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">Request Overnight Guest</h2>
                    <form onSubmit={handleRequestGuest} className="space-y-4">
                        <Input label="Guest Name" required value={guestData.guest_name} onChange={e => setGuestData({ ...guestData, guest_name: e.target.value })} />
                        <Input label="Relation" required value={guestData.relation} onChange={e => setGuestData({ ...guestData, relation: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="date" label="From" required min={today} value={guestData.fromDate} onChange={e => setGuestData({ ...guestData, fromDate: e.target.value })} />
                            <Input type="date" label="To" required min={guestData.fromDate || today} value={guestData.toDate} onChange={e => setGuestData({ ...guestData, toDate: e.target.value })} />
                        </div>
                        <div className="flex space-x-3 pt-4">
                            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowGuestModal(false)}>Cancel</Button>
                            <Button type="submit" className="flex-1" isLoading={submittingGuest}>Submit</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default TenantDashboard;
