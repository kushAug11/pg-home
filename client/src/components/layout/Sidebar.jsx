import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Building2, Users, FileText, Bell, LogOut, TrendingUp, Utensils, ShieldCheck, Package } from 'lucide-react';
import logo from '../../assets/logo.svg';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const getLinks = () => {
        switch (user?.role) {
            case 'admin':
                return [
                    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Overview', end: true },
                    { to: '/admin/pgs', icon: <Building2 size={20} />, label: 'All PGs' },
                    { to: '/admin/logs', icon: <FileText size={20} />, label: 'Audit Logs' },
                ];
            case 'owner':
                return [
                    { to: '/owner', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
                    { to: '/owner/rooms', icon: <Building2 size={20} />, label: 'Rooms' },
                    { to: '/owner/tenants', icon: <Users size={20} />, label: 'Tenants' },
                    { to: '/owner/payments', icon: <TrendingUp size={20} />, label: 'Payments' },
                    { to: '/owner/housekeeping', icon: <Building2 size={20} />, label: 'Housekeeping' },
                    { to: '/owner/inventory', icon: <Package size={20} />, label: 'Inventory' },
                    { to: '/owner/complaints', icon: <Bell size={20} />, label: 'Complaints' },
                    { to: '/owner/visitors', icon: <ShieldCheck size={20} />, label: 'Security Log' },
                    { to: '/owner/requests', icon: <Users size={20} />, label: 'Visit Requests' },
                    { to: '/owner/notices', icon: <FileText size={20} />, label: 'Notices' },
                    { to: '/owner/expenses', icon: <TrendingUp size={20} />, label: 'Finances' },
                    { to: '/owner/mess', icon: <Utensils size={20} />, label: 'Mess Menu' },
                ];
            case 'tenant':
                return [
                    { to: '/tenant', icon: <LayoutDashboard size={20} />, label: 'My Room', end: true },
                    { to: '/tenant/payments', icon: <FileText size={20} />, label: 'Payments' },
                    { to: '/tenant/complaints', icon: <Bell size={20} />, label: 'My Complaints' },
                    { to: '/tenant/food', icon: <Utensils size={20} />, label: 'Food & Menu' },
                    { to: '/tenant/visitors', icon: <ShieldCheck size={20} />, label: 'Visitors (Pre-Auth)' },
                ];
            default:
                return [];
        }
    };

    const links = getLinks();

    return (
        <aside className={`
            w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-40 transition-transform duration-300 shadow-xl md:shadow-none
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white relative">
                <div className="flex items-center justify-center w-full">
                    <img src={logo} alt="StayManager" className="h-8 w-auto object-contain" />
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden absolute right-4 text-slate-400 hover:text-slate-600"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider px-4">
                    Menu
                </div>
                <ul className="space-y-1">
                    {links.map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                end={link.end}
                                onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                                className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium group ${isActive
                                    ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-r-4 border-transparent'
                                    }`}
                            >
                                <span className="group-hover:scale-110 transition-transform duration-200">
                                    {link.icon}
                                </span>
                                <span>{link.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-slate-200">
                <button onClick={logout} className="flex items-center space-x-3 px-4 py-2 w-full text-left text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
