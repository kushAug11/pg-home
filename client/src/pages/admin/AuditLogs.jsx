import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin.service';
import Skeleton from '../../components/common/Skeleton';
import { ShieldAlert, User, Trash2, Clock } from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await adminService.getAuditLogs({ page, role: filterRole });
            if (res.success) {
                setLogs(res.data);
                setTotalPages(res.pagination?.pages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filterRole]);

    const getActionColor = (action) => {
        if (action.includes('DELETE')) return 'text-red-600 bg-red-50 border-red-200';
        if (action.includes('CREATE') || action.includes('ADD')) return 'text-green-600 bg-green-50 border-green-200';
        if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50 border-blue-200';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ShieldAlert className="text-indigo-600" />
                    System Audit Logs
                </h1>

                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="border p-2 rounded-lg text-sm"
                >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                    <option value="tenant">Tenant</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Actor</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Target</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="5" className="p-4"><Skeleton className="h-4 w-full" /></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">No logs found.</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-500 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded ${log.actor_role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800">{log.actor_id?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-400">{log.actor_role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700">
                                            {log.target_resource} {log.target_id ? `(${log.target_id.toString().slice(-4)})` : ''}
                                        </td>
                                        <td className="p-4 text-slate-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Simple) */}
                <div className="flex justify-between items-center mt-4 p-4 text-sm text-slate-500 border-t border-slate-100">
                    <span>Page {page} of {totalPages}</span>
                    <div className="space-x-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
