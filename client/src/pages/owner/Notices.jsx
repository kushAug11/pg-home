import React, { useState, useEffect } from 'react';
import ownerService from '../../services/owner.service';
import { Trash2, Megaphone, Info, AlertTriangle, Calendar } from 'lucide-react';
import Skeleton from '../../components/common/Skeleton';

const OwnerNotices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('Info');
    const [submitting, setSubmitting] = useState(false);

    const fetchNotices = async () => {
        try {
            const res = await ownerService.getNotices();
            if (res.success) {
                setNotices(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await ownerService.createNotice({ title, message, type });
            if (res.success) {
                setNotices([res.data, ...notices]);
                setTitle('');
                setMessage('');
                setType('Info');
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || 'Failed to post notice';
            alert(`Error: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notice?')) return;
        try {
            await ownerService.deleteNotice(id);
            setNotices(notices.filter(n => n._id !== id));
        } catch (error) {
            alert('Failed to delete notice');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Urgent': return <AlertTriangle className="text-red-500" size={20} />;
            case 'Event': return <Calendar className="text-purple-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Create Notice Form */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                <div className="flex items-center space-x-2 mb-4">
                    <Megaphone className="text-primary" />
                    <h2 className="text-xl font-bold text-slate-800">Post New Notice</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                            id="title"
                            type="text"
                            required
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="e.g., Water Tank Cleaning"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                            id="type"
                            className="w-full border p-2 rounded-lg outline-none"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="Info">ℹ️ Info</option>
                            <option value="Urgent">🚨 Urgent</option>
                            <option value="Event">📅 Event</option>
                            <option value="Maintenance">🔧 Maintenance</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                        <textarea
                            id="message"
                            required
                            className="w-full border p-2 rounded-lg h-32 resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Details about the announcement..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-70"
                    >
                        {submitting ? 'Posting...' : 'Post Notice'}
                    </button>
                </form>
            </div>

            {/* Right: Notice History */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Previous Notices</h2>

                {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                ) : notices.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-400">No notices posted yet.</p>
                    </div>
                ) : (
                    notices.map((notice) => (
                        <div key={notice._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:border-primary/30 transition-colors">
                            <button
                                onClick={() => handleDelete(notice._id)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-full flex-shrink-0 ${notice.type === 'Urgent' ? 'bg-red-50' : 'bg-slate-50'}`}>
                                    {getTypeIcon(notice.type)}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-bold text-slate-800 text-lg">{notice.title}</h3>
                                        <span className="text-xs text-slate-400">• {new Date(notice.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">{notice.message}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OwnerNotices;
