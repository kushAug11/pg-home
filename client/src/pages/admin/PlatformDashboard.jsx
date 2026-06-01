import React from 'react';
import adminService from '../../services/admin.service';
import Loader from '../../components/common/Loader';
import StatsCard from '../../components/common/StatsCard';
import { Building2, Users, IndianRupee } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = React.useState({
        totalPGs: 0,
        totalUsers: 0,
        totalOwners: 0,
        totalTenants: 0
    });
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminService.getStats();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
                setError("Failed to load dashboard statistics.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
                <button
                    onClick={() => window.location.href = '/admin/logs'}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    View Audit Logs →
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total PGs" value={stats.totalPGs} icon={<Building2 size={24} />} color="bg-indigo-100 text-indigo-600" />
                <StatsCard title="Total Users" value={stats.totalUsers} icon={<Users size={24} />} color="bg-blue-100 text-blue-600" />
                <StatsCard title="Active Owners" value={stats.totalOwners} icon={<Users size={24} />} color="bg-green-100 text-green-600" />
                <StatsCard title="Total Tenants" value={stats.totalTenants} icon={<Users size={24} />} color="bg-amber-100 text-amber-600" />
            </div>

            {/* Database Management Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-2xl">🗄️</span> Database & Backups
                    </h2>
                    <BackupControls />
                </div>
            </div>

            {/* Recent Activity Table (Placeholder) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Registrations</h2>
                <p className="text-slate-500 text-sm">No recent activity.</p>
            </div>
        </div>
    );
};

const BackupControls = () => {
    const [backups, setBackups] = React.useState([]);
    const [backingUp, setBackingUp] = React.useState(false);

    const loadBackups = async () => {
        try {
            const res = await adminService.getBackups();
            if (res.success) setBackups(res.data);
        } catch (e) { console.error(e); }
    };

    const handleBackup = async () => {
        setBackingUp(true);
        try {
            const res = await adminService.triggerBackup();
            if (res.success) {
                alert('Backup Created!');
                loadBackups();
            }
        } catch (e) { alert('Backup failed'); }
        finally { setBackingUp(false); }
    };

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={handleBackup}
                disabled={backingUp}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
                {backingUp ? 'Backing Up...' : 'Trigger Backup Now'}
            </button>
            <div className="text-sm text-slate-500">
                <button
                    onClick={loadBackups}
                    className="text-indigo-600 hover:underline mr-4"
                >
                    View Backups
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
