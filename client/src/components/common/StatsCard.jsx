import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon, color, trend, children }) => (
    <motion.div
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 transition-shadow hover:shadow-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
    >
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
                {trend !== undefined && trend !== null && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            {/* Action Slot */}
            {/* Only defined children will render */}
        </div>
        {children && <div className="self-center">{children}</div>}
    </motion.div>
);

export default StatsCard;
