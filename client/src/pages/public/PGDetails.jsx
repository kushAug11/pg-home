import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import publicService from '../../services/public.service';
import { MapPin, Phone, CheckCircle, ArrowRight, Calendar, User, Mail, DollarSign } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const PublicPGDetails = () => {
    const { id } = useParams();
    const [pg, setPg] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [requestData, setRequestData] = useState({ name: '', phone: '', email: '', visitDate: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await publicService.getPGDetails(id);
                if (res.success) setPg(res.data);
            } catch (error) {
                console.error(error);
                toast.error('PG not found');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await publicService.submitVisitRequest({ ...requestData, pg_id: id });
            if (res.success) {
                toast.success('Request submitted! The owner will contact you.');
                setRequestData({ name: '', phone: '', email: '', visitDate: '', notes: '' });
            }
        } catch (error) {
            toast.error('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!pg) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">PG Not Found</h1>
                <Link to="/" className="text-primary-600 hover:text-primary-700 underline">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link to="/" className="text-2xl font-display font-bold text-primary-600">
                            Hostel<span className="text-slate-900">Aura</span>
                        </Link>
                        <div className="hidden md:flex space-x-8">
                            <Link to="/features" className="text-slate-600 hover:text-primary-600 font-medium">Features</Link>
                            <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium">Login</Link>
                            <Button size="sm">Get Started</Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header Image Placeholder */}
                        <div className="h-64 md:h-80 bg-slate-200 rounded-2xl overflow-hidden relative">
                            {/* In real app, map over pg.images */}
                            <img src={`https://source.unsplash.com/random/1200x800/?hostel,bedroom,modern`} alt="PG Cover" className="w-full h-full object-cover" />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-800 border border-slate-100">
                                {pg.type} Only
                            </div>
                        </div>

                        <div>
                            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">{pg.name}</h1>
                            <div className="flex items-center text-slate-500 mb-6">
                                <MapPin size={18} className="mr-2" />
                                {pg.address}, {pg.city}
                            </div>

                            <div className="flex flex-wrap gap-4 mb-8">
                                <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 border border-emerald-100">
                                    <div className="bg-white p-2 rounded-full shadow-sm"><DollarSign size={20} className="text-emerald-600" /></div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide opacity-80">Starting From</p>
                                        <p className="font-bold text-xl">₹{pg.startingPrice}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-slate max-w-none">
                                <h3 className="text-xl font-bold text-slate-800 mb-4">About this PG</h3>
                                <p className="text-slate-600 leading-relaxed">{pg.description || 'A comfortable and secure PG with modern amenities.'}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Amenities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {pg.facilities.map((facility, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                        <CheckCircle size={18} className="text-primary-600 flex-shrink-0" />
                                        <span className="font-medium text-slate-700">{facility}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Booking Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Book a Visit</h2>
                                <p className="text-slate-500 mb-6">Fill the form below to schedule a visit or request a call back.</p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Your Name"
                                        icon={<User size={18} />}
                                        value={requestData.name}
                                        onChange={e => setRequestData({ ...requestData, name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Phone Number"
                                        icon={<Phone size={18} />}
                                        value={requestData.phone}
                                        onChange={e => setRequestData({ ...requestData, phone: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Email (Optional)"
                                        type="email"
                                        icon={<Mail size={18} />}
                                        value={requestData.email}
                                        onChange={e => setRequestData({ ...requestData, email: e.target.value })}
                                    />
                                    <Input
                                        label="Preferred Date"
                                        type="date"
                                        icon={<Calendar size={18} />}
                                        value={requestData.visitDate}
                                        onChange={e => setRequestData({ ...requestData, visitDate: e.target.value })}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Questions</label>
                                        <textarea
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                            rows="3"
                                            value={requestData.notes}
                                            onChange={e => setRequestData({ ...requestData, notes: e.target.value })}
                                            placeholder="Any specific requirements?"
                                        ></textarea>
                                    </div>

                                    <Button className="w-full py-3 text-lg shadow-lg shadow-primary-500/30" isLoading={submitting}>
                                        Submit Request <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                </form>
                                <p className="text-center text-xs text-slate-400 mt-4">No payment required to book a visit.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default PublicPGDetails;
