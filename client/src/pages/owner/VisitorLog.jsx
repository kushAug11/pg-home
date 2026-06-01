import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import securityService from '../../services/security.service';
import Card from '../../components/common/Card';
import { toast } from 'react-hot-toast';
import { UserPlus, LogOut, Clock, ShieldCheck, XCircle, CheckCircle } from 'lucide-react';

const VisitorLog = () => {
    const [activeTab, setActiveTab] = useState('visitors'); // visitors | requests | preauth
    const [activeVisitors, setActiveVisitors] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [preAuthList, setPreAuthList] = useState([]);
    const [checkInToken, setCheckInToken] = useState('');
    const [verifying, setVerifying] = useState(false);

    // Form State
    const [newVisitor, setNewVisitor] = useState({ name: '', phone: '', purpose: 'Delivery', details: '' });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (activeTab === 'visitors') fetchVisitors();
        else if (activeTab === 'requests') fetchRequests();
        else if (activeTab === 'preauth') fetchPreAuths();
    }, [activeTab]);

    const fetchVisitors = async () => {
        try {
            const res = await securityService.getActiveVisitors();
            setActiveVisitors(res);
        } catch (error) {
            toast.error('Failed to load visitors');
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await securityService.getPendingRequests();
            setPendingRequests(res);
        } catch (error) {
            toast.error('Failed to load requests');
        }
    };

    const fetchPreAuths = async () => {
        try {
            const res = await securityService.getPreAuthVisitors();
            setPreAuthList(res);
        } catch (error) {
            toast.error('Failed to load pre-authorized passes');
        }
    };

    const handleEntry = async (e) => {
        e.preventDefault();
        try {
            await securityService.logEntry(newVisitor);
            toast.success('Visitor Logged');
            setNewVisitor({ name: '', phone: '', purpose: 'Delivery', details: '' });
            setShowForm(false);
            fetchVisitors();
        } catch (error) {
            toast.error('Failed to log entry');
        }
    };

    const handleExit = async (id) => {
        try {
            await securityService.markExit(id);
            toast.success('Visitor Exited');
            fetchVisitors();
        } catch (error) {
            toast.error('Failed to mark exit');
        }
    };

    const handleRequestAction = async (id, status) => {
        try {
            await securityService.updateRequestStatus(id, status);
            toast.success(`Request ${status}`);
            fetchRequests();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const handlePreAuthCheckIn = async (e, directToken = null) => {
        if (e) e.preventDefault();
        const tokenToVerify = directToken || checkInToken;
        if (!tokenToVerify || !tokenToVerify.trim()) {
            toast.error('Please enter a valid pass token');
            return;
        }

        setVerifying(true);
        try {
            const res = await securityService.checkInPreAuthVisitor(tokenToVerify.trim());
            if (res.success) {
                toast.success(res.message || 'Visitor Checked In Successfully!');
                setCheckInToken('');
                fetchPreAuths();
                fetchVisitors();
            } else {
                toast.error(res.message || 'Failed to verify pass');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid or already used pass token');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Security & Visitors" subtitle="Live visitor tracking and guest approvals" />

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('visitors')}
                    className={`pb-2 px-1 ${activeTab === 'visitors' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-slate-500'}`}
                >
                    Visitor Log
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-2 px-1 ${activeTab === 'requests' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-slate-500'}`}
                >
                    Guest Requests
                    {pendingRequests.length > 0 && <span className="ml-2 bg-red-100 text-red-600 px-2 rounded-full text-xs">{pendingRequests.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('preauth')}
                    className={`pb-2 px-1 ${activeTab === 'preauth' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-slate-500'}`}
                >
                    QR Pre-Authorizations
                </button>
            </div>

            {activeTab === 'visitors' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Visitor Form */}
                    <Card title="Log New Entry" className="lg:col-span-1 h-fit">
                        <form onSubmit={handleEntry} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Name</label>
                                <input required type="text" className="w-full rounded-md border-slate-300 mt-1"
                                    value={newVisitor.name} onChange={e => setNewVisitor({ ...newVisitor, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Phone</label>
                                <input required type="text" className="w-full rounded-md border-slate-300 mt-1"
                                    value={newVisitor.phone} onChange={e => setNewVisitor({ ...newVisitor, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Purpose</label>
                                <select className="w-full rounded-md border-slate-300 mt-1"
                                    value={newVisitor.purpose} onChange={e => setNewVisitor({ ...newVisitor, purpose: e.target.value })}>
                                    <option>Delivery</option>
                                    <option>Visit</option>
                                    <option>Maintenance</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Details</label>
                                <input type="text" placeholder="Whom to meet?" className="w-full rounded-md border-slate-300 mt-1"
                                    value={newVisitor.details} onChange={e => setNewVisitor({ ...newVisitor, details: e.target.value })} />
                            </div>
                            <Button type="submit" className="w-full">Log Entry</Button>
                        </form>
                    </Card>

                    {/* Active Visitors List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-semibold text-slate-700 mb-2">Currently Inside ({activeVisitors.length})</h3>
                        {activeVisitors.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-lg text-slate-500">No visitors currently inside.</div>
                        ) : (
                            activeVisitors.map(v => (
                                <div key={v._id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
                                            <UserPlus size={20} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800">{v.name}</div>
                                            <div className="text-sm text-slate-500">{v.purpose} • {v.details}</div>
                                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <Clock size={12} />
                                                In since {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleExit(v._id)} className="text-red-600 border-red-200 hover:bg-red-50">
                                        Mark Exit
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="space-y-4">
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg text-slate-500">No pending guest requests.</div>
                    ) : (
                        pendingRequests.map(req => (
                            <div key={req._id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-800">Guest: {req.guest_name}</h4>
                                        <p className="text-slate-600">Relation: {req.relation}</p>
                                        <div className="mt-2 text-sm bg-slate-100 inline-block px-3 py-1 rounded">
                                            {new Date(req.fromDate).toDateString()} — {new Date(req.toDate).toDateString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRequestAction(req._id, 'APPROVED')}
                                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors tooltip"
                                            title="Approve"
                                        >
                                            <CheckCircle size={24} />
                                        </button>
                                        <button
                                            onClick={() => handleRequestAction(req._id, 'REJECTED')}
                                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors tooltip"
                                            title="Reject"
                                        >
                                            <XCircle size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'preauth' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Scan/Enter QR Pass Card */}
                    <Card title="Scan or Enter QR Pass" className="lg:col-span-1 h-fit">
                        <form onSubmit={(e) => handlePreAuthCheckIn(e)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Pass Token / QR Data</label>
                                <input 
                                    required 
                                    type="text" 
                                    placeholder="e.g. pass_abc123xyz"
                                    className="w-full rounded-md border-slate-300 mt-1 font-mono tracking-wider"
                                    value={checkInToken} 
                                    onChange={e => setCheckInToken(e.target.value)} 
                                />
                                <p className="text-slate-400 text-xs mt-2">
                                    Type the unique token code generated by the tenant or scan their digital visitor pass.
                                </p>
                            </div>
                            <Button type="submit" disabled={verifying} className="w-full">
                                {verifying ? 'Verifying...' : 'Verify & Check-In'}
                            </Button>
                        </form>
                    </Card>

                    {/* Pre-authorized list */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-semibold text-slate-700 mb-2 font-semibold">Pre-Authorized Visitor Passes ({preAuthList.length})</h3>
                        {preAuthList.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-lg text-slate-500">No tenant pre-authorizations created yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {preAuthList.map(item => {
                                    const tenantName = item.tenant_id?.user_id?.name || 'Tenant';
                                    const roomNo = item.tenant_id?.room_id?.number || 'N/A';
                                    const isPending = item.status === 'PENDING';
                                    const isCheckedIn = item.status === 'CHECKED_IN';

                                    return (
                                        <div key={item._id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center transition-all hover:shadow-md">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-full ${isCheckedIn ? 'bg-green-50 text-green-600' : 'bg-primary-50 text-primary-600'}`}>
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-800">{item.name}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                            isCheckedIn ? 'bg-green-100 text-green-800' : 
                                                            item.status === 'EXPIRED' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-slate-500 mt-0.5">
                                                        Phone: <span className="font-medium text-slate-700">{item.phone}</span> • Purpose: <span className="font-medium text-slate-700">{item.purpose}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        Authorized by: <span className="text-slate-600 font-semibold">{tenantName} (Room {roomNo})</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-0.5">
                                                        Visit Date: <span className="text-slate-600 font-semibold">{new Date(item.visitDate).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                                                        TOKEN: <span className="text-slate-600 bg-slate-50 px-1 rounded border font-bold">{item.qrCodeToken}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isPending && (
                                                <Button 
                                                    variant="primary" 
                                                    size="sm" 
                                                    onClick={() => handlePreAuthCheckIn(null, item.qrCodeToken)}
                                                    className="bg-green-600 border-green-600 hover:bg-green-700 text-white shadow-sm"
                                                >
                                                    Instant Check-In
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitorLog;
