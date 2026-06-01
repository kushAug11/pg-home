import React, { useState, useEffect } from 'react';
import ownerService from '../../services/owner.service';
import PageHeader from '../../components/common/PageHeader';
import { Calendar, Phone, Mail, MessageSquare, CheckCircle, XCircle, Clock, User, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const VisitRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    const fetchRequests = async () => {
        try {
            const res = await ownerService.getVisitRequests();
            if (res.success) setRequests(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const res = await ownerService.updateVisitStatus(id, { status: newStatus });
            if (res.success) {
                toast.success(`Marked as ${newStatus}`);
                setRequests(prev => prev.map(req => req._id === id ? { ...req, status: newStatus } : req));
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredRequests = filter === 'All'
        ? requests
        : requests.filter(r => r.status === filter);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            case 'Contacted': return 'bg-blue-100 text-blue-700';
            case 'Scheduled': return 'bg-purple-100 text-purple-700';
            case 'Visited': return 'bg-orange-100 text-orange-700';
            case 'Converted': return 'bg-green-100 text-green-700';
            case 'Closed': return 'bg-slate-100 text-slate-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <PageHeader title="Visit Requests" subtitle="Manage leads and public inquiries" />

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-white p-2 rounded-lg border border-slate-200 overflow-x-auto">
                {['All', 'Pending', 'Contacted', 'Scheduled', 'Visited', 'Converted', 'Closed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                            ${filter === status ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p>No {filter !== 'All' ? filter : ''} requests found.</p>
                        </div>
                    ) : filteredRequests.map(req => (
                        <div key={req._id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{req.name}</h3>
                                            <p className="text-xs text-slate-500">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(req.status)}`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone size={16} className="text-slate-400" /> {req.phone}
                                    </div>
                                    {req.email && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail size={16} className="text-slate-400" /> {req.email}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Calendar size={16} className="text-slate-400" /> Visit: <strong>{new Date(req.visitDate).toLocaleDateString()}</strong>
                                    </div>
                                    {req.notes && (
                                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic">
                                            "{req.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Update Status</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                    value={req.status}
                                    onChange={(e) => handleStatusUpdate(req._id, e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Contacted">Mark as Contacted</option>
                                    <option value="Scheduled">Visit Scheduled</option>
                                    <option value="Visited">Visited</option>
                                    <option value="Converted">Converted (Tenant)</option>
                                    <option value="Closed">Closed / Not Interested</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VisitRequests;
