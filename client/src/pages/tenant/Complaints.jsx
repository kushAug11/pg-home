import React, { useState, useEffect } from 'react';
import tenantService from '../../services/tenant.service';

const Complaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Other');
    const [priority, setPriority] = useState('Medium');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchComplaints = async () => {
        try {
            const res = await tenantService.getComplaints();
            if (res.success) {
                setComplaints(res.data);
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await tenantService.raiseComplaint({ title, description, category, priority });
            if (res.success) {
                setMessage('Complaint raised successfully!');
                setTitle('');
                setDescription('');
                setCategory('Other');
                setPriority('Medium');
                fetchComplaints();
            } else {
                setMessage('Failed to raise complaint.');
            }
        } catch (error) {
            console.error("Complaint Error", error);
            setMessage('Server Error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Complaints & Issues</h1>

            {/* Raise Complaint Form */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 mb-8">
                <h2 className="text-xl font-semibold mb-4">Raise a New Complaint</h2>
                {message && <p className={`mb-4 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="title" className="block text-slate-700 mb-1">Title / Subject</label>
                            <input
                                id="title"
                                type="text"
                                className="w-full border p-2 rounded"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-slate-700 mb-1">Category</label>
                            <select
                                id="category"
                                className="w-full border p-2 rounded"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="WiFi">WiFi / Internet</option>
                                <option value="Plumbing">Plumbing</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Food">Food / Mess</option>
                                <option value="Cleaning">Cleaning / Housekeeping</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="priority" className="block text-slate-700 mb-1">Priority</label>
                            <select
                                id="priority"
                                className="w-full border p-2 rounded"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>


                    <div>
                        <label htmlFor="description" className="block text-slate-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            className="w-full border p-2 rounded h-24"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                </form>
            </div>

            {/* Complaints List */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 className="text-xl font-semibold mb-4">Your Complaints History</h2>
                {complaints.length === 0 ? (
                    <p className="text-slate-500">No complaints found.</p>
                ) : (
                    <div className="space-y-4">
                        {complaints.map((c) => (
                            <div key={c._id} className="border p-4 rounded bg-slate-50 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-3 mb-1">
                                        <h3 className="font-bold text-lg">{c.title}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${c.priority === 'High' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {c.priority} Priority
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                                            {c.category}
                                        </span>
                                    </div>
                                    <p className="text-slate-600">{c.description}</p>

                                    {c.adminComment && (
                                        <div className="mt-3 p-3 bg-white border border-slate-200 rounded text-sm">
                                            <p className="font-semibold text-slate-800">Admin Response:</p>
                                            <p className="text-slate-600">{c.adminComment}</p>
                                        </div>
                                    )}

                                    <span className="text-xs text-slate-400 mt-2 block">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                        ${c.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                            c.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {c.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Complaints;
