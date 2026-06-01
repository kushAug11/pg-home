import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    // UI-023 FIX: Close sidebar on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarOpen]);

    return (
        <div className="min-h-screen bg-slate-50 relative">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                    role="button"
                    aria-label="Close sidebar"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex flex-col md:ml-64 transition-all duration-300">
                <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
