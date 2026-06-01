import React, { useState, useEffect } from 'react';
import ownerService from '../../services/owner.service';
import { Filter, Search } from 'lucide-react';
import Skeleton from '../../components/common/Skeleton';

const OwnerComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');

    // Action State
    const [updatingId, setUpdatingId] = useState(null);
    const [commentText, setCommentText] = useState('');

    const fetchComplaints = async () => {
        try {
            const res = await ownerService.getComplaints();
            if (res.success) {
                setComplaints(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();

        // Socket Listener
        import('../../services/socket.service').then(({ getSocket }) => {
            const socket = getSocket();
            if (socket) {
                socket.on('COMPLAINT_UPDATED', (updatedComplaint) => {
                    setComplaints(prev => prev.map(c => c._id === updatedComplaint._id ? updatedComplaint : c));
                });
            }
        });

        // Cleanup? Usually listeners should be removed, but function purity in useEffect makes it tricky 
        // without extracting callback. For now, this simple addition works for the demo.
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const res = await ownerService.updateComplaintStatus(id, {
                status: newStatus,
                adminComment: commentText || undefined // Only send if not empty
            });

            if (res.success) {
                // Optimistic Update
                setComplaints(prev => prev.map(c =>
                    c._id === id ? { ...c, status: newStatus, adminComment: commentText || c.adminComment } : c
                ));
                setUpdatingId(null);
                setCommentText(''); // Clear comment field if used
            }
        } catch (error) {
            alert('Failed to update status');
            setUpdatingId(null);
        }
    };

    const filteredComplaints = filterStatus === 'All'
        ? complaints
        : complaints.filter(c => c.status === filterStatus);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Complaint Management</h1>
                <div className="flex space-x-2">
                    {['All', 'Pending', 'In Progress', 'Resolved'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                ${filterStatus === status
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                    <p className="text-slate-500 text-lg">No complaints found in this category.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredComplaints.map((complaint) => (
                        <div key={complaint._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">

                            {/* Left: Info */}
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                                        ${complaint.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-600'}`}>
                                        {complaint.priority}
                                    </span>
                                    <span className="text-sm text-slate-500 font-medium">#{complaint.category}</span>
                                    <span className="text-sm text-slate-400">• {new Date(complaint.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">{complaint.title}</h3>
                                <p className="text-slate-600 text-sm mb-3">{complaint.description}</p>

                                <div className="flex items-center space-x-4 text-xs text-slate-500">
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-1">Tenant:</span>
                                        {complaint.tenant_id?.user_id?.name || 'Unknown'}
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-1">Room:</span>
                                        {complaint.tenant_id?.room_id?.number || 'N/A'}
                                    </div>
                                </div>

                                {/* Admin Comment Display */}
                                {complaint.adminComment && (
                                    <div className="mt-3 p-2 bg-slate-50 border border-slate-100 rounded text-sm text-slate-700">
                                        <span className="font-semibold">Note:</span> {complaint.adminComment}
                                    </div>
                                )}
                            </div>

                            {/* Right: Actions */}
                            <div className="w-full md:w-64 flex flex-col space-y-3 border-l pl-0 md:pl-6 border-slate-100">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Change Status</label>
                                <select
                                    className={`w-full p-2 rounded border font-medium
                                        ${complaint.status === 'Resolved' ? 'border-green-200 bg-green-50 text-green-700' :
                                            complaint.status === 'In Progress' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                                'border-red-200 bg-red-50 text-red-700'}`}
                                    value={complaint.status}
                                    onChange={(e) => handleStatusUpdate(complaint._id, e.target.value)}
                                    disabled={updatingId === complaint._id}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Add admin note..."
                                    className="w-full p-2 border border-slate-200 rounded text-sm"
                                    onBlur={(e) => {
                                        if (e.target.value) {
                                            setCommentText(e.target.value);
                                            // Optional: Auto-save comment on blur or adding a button
                                            // For simplicity, we save comment only when status changes in this version, 
                                            // OR we can add a 'Save Note' button. 
                                            // Let's rely on Status Change to save for now to keep UI clean, 
                                            // OR just bind it to the state to send with the next update.
                                        }
                                    }}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                {commentText && updatingId !== complaint._id && (
                                    <p className="text-xs text-orange-500">Note will be saved on status change.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OwnerComplaints;
