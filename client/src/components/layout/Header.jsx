import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from 'lucide-react';

const Header = ({ onMenuClick }) => {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
            <button
                onClick={onMenuClick}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <div className="flex items-center space-x-3 ml-auto">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <User size={20} />
                </div>
            </div>
        </header>
    );
};

export default Header;
