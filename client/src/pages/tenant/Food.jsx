import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import messService from '../../services/mess.service';
import { toast } from 'react-hot-toast';
import { Utensils, XCircle, CheckCircle, Ticket, QrCode, Plus, Calendar, User, DollarSign, Clock, HelpCircle, ExternalLink } from 'lucide-react';

const Food = () => {
    const [activeTab, setActiveTab] = useState('menu'); // menu | vouchers
    const [menu, setMenu] = useState({ breakfast: '', lunch: '', dinner: '', snacks: '' });
    const [vouchers, setVouchers] = useState([]);
    
    // Purchase Form State
    const [mealType, setMealType] = useState('Lunch');
    const [isGuestVoucher, setIsGuestVoucher] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showBuyForm, setShowBuyForm] = useState(false);
    const [selectedVoucherForModal, setSelectedVoucherForModal] = useState(null);

    const [loading, setLoading] = useState(false);
    const date = new Date().toISOString().split('T')[0];

    // Static Prices Heuristic
    const getPrice = (type) => {
        switch (type) {
            case 'Breakfast': return 50;
            case 'Lunch': return 80;
            case 'Dinner': return 80;
            case 'Special': return 150;
            default: return 80;
        }
    };

    useEffect(() => {
        if (activeTab === 'menu') fetchMenu();
        else fetchVouchers();
    }, [activeTab]);

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const res = await messService.getMenu(date);
            if (res && res.length > 0) {
                setMenu(res[0].meals);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const res = await messService.getMyVouchers();
            if (res.success) {
                setVouchers(res.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load vouchers');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async (meal) => {
        try {
            await messService.markAttendance(date, meal, 'skipped');
            toast.success(`Marked ${meal} as skipped`);
        } catch (error) {
            toast.error('Failed to update attendance');
        }
    };

    const handleEat = async (meal) => {
        try {
            await messService.markAttendance(date, meal, 'eating');
            toast.success(`Marked ${meal} as eating`);
        } catch (error) {
            toast.error('Failed to update attendance');
        }
    };

    const handleBuyVoucher = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const price = getPrice(mealType);
            const res = await messService.purchaseVoucher({
                mealType,
                price,
                isGuestVoucher,
                guestName: isGuestVoucher ? guestName : ''
            });

            if (res.success) {
                toast.success('Meal coupon purchased! Added to next rent bill.');
                setMealType('Lunch');
                setIsGuestVoucher(false);
                setGuestName('');
                setShowBuyForm(false);
                fetchVouchers();
            } else {
                toast.error('Purchase failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Server error. Purchase failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 animate-fadeIn">
            <PageHeader title="Food, Menu & Mess Services" subtitle="Daily food charts and add-on meal billing" />

            {/* Tab switch navigation */}
            <div className="flex space-x-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`pb-3 px-1 text-sm font-bold transition-all ${
                        activeTab === 'menu' 
                            ? 'border-b-2 border-primary-600 text-primary-600 font-extrabold' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    🍳 Daily Menu & Attendance
                </button>
                <button
                    onClick={() => setActiveTab('vouchers')}
                    className={`pb-3 px-1 text-sm font-bold transition-all ${
                        activeTab === 'vouchers' 
                            ? 'border-b-2 border-primary-600 text-primary-600 font-extrabold' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    🎫 Meal Coupons (Add-On)
                </button>
            </div>

            {/* Tab 1: Menu & skip logs */}
            {activeTab === 'menu' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Attendance Marking Date</span>
                        <span className="text-slate-800 font-extrabold text-sm flex items-center gap-1.5">
                            <Calendar size={16} className="text-primary-500" />
                            {new Date().toDateString()}
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                                    <div className="animate-pulse bg-slate-200 rounded h-6 w-24" />
                                    <div className="animate-pulse bg-slate-200 rounded h-10 w-full" />
                                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                                        <div className="animate-pulse bg-slate-200 rounded-lg h-10 flex-1" />
                                        <div className="animate-pulse bg-slate-200 rounded-lg h-10 flex-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['breakfast', 'lunch', 'snacks', 'dinner'].map((meal) => (
                                <Card key={meal} className="hover:shadow-md transition-shadow duration-300 rounded-2xl border border-slate-150 overflow-hidden flex flex-col justify-between min-h-[200px]">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-850 capitalize flex items-center gap-2">
                                            <Utensils size={18} className="text-primary-600" />
                                            {meal}
                                        </h3>
                                        <p className="mt-4 text-slate-700 text-lg font-medium leading-relaxed">
                                            {menu[meal] || <span className="text-slate-400 italic text-sm">No menu set for today</span>}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                                        <button
                                            onClick={() => handleEat(meal)}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 font-bold flex items-center justify-center gap-1.5 transition text-xs uppercase tracking-wider border border-green-150"
                                        >
                                            <CheckCircle size={14} />
                                            I'm Eating
                                        </button>
                                        <button
                                            onClick={() => handleSkip(meal)}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold flex items-center justify-center gap-1.5 transition text-xs uppercase tracking-wider border border-rose-150"
                                        >
                                            <XCircle size={14} />
                                            Skip Meal
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Vouchers */}
            {activeTab === 'vouchers' && (
                <div className="space-y-8">
                    {/* Header info / Action */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 gap-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <Ticket className="text-primary-600" />
                                Extra Meal Coupons
                            </h2>
                            <p className="text-slate-500 text-xs mt-1">
                                Purchase breakfast, lunch, or dinner coupons. Charges are automatically billed to your next rent receipt.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={() => setShowBuyForm(!showBuyForm)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-md transition transform hover:-translate-y-0.5 hover:shadow-lg ${
                                    showBuyForm 
                                        ? 'bg-slate-150 text-slate-700 hover:bg-slate-200 border border-slate-200' 
                                        : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white'
                                }`}
                            >
                                {showBuyForm ? 'Cancel' : <><Plus size={16} /> Purchase Coupon</>}
                            </button>
                        </div>
                    </div>

                    {/* Purchase voucher form */}
                    {showBuyForm && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xl max-w-xl mx-auto transform hover:scale-[1.01] transition-all duration-300">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-3">
                                <Plus className="text-primary-600" />
                                Purchase Meal Coupon
                            </h3>
                            <form onSubmit={handleBuyVoucher} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-slate-700 font-bold text-sm">Meal Category</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { type: 'Breakfast', price: 50 },
                                            { type: 'Lunch', price: 80 },
                                            { type: 'Dinner', price: 80 },
                                            { type: 'Special', price: 150 }
                                        ].map(item => (
                                            <button
                                                type="button"
                                                key={item.type}
                                                onClick={() => setMealType(item.type)}
                                                className={`p-4 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-1 ${
                                                    mealType === item.type 
                                                        ? 'bg-primary-50 border-primary-600 text-primary-700 font-extrabold shadow-sm' 
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="text-sm">{item.type}</span>
                                                <span className="text-xs opacity-75">₹{item.price}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <input 
                                        type="checkbox" 
                                        id="guestCheck"
                                        checked={isGuestVoucher}
                                        onChange={(e) => setIsGuestVoucher(e.target.checked)}
                                        className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-slate-300 transition"
                                    />
                                    <label htmlFor="guestCheck" className="text-sm font-semibold text-slate-750 cursor-pointer">
                                        This coupon is for a visiting guest / parent
                                    </label>
                                </div>

                                {isGuestVoucher && (
                                    <div className="space-y-2 animate-fadeIn">
                                        <label className="block text-slate-700 font-bold text-sm">Guest Name</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                                <User size={18} />
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="e.g. John Doe (Father)"
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transitionoutline-none"
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-700 space-y-1.5 leading-relaxed">
                                    <p className="font-bold flex items-center gap-1.5">
                                        <DollarSign size={14} /> Total Billed Amount: ₹{getPrice(mealType)}
                                    </p>
                                    <p className="opacity-80">
                                        Note: You do not need to pay right now. This coupon amount will be dynamically packaged and billed to your next monthly rent invoice automatically.
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-end pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowBuyForm(false)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition disabled:opacity-50"
                                    >
                                        {submitting ? 'Ordering...' : 'Order & Bill to Rent'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Vouchers list history */}
                    {loading && vouchers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                            <p className="text-slate-500 text-xs font-semibold">Loading vouchers...</p>
                        </div>
                    ) : vouchers.length === 0 ? (
                        <div className="bg-white border border-dashed rounded-3xl p-16 text-center shadow-sm">
                            <Ticket className="mx-auto text-slate-300 w-16 h-16 mb-4 animate-pulse" />
                            <h4 className="font-bold text-slate-700 text-lg">No Meal Coupons Ordered</h4>
                            <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                                If you want to invite friends, relatives, or buy a special lunch coupon that gets billed directly to your monthly invoice, order one above.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {vouchers.map(v => {
                                const isUnused = v.status === 'UNUSED';
                                const isUsed = v.status === 'USED';
                                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${v.voucherCode}`;

                                return (
                                    <button
                                        key={v._id}
                                        onClick={() => setSelectedVoucherForModal(v)}
                                        className={`bg-white rounded-3xl border text-left overflow-hidden relative flex flex-col group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                                            isUsed ? 'border-green-150 hover:border-green-200' : 'border-slate-200'
                                        }`}
                                    >
                                        {/* Status Header Pill */}
                                        <div className={`h-2 w-full ${
                                            isUnused ? 'bg-primary-500 animate-pulse' : 
                                            isUsed ? 'bg-green-500' : 'bg-slate-400'
                                        }`} />

                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4 w-full">
                                            {/* Top info */}
                                            <div className="flex justify-between items-start w-full">
                                                <div>
                                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider ${
                                                        isUnused ? 'bg-primary-50 text-primary-700 border-primary-200' :
                                                        isUsed ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {v.status}
                                                    </span>
                                                </div>
                                                <span className="text-slate-800 font-extrabold text-lg">
                                                    ₹{v.price}
                                                </span>
                                            </div>

                                            {/* Coupon core */}
                                            <div className="space-y-1.5">
                                                <h4 className="font-extrabold text-slate-800 tracking-tight text-base flex items-center gap-1.5">
                                                    <Utensils size={16} className="text-primary-600" />
                                                    {v.mealType} Coupon
                                                </h4>
                                                {v.isGuestVoucher && (
                                                    <p className="text-slate-500 text-xs font-semibold">
                                                        Guest: <span className="text-slate-800 font-bold">{v.guestName}</span>
                                                    </p>
                                                )}
                                                <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1">
                                                    <Clock size={12} />
                                                    Ordered: {new Date(v.purchaseDate).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {/* Barcode code visual footer */}
                                            <div className="border-t border-dashed border-slate-200 pt-3 flex items-center justify-between">
                                                <span className="text-xs font-mono font-bold tracking-wider text-slate-600 bg-slate-50 px-2 py-0.5 border rounded">
                                                    {v.voucherCode}
                                                </span>
                                                {isUnused && (
                                                    <span className="text-[10px] text-primary-600 font-extrabold flex items-center gap-1 hover:underline">
                                                        <QrCode size={14} /> Scan Coupon
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Voucher scan details zoom Modal */}
            {selectedVoucherForModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-6 relative transform scale-100 transition-all duration-300">
                        <button 
                            onClick={() => setSelectedVoucherForModal(null)}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full"
                        >
                            <XCircle size={24} />
                        </button>

                        <div className="space-y-1 pb-2 border-b border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 flex items-center justify-center gap-1.5">
                                <Ticket size={22} className="text-primary-600" />
                                {selectedVoucherForModal.mealType} Coupon
                            </h3>
                            <p className="text-slate-400 text-xs font-semibold">Mess Entry Food Pass</p>
                        </div>

                        {/* Barcode QR */}
                        <div className="bg-slate-50 border p-6 rounded-2xl inline-block shadow-inner relative">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedVoucherForModal.voucherCode}`}
                                alt="Meal Pass QR"
                                className={`w-44 h-44 mx-auto object-contain rounded-lg ${
                                    selectedVoucherForModal.status !== 'UNUSED' && 'opacity-25 grayscale'
                                }`}
                            />
                            {selectedVoucherForModal.status !== 'UNUSED' && (
                                <div className="absolute inset-0 flex items-center justify-center font-black text-lg text-slate-700 bg-white/40 tracking-wider uppercase backdrop-blur-[1px] rounded-2xl">
                                    {selectedVoucherForModal.status}
                                </div>
                            )}
                        </div>

                        {/* Voucher Info */}
                        <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border text-left">
                            <div className="flex justify-between font-bold">
                                <span>Status:</span>
                                <span className="uppercase text-primary-650 font-black">{selectedVoucherForModal.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Coupon Code:</span>
                                <span className="font-mono font-bold text-slate-800">{selectedVoucherForModal.voucherCode}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Price Billed:</span>
                                <span className="font-bold text-slate-800">₹{selectedVoucherForModal.price}</span>
                            </div>
                            {selectedVoucherForModal.isGuestVoucher && (
                                <div className="flex justify-between">
                                    <span>Guest Name:</span>
                                    <span className="font-bold text-slate-800">{selectedVoucherForModal.guestName}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Ordered On:</span>
                                <span className="font-semibold text-slate-800">{new Date(selectedVoucherForModal.purchaseDate).toLocaleString()}</span>
                            </div>
                            {selectedVoucherForModal.useDate && (
                                <div className="flex justify-between">
                                    <span>Used On:</span>
                                    <span className="font-semibold text-slate-800">{new Date(selectedVoucherForModal.useDate).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold leading-normal">
                            Show this QR Code coupon to the mess security manager or guard at the dining room entrance to verify your add-on meal entry.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Food;
