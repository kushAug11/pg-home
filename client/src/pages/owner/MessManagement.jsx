import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import messService from '../../services/mess.service';
import Card from '../../components/common/Card';
import { toast } from 'react-hot-toast';
import { Calendar, Save, ChevronLeft, ChevronRight, Loader, Settings, Ticket, ShieldCheck, CheckCircle, Clock } from 'lucide-react';

const MessManagement = () => {
    const [activeTab, setActiveTab] = useState('menu'); // menu | vouchers

    // Helper to get start of week (Monday)
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
    const [weeklyMenu, setWeeklyMenu] = useState({}); // { 'YYYY-MM-DD': { breakfast: '', ... } }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Configurable Cols State
    const [visibleMeals, setVisibleMeals] = useState({
        breakfast: true,
        lunch: true,
        snacks: true,
        dinner: true
    });
    const [showConfig, setShowConfig] = useState(false);

    // Analytics State
    const [analytics, setAnalytics] = useState([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Meal Vouchers State
    const [vouchersList, setVouchersList] = useState([]);
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');
    const [verifying, setVerifying] = useState(false);

    // Days Array for looping
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const allMeals = ['breakfast', 'lunch', 'snacks', 'dinner'];

    useEffect(() => {
        if (activeTab === 'menu') {
            fetchWeeklyData();
        } else {
            fetchVouchers();
        }
    }, [currentWeekStart, activeTab]);

    // Fetch analytics for Today initially
    useEffect(() => {
        fetchAnalytics(new Date().toISOString().split('T')[0]);
    }, []);

    const fetchAnalytics = async (date) => {
        try {
            setLoadingAnalytics(true);
            const res = await messService.getAnalytics(date);
            if (res && res.stats) {
                setAnalytics(res.stats);
            }
        } catch (error) {
            console.error("Analytics error", error);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const fetchVouchers = async () => {
        try {
            setLoadingVouchers(true);
            const res = await messService.getVouchersList();
            setVouchersList(res);
        } catch (error) {
            console.error("Vouchers fetch error", error);
            toast.error("Failed to load meal vouchers");
        } finally {
            setLoadingVouchers(false);
        }
    };

    const getWeekRange = () => {
        const start = new Date(currentWeekStart);
        const end = new Date(currentWeekStart);
        end.setDate(end.getDate() + 6);
        return { start, end };
    };

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const fetchWeeklyData = async () => {
        try {
            setLoading(true);
            const { start, end } = getWeekRange();
            const startDate = formatDate(start);
            const endDate = formatDate(end);

            const data = await messService.getMenu({ startDate, endDate });

            // Transform array to object keyed by date
            const menuMap = {};
            // Initialize empty week
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const dateKey = formatDate(d);
                menuMap[dateKey] = { breakfast: '', lunch: '', snacks: '', dinner: '' };
            }

            // Fill with fetched data
            if (data && Array.isArray(data)) {
                data.forEach(item => {
                    const itemDate = new Date(item.date).toISOString().split('T')[0];
                    if (menuMap[itemDate]) {
                        menuMap[itemDate] = { ...menuMap[itemDate], ...item.meals };
                    }
                });
            }

            setWeeklyMenu(menuMap);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (date, meal, value) => {
        setWeeklyMenu(prev => ({
            ...prev,
            [date]: {
                ...prev[date],
                [meal]: value
            }
        }));
    };

    const navigateWeek = (direction) => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + (direction * 7));
        setCurrentWeekStart(newStart);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updates = [];

            const dates = Object.keys(weeklyMenu);

            for (const date of dates) {
                const meals = weeklyMenu[date];
                const cleanMeals = {
                    breakfast: meals.breakfast?.trim() || '',
                    lunch: meals.lunch?.trim() || '',
                    snacks: meals.snacks?.trim() || '',
                    dinner: meals.dinner?.trim() || ''
                };

                updates.push(messService.updateMenu(date, cleanMeals));
            }

            await Promise.all(updates);
            toast.success('Weekly menu saved successfully!');
            fetchWeeklyData();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save menu');
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyVoucher = async (e, directCode = null) => {
        if (e) e.preventDefault();
        const codeToVerify = directCode || verifyCode;
        if (!codeToVerify || !codeToVerify.trim()) {
            toast.error("Please enter a valid coupon code");
            return;
        }

        setVerifying(true);
        try {
            const res = await messService.verifyVoucher(codeToVerify.trim());
            if (res.success) {
                toast.success(res.message || "Voucher redeemed successfully!");
                setVerifyCode('');
                fetchVouchers();
            } else {
                toast.error(res.message || "Verification failed");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid or already used voucher coupon");
        } finally {
            setVerifying(false);
        }
    };

    const { start, end } = getWeekRange();
    const activeMeals = allMeals.filter(m => visibleMeals[m]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fadeIn">
            <PageHeader title="Mess Menu & Coupons Manager" subtitle="Plan weekly menus, monitor forecasts, and verify add-on billing" />

            {/* Navigation Tabs */}
            <div className="flex space-x-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`pb-3 px-1 text-sm font-bold transition-all ${
                        activeTab === 'menu' 
                            ? 'border-b-2 border-primary-600 text-primary-600 font-extrabold' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    🍳 Weekly Menu & Forecasts
                </button>
                <button
                    onClick={() => setActiveTab('vouchers')}
                    className={`pb-3 px-1 text-sm font-bold transition-all ${
                        activeTab === 'vouchers' 
                            ? 'border-b-2 border-primary-600 text-primary-600 font-extrabold' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    🎫 Meal Coupon Redemptions
                </button>
            </div>

            {/* Tab 1: Menu Planner */}
            {activeTab === 'menu' && (
                <div className="space-y-6">
                    {/* Controls */}
                    <div className="flex flex-col xl:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
                        {/* Week Nav */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigateWeek(-1)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                title="Previous Week"
                            >
                                <ChevronLeft size={24} className="text-slate-600" />
                            </button>

                            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <Calendar size={20} className="text-primary-600" />
                                <span>{start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                <span className="text-slate-400">-</span>
                                <span>{end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>

                            <button
                                onClick={() => navigateWeek(1)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                title="Next Week"
                            >
                                <ChevronRight size={24} className="text-slate-600" />
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 relative">
                            {/* Column Configuration */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowConfig(!showConfig)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-55 rounded-lg border border-slate-300 transition-colors flex items-center gap-2"
                                >
                                    <Settings size={16} />
                                    <span>Configure Meals</span>
                                </button>

                                {showConfig && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-lg p-3 z-50 animate-fade-in">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Visible Columns</h4>
                                        {allMeals.map(meal => (
                                            <label key={meal} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer font-semibold text-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleMeals[meal]}
                                                    onChange={() => setVisibleMeals({ ...visibleMeals, [meal]: !visibleMeals[meal] })}
                                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                                                />
                                                <span className="text-sm capitalize font-medium">{meal}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {showConfig && (
                                    <div className="fixed inset-0 z-40" onClick={() => setShowConfig(false)}></div>
                                )}
                            </div>

                            <button
                                onClick={() => setCurrentWeekStart(getStartOfWeek(new Date()))}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors"
                            >
                                Today
                            </button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2"
                            >
                                {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {loading ? (
                            <div className="h-96 flex items-center justify-center text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader className="animate-spin h-8 w-8 text-primary-500" />
                                    <p>Loading weekly menu...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 w-32 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Day</th>
                                            {activeMeals.map(meal => (
                                                <th key={meal} className="px-6 py-4 text-left text-sm font-bold text-slate-700 capitalize w-1/4">
                                                    {meal}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Array.from({ length: 7 }).map((_, i) => {
                                            const d = new Date(currentWeekStart);
                                            d.setDate(d.getDate() + i);
                                            const dateStr = formatDate(d);
                                            const dayName = daysOfWeek[d.getDay() === 0 ? 6 : d.getDay() - 1]; // Fix Sunday index
                                            const isToday = formatDate(new Date()) === dateStr;

                                            return (
                                                <tr key={dateStr} className={`group hover:bg-slate-50 transition-colors ${isToday ? 'bg-primary-50/30' : ''}`}>
                                                    <td className={`px-6 py-4 sticky left-0 z-10 ${isToday ? 'bg-primary-50/90' : 'bg-white group-hover:bg-slate-50'} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors`}>
                                                        <div className="flex flex-col">
                                                            <span className={`font-semibold ${isToday ? 'text-primary-700' : 'text-slate-700'}`}>{dayName}</span>
                                                            <span className="text-xs text-slate-400">{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                    </td>
                                                    {activeMeals.map(meal => (
                                                        <td key={`${dateStr}-${meal}`} className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                value={weeklyMenu[dateStr]?.[meal] || ''}
                                                                onChange={(e) => handleInputChange(dateStr, meal, e.target.value)}
                                                                placeholder="-"
                                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm bg-transparent"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Consumption Forecast */}
                    <Card title="Today's Consumption Forecast">
                        <div className="space-y-6">
                            {loadingAnalytics ? (
                                <div className="p-4 text-center text-slate-500">Loading forecast...</div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                        {analytics.map((stat) => (
                                            <div key={stat.meal} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="font-semibold text-slate-700 capitalize text-lg">{stat.meal}</h3>
                                                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                        Total: {stat.total}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                                                        <span className="text-xs text-slate-500">Cook</span>
                                                        <span className="font-bold text-green-600">{stat.eating}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                                                        <span className="text-xs text-slate-500">Skipped</span>
                                                        <span className="font-bold text-red-500">{stat.skipped}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {analytics.length === 0 && (
                                        <p className="text-slate-500 text-center py-4">No forecast data available for today.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Tab 2: Vouchers Manager */}
            {activeTab === 'vouchers' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                    
                    {/* Redeeming / Scanning Code Card */}
                    <Card title="Redeem Meal Coupon" className="lg:col-span-1 h-fit">
                        <form onSubmit={(e) => handleVerifyVoucher(e)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-750">Coupon Barcode / QR Code</label>
                                <input 
                                    required 
                                    type="text" 
                                    placeholder="e.g. meal_coup_abc123xyz"
                                    className="w-full rounded-lg border-slate-300 mt-1.5 font-mono tracking-wider text-sm focus:ring-2 focus:ring-primary-500"
                                    value={verifyCode} 
                                    onChange={e => setVerifyCode(e.target.value)} 
                                />
                                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                                    Verify guest, parents, or resident extra food tickets by scanning their dynamically generated pass code or inputting the code string.
                                </p>
                            </div>
                            <Button type="submit" disabled={verifying} className="w-full">
                                {verifying ? 'Verifying...' : 'Verify & Redeem Coupon'}
                            </Button>
                        </form>
                    </Card>

                    {/* Vouchers ledger history list */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-slate-700 mb-2">Meal Coupons Billed ({vouchersList.length})</h3>
                        
                        {loadingVouchers ? (
                            <div className="flex items-center justify-center p-12 gap-2 text-slate-400 bg-slate-50 rounded-2xl">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                <span className="text-sm font-semibold">Loading vouchers...</span>
                            </div>
                        ) : vouchersList.length === 0 ? (
                            <div className="text-center py-12 bg-slate-55 border border-dashed rounded-2xl text-slate-500 font-semibold">
                                No meal coupons ordered in this PG yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {vouchersList.map(item => {
                                    const tenantName = item.tenant_id?.user_id?.name || 'Tenant';
                                    const roomNo = item.tenant_id?.room_id?.number || 'N/A';
                                    const isUnused = item.status === 'UNUSED';
                                    const isUsed = item.status === 'USED';
                                    const isBilled = item.status === 'BILLED';

                                    return (
                                        <div key={item._id} className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition flex items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-full ${
                                                    isUnused ? 'bg-primary-50 text-primary-600' :
                                                    isUsed ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-550'
                                                }`}>
                                                    <Ticket size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-extrabold text-slate-800 text-sm">{item.mealType} Coupon</span>
                                                        <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${
                                                            isUnused ? 'bg-primary-50 text-primary-700 border-primary-200' :
                                                            isUsed ? 'bg-green-50 text-green-700 border-green-200' :
                                                            'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                        <span className="text-xs bg-slate-100 px-2 py-0.5 border rounded font-extrabold text-slate-700">
                                                            ₹{item.price}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-semibold">
                                                        Tenant: <span className="text-slate-700 font-bold">{tenantName} (Room {roomNo})</span>
                                                    </div>
                                                    {item.isGuestVoucher && (
                                                        <div className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded w-fit border border-indigo-100">
                                                            Guest: {item.guestName || 'N/A'}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-slate-400 font-bold">
                                                        Ordered On: {new Date(item.purchaseDate).toLocaleString()}
                                                    </div>
                                                    {item.useDate && (
                                                        <div className="text-[10px] text-slate-400 font-bold">
                                                            Redeemed On: {new Date(item.useDate).toLocaleString()}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] font-mono text-slate-500">
                                                        CODE: <span className="bg-slate-50 border px-1 rounded font-bold text-slate-700">{item.voucherCode}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isUnused && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleVerifyVoucher(null, item.voucherCode)}
                                                    className="bg-green-600 border-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm"
                                                >
                                                    Redeem Coupon
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

export default MessManagement;
