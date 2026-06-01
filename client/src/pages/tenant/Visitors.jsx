import React, { useState, useEffect } from 'react';
import tenantService from '../../services/tenant.service';
import { Calendar, User, Phone, Briefcase, Plus, Ticket, CheckCircle, Clock, Copy, ExternalLink, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

const Visitors = () => {
    const [visitors, setVisitors] = useState([]);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [purpose, setPurpose] = useState('Visit');
    const [visitDate, setVisitDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const fetchVisitors = async () => {
        try {
            setFetching(true);
            const res = await tenantService.getPreAuthVisitors();
            if (res.success) {
                setVisitors(res.data);
            }
        } catch (error) {
            console.error('Error fetching pre-auth visitors:', error);
            toast.error('Failed to load pre-authorized passes');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchVisitors();
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        setVisitDate(today);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim() || !visitDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const res = await tenantService.createPreAuthVisitor({
                name,
                phone,
                purpose,
                visitDate
            });

            if (res.success) {
                toast.success('Pre-authorized pass generated!');
                setName('');
                setPhone('');
                setPurpose('Visit');
                // Reset to today
                const today = new Date().toISOString().split('T')[0];
                setVisitDate(today);
                setShowForm(false);
                fetchVisitors();
            } else {
                toast.error('Failed to create pass');
            }
        } catch (error) {
            console.error('Error creating visitor pass:', error);
            toast.error('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (token) => {
        navigator.clipboard.writeText(token);
        toast.success('Pass token copied to clipboard!');
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
            {/* Header section with high-quality visual elements */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <QrCode className="text-primary-600 w-8 h-8" />
                        Pre-Authorized Visitor Passes
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">
                        Authorize delivery agents, guests, or maintenance staff in advance. Share the QR pass for smooth gate entry.
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg ${
                            showForm 
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-700 hover:to-indigo-700'
                        }`}
                    >
                        {showForm ? 'Cancel' : <><Plus size={18} /> Create New Pass</>}
                    </button>
                </div>
            </div>

            {/* Create Pass Collapsible Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Ticket className="text-primary-500" />
                        New Visitor Pre-Authorization Form
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-slate-700 font-semibold text-sm">Visitor Name *</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                        <User size={18} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="e.g. John Doe, Amazon Agent"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-slate-700 font-semibold text-sm">Visitor Phone Number *</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                        <Phone size={18} />
                                    </span>
                                    <input
                                        type="tel"
                                        placeholder="e.g. 9876543210"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-slate-700 font-semibold text-sm">Purpose of Visit</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                        <Briefcase size={18} />
                                    </span>
                                    <select
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none bg-white appearance-none"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                    >
                                        <option value="Delivery">Delivery / Courier</option>
                                        <option value="Visit">Guest / Visit</option>
                                        <option value="Maintenance">Maintenance / Service</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-slate-700 font-semibold text-sm">Expected Visit Date *</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                        <Calendar size={18} />
                                    </span>
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        value={visitDate}
                                        onChange={(e) => setVisitDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? 'Generating Pass...' : 'Generate Digital Pass'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Passes grid list */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Ticket className="text-indigo-500" />
                    Authorized Visitors Pass History
                </h2>

                {fetching ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                        <p className="text-slate-500 font-medium text-sm">Loading passes...</p>
                    </div>
                ) : visitors.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 px-6 text-center shadow-sm">
                        <QrCode className="mx-auto text-slate-300 w-16 h-16 mb-4 animate-pulse" />
                        <h3 className="text-lg font-bold text-slate-700">No Visitor Passes Raised</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
                            When you have visitors like friends, family, or couriers coming, pre-authorize them here to avoid security delays at the entrance.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-6 inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold transition"
                        >
                            <Plus size={16} /> Create Your First Pass
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {visitors.map((visitor) => {
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${visitor.qrCodeToken}`;
                            const isPending = visitor.status === 'PENDING';
                            const isCheckedIn = visitor.status === 'CHECKED_IN';
                            
                            return (
                                <div 
                                    key={visitor._id} 
                                    className={`relative bg-white rounded-3xl shadow-md border overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 ${
                                        isCheckedIn ? 'border-green-100' : 'border-slate-100'
                                    }`}
                                >
                                    {/* Color header tag based on status */}
                                    <div className={`h-2 w-full ${
                                        isCheckedIn ? 'bg-green-500' : 
                                        visitor.status === 'EXPIRED' ? 'bg-slate-400' : 'bg-primary-500'
                                    }`} />

                                    {/* Voucher / Card layout */}
                                    <div className="p-6 flex-1 flex flex-col items-center justify-between">
                                        
                                        {/* Header info */}
                                        <div className="w-full flex items-start justify-between mb-4">
                                            <div>
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider flex items-center gap-1.5 ${
                                                    isCheckedIn 
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : visitor.status === 'EXPIRED'
                                                        ? 'bg-slate-50 text-slate-600 border-slate-200'
                                                        : 'bg-primary-50 text-primary-700 border-primary-200'
                                                }`}>
                                                    {isCheckedIn ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                    {visitor.status}
                                                </span>
                                            </div>
                                            <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full font-medium">
                                                {visitor.purpose}
                                            </span>
                                        </div>

                                        {/* QR code image block */}
                                        <div className="my-3 relative bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-slate-100 transition-colors">
                                            <img 
                                                src={qrUrl} 
                                                alt="Entry Pass QR" 
                                                className={`w-40 h-40 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 ${
                                                    !isPending && 'opacity-30 grayscale'
                                                }`}
                                            />
                                            {!isPending && (
                                                <div className="absolute inset-0 flex items-center justify-center font-extrabold text-slate-700 text-sm tracking-wider uppercase bg-white/40 backdrop-blur-[1px] rounded-2xl">
                                                    {visitor.status}
                                                </div>
                                            )}
                                        </div>

                                        {/* Visitor info details */}
                                        <div className="w-full text-center space-y-1 my-4">
                                            <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">{visitor.name}</h3>
                                            <p className="text-slate-500 text-sm font-medium">{visitor.phone}</p>
                                            <p className="text-slate-400 text-xs flex items-center justify-center gap-1.5 pt-1">
                                                <Calendar size={14} />
                                                Expected: {new Date(visitor.visitDate).toLocaleDateString(undefined, { 
                                                    weekday: 'short', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>

                                        {/* Footer voucher details */}
                                        <div className="w-full border-t border-dashed border-slate-200 pt-4 flex flex-col gap-3">
                                            <div className="bg-slate-50 rounded-xl px-3 py-2 text-center text-xs font-mono font-bold text-slate-600 flex items-center justify-between group-hover:bg-slate-100 transition-colors">
                                                <span className="text-slate-400 text-[10px]">PASS TOKEN:</span>
                                                <span className="tracking-widest">{visitor.qrCodeToken}</span>
                                                <button 
                                                    onClick={() => copyToClipboard(visitor.qrCodeToken)}
                                                    className="text-slate-400 hover:text-slate-700 p-0.5"
                                                    title="Copy Token"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>

                                            {isPending && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => copyToClipboard(visitor.qrCodeToken)}
                                                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                                                    >
                                                        Copy & Share Pass
                                                    </button>
                                                    <a
                                                        href={qrUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition flex items-center justify-center border border-slate-200"
                                                        title="Open QR Fullscreen"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Visitors;
