import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Skeleton from '../common/Skeleton';

const RevenueChart = ({ payments, loading }) => {
    const [filter, setFilter] = useState('6M'); // 6M, 1Y, 5Y, CUSTOM
    const [customRange, setCustomRange] = useState({
        start: '',
        end: ''
    });

    const data = useMemo(() => {
        if (!payments) return [];

        // 1. Group Data by Month-Year (YYYY-MM)
        const grouped = payments.reduce((acc, pay) => {
            const date = new Date(pay.transaction_date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[key] = (acc[key] || 0) + pay.amount;
            return acc;
        }, {});

        // 2. Determine Range Boundaries
        let start = new Date();
        let end = new Date();
        start.setDate(1); // Normalize

        if (filter === '6M') {
            start.setMonth(start.getMonth() - 5);
        } else if (filter === '1Y') {
            start.setMonth(start.getMonth() - 11);
        } else if (filter === '5Y') {
            start.setFullYear(start.getFullYear() - 5);
        } else if (filter === 'CUSTOM') {
            if (customRange.start) start = new Date(customRange.start);
            else start.setMonth(start.getMonth() - 1); // Default to 1 month if emptiness

            if (customRange.end) end = new Date(customRange.end);
        }

        // 3. Generate Buckets
        const result = [];
        const current = new Date(start);
        current.setDate(1); // Align to 1st

        // Loop until current > end
        // Safety break: don't loop forever if dates are swapped
        let safety = 0;
        while (current <= end && safety < 100) {
            const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

            let label = current.toLocaleString('default', { month: 'short' });
            // Add Year to label if range > 1 year or 5Y
            if (filter === '5Y' || filter === 'Custom' || filter === '1Y') {
                label += ` '${String(current.getFullYear()).slice(2)}`;
            }

            result.push({
                name: label,
                revenue: grouped[key] || 0
            });

            current.setMonth(current.getMonth() + 1);
            safety++;
        }

        return result;
    }, [payments, filter, customRange]);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
                <Skeleton className="h-6 w-48 mb-6" />
                <Skeleton className="flex-1 w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-auto transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-heading font-semibold text-slate-900">Revenue Trends</h3>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Filters */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {['6M', '1Y', '5Y', 'CUSTOM'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${filter === f
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {f === 'CUSTOM' ? 'Custom' : f === '1Y' ? '1 Year' : f === '5Y' ? '5 Years' : '6 Months'}
                            </button>
                        ))}
                    </div>

                    {/* Custom Range Inputs */}
                    {filter === 'CUSTOM' && (
                        <div className="flex gap-2 animate-fade-in text-xs">
                            <input
                                type="month"
                                value={customRange.start}
                                onChange={(e) => setCustomRange(p => ({ ...p, start: e.target.value }))}
                                className="border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-500"
                            />
                            <span className="self-center text-slate-400">-</span>
                            <input
                                type="month"
                                value={customRange.end}
                                onChange={(e) => setCustomRange(p => ({ ...p, end: e.target.value }))}
                                className="border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 10 }}
                            dy={10}
                            interval={filter === '5Y' ? 2 : 0} // Skip labels if dense
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            tickFormatter={(val) => `₹${val / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(val) => [`₹${val}`, 'Revenue']}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#4F46E5"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
