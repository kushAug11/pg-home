import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/admin.service';
import { Search, ChevronDown, ChevronUp, MoreVertical, Trash2, Eye } from 'lucide-react';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// Simple Debounce Hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const PGManagement = () => {
    const [pgs, setPgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);

    // Filters & Sort State
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [sort, setSort] = useState('name');
    const [order, setOrder] = useState('asc');

    // Dialog State
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedPg, setSelectedPg] = useState(null);

    const fetchPGs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                search: debouncedSearch,
                sort,
                order
            };
            const data = await adminService.getAllPGs(params);
            if (data.success) {
                setPgs(data.data);
                setTotal(data.total);
            }
        } catch (err) {
            console.error("Failed to fetch PGs", err);
            setError("Failed to load PGs.");
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, sort, order]);

    useEffect(() => {
        fetchPGs();
    }, [fetchPGs]);

    const handleSort = (field) => {
        if (sort === field) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(field);
            setOrder('asc');
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await adminService.deletePG(deleteId);
            setPgs(prev => prev.filter(pg => pg._id !== deleteId));
            setTotal(prev => prev - 1);
            setDeleteId(null);
        } catch (err) {
            console.error("Failed to delete PG", err);
            alert("Failed to delete PG"); // Ideally use a Toast here
        } finally {
            setIsDeleting(false);
        }
    };

    const SortIcon = ({ field }) => {
        if (sort !== field) return <div className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-50" />;
        return order === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />;
    };

    if (error) {
        return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">All PGs</h1>
                    <p className="text-sm text-slate-500">Total Registered: {total}</p>
                </div>

                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Search by name, city, owner..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th
                                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">PG Name <SortIcon field="name" /></div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('owner')}
                                >
                                    <div className="flex items-center">Owner <SortIcon field="owner" /></div>
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Location</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Subscription</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton variant="text" /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" className="w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" /></td>
                                    </tr>
                                ))
                            ) : pgs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8">
                                        <EmptyState
                                            title="No PGs found"
                                            description={`We couldn't find any PGs matching "${search}".`}
                                            actionLabel="Clear Filters"
                                            onAction={() => setSearch('')}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                pgs.map((pg) => (
                                    <tr key={pg._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{pg.name}</div>
                                            <div className="text-xs text-slate-400">ID: {pg._id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-700">{pg.owner?.name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500">{pg.owner?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600">{pg.city}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${pg.subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {pg.subscription?.status || 'inactive'}
                                            </span>
                                            <div className="text-xs text-slate-400 mt-1">{pg.subscription?.plan} Plan</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" title="View Details" onClick={() => setSelectedPg(pg)}>
                                                    <Eye size={16} className="text-slate-500" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    title="Delete PG"
                                                    onClick={() => handleDeleteClick(pg._id)}
                                                >
                                                    <Trash2 size={16} className="text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Future Scope) */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-500 text-center md:text-left">
                        Showing {pgs.length} results
                    </p>
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete PG?"
                message="Are you sure you want to delete this PG? This will permanently delete all rooms and tenants associated with it. This action cannot be undone."
                confirmLabel="Delete Permanently"
                isLoading={isDeleting}
            />

            {/* View Details Modal */}
            {selectedPg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">PG Details</h3>
                                <p className="text-xs text-slate-500">ID: {selectedPg._id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPg(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">PG Name</label>
                                    <p className="font-medium text-slate-900">{selectedPg.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                    <p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${selectedPg.subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {selectedPg.subscription?.status || 'inactive'}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Owner Name</label>
                                    <p className="text-slate-700">{selectedPg.owner?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Owner Email</label>
                                    <p className="text-slate-700 truncate" title={selectedPg.owner?.email}>{selectedPg.owner?.email || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                                    <p className="text-sm text-slate-600">{selectedPg.description || 'No description provided.'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                                    <p className="text-slate-700">{selectedPg.city || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">State</label>
                                    <p className="text-slate-700">{selectedPg.state || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                                    <p className="text-sm text-slate-600">{selectedPg.address || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Created At</label>
                                    <p className="text-slate-700">{new Date(selectedPg.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Plan</label>
                                    <p className="text-slate-700 capitalize">{selectedPg.subscription?.plan || 'Free'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedPg(null)}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PGManagement;
