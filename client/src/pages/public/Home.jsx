import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, CreditCard, Shield, Zap, TrendingUp, Smartphone, Building2, LayoutDashboard, Home as HomeIcon, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import { motion } from 'framer-motion';

import logo from '../../assets/stayease_logo.png';
import heroBg from '../../assets/stayease_hero_bg.png';

const Home = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    return (
        <div className="overflow-hidden font-sans bg-surface">
            {/* Hero Section */}
            <section 
                className="bg-[#0b0c10] text-white min-h-[95vh] flex flex-col justify-center relative overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                {/* Animated Background Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] bg-primary-600/30 rounded-full blur-[140px] mix-blend-screen animate-float" />
                    <div className="absolute bottom-[-15%] left-[-10%] w-[700px] h-[700px] bg-fuchsia-600/20 rounded-full blur-[150px] mix-blend-screen animate-float" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>

                <div className="max-w-7xl mx-auto px-4 w-full pt-20 pb-16 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="lg:w-[50%] text-center lg:text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-primary-300 text-sm font-semibold tracking-wide uppercase mb-8 shadow-glow">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                </span>
                                StayEase SaaS Platform
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight drop-shadow-2xl font-heading">
                                <span className="text-white">Manage Properties</span> <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-fuchsia-400 to-primary-300 animate-gradient-x brightness-125">
                                    With StayEase.
                                </span>
                            </h1>

                            <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                                The ultimate operating system for PG and hostel owners. Segregate your properties, automate rent collections dynamically, and scale your accommodation portfolio with absolute security.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button
                                    size="lg"
                                    className="px-8 py-4 text-lg animate-pulse-slow"
                                    onClick={() => navigate('/register')}
                                >
                                    Start Free Trial
                                    <Zap className="w-5 h-5 ml-2 text-white/80" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="border border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg backdrop-blur-md"
                                    onClick={() => navigate('/features')}
                                >
                                    See How It Works
                                </Button>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-slate-400 font-medium">
                                <span>Trusted by modern owners:</span>
                                <div className="flex gap-6 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
                                    <div className="flex items-center gap-2"><Building2 size={18} className="text-primary-400" /> <span className="text-slate-200">UrbanStay</span></div>
                                    <div className="flex items-center gap-2"><HomeIcon size={18} className="text-accent" /> <span className="text-slate-200">CoLive</span></div>
                                    <div className="flex items-center gap-2"><LayoutDashboard size={18} className="text-blue-400" /> <span className="text-slate-200">PgPro</span></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 3D Dashboard Mockup */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateY: -15, rotateX: 5 }}
                            animate={{ opacity: 1, scale: 1, rotateY: -12, rotateX: 5 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="lg:w-[50%] hidden lg:block perspective-1000 group relative z-20"
                            style={{ perspective: '1200px' }}
                        >
                            <div className="absolute inset-x-10 -bottom-10 h-20 bg-primary-500/20 blur-[80px]"></div>
                            
                            <div className="relative w-full aspect-[16/10] bg-[#0f111a] rounded-2xl border border-white/10 overflow-hidden transform transition-all duration-700 ease-out group-hover:rotate-y-0 group-hover:rotate-x-0 group-hover:scale-[1.02] group-hover:shadow-[0_0_50px_-12px_rgba(139,92,246,0.5)] shadow-2xl shadow-black" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-12deg) rotateX(5deg)' }}>
                                {/* Browser Bar */}
                                <div className="h-10 bg-[#161925] border-b border-white/5 flex items-center px-4 gap-2">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-[0_0_10px_rgba(248,113,113,0.5)]" />
                                        <div className="w-3 h-3 rounded-full bg-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                    </div>
                                    <div className="ml-6 px-4 py-1 bg-black/40 rounded-md text-[11px] text-slate-400 font-mono w-64 text-center border border-white/5 mx-auto">
                                        app.stayease.com/overview
                                    </div>
                                </div>

                                {/* App Interface */}
                                <div className="flex h-full">
                                    {/* Sidebar */}
                                    <div className="w-20 bg-[#161925] border-r border-white/5 flex flex-col items-center py-6 gap-6 relative">
                                        <img src={logo} alt="StayEase" className="w-10 h-10 object-contain rounded-xl" />
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/50 shadow-glow" />
                                        <div className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" />
                                        <div className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" />
                                        <div className="mt-auto w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border-2 border-slate-800" />
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 bg-gradient-to-br from-[#0f111a] to-[#161925] p-8 relative overflow-hidden">
                                        {/* Mock Background glow inside dashboard */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[60px] rounded-full pointer-events-none"></div>

                                        <div className="flex justify-between items-center mb-10 relative z-10">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">PG Overview</h3>
                                                <p className="text-xs text-slate-400 mb-0">Welcome back, Admin</p>
                                            </div>
                                            <div className="h-9 px-4 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 shadow-glow flex items-center justify-center text-xs font-semibold text-white cursor-pointer hover:scale-105 transition-transform">
                                                + Add Tenant
                                            </div>
                                        </div>

                                        {/* Mock Stats */}
                                        <div className="grid grid-cols-3 gap-6 mb-10 relative z-10">
                                            {[
                                                { icon: <Users size={20} className="text-blue-400" />, value: "142", label: "Active Tenants", color: "bg-blue-500/20" },
                                                { icon: <CreditCard size={20} className="text-emerald-400" />, value: "₹4.2L", label: "Monthly Rev", color: "bg-emerald-500/20" },
                                                { icon: <Shield size={20} className="text-rose-400" />, value: "3", label: "Open Issues", color: "bg-rose-500/20" }
                                            ].map((stat, i) => (
                                                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm group-hover:border-primary-500/30 transition-colors duration-500 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <div className={`h-10 w-10 rounded-lg ${stat.color} mb-3 flex items-center justify-center`}>
                                                        {stat.icon}
                                                    </div>
                                                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Mock Chart */}
                                        <div className="h-48 bg-white/5 rounded-xl border border-white/5 flex items-end justify-between px-8 pb-0 pt-10 gap-6 overflow-hidden relative z-10">
                                            <div className="absolute inset-0 bg-gradient-to-t from-primary-500/20 to-transparent pointer-events-none" />
                                            {[40, 60, 45, 80, 55, 90, 65, 85].map((h, i) => (
                                                <div key={i} className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md relative group/bar" style={{ height: `${h}%` }}>
                                                    <div className="absolute inset-0 bg-white/0 hover:bg-white/20 transition-colors rounded-t-md cursor-pointer"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Glass Reflection Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/5 to-transparent pointer-events-none transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                            </div>
                        </motion.div>

                        {/* UI-007 FIX: Mobile/Tablet Hero Visual — shown below lg breakpoint */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="lg:hidden w-full mt-12"
                        >
                            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                {[
                                    { value: '142', label: 'Active Tenants', color: 'from-blue-500 to-blue-600', icon: '👥' },
                                    { value: '₹4.2L', label: 'Monthly Rev', color: 'from-emerald-500 to-emerald-600', icon: '💰' },
                                    { value: '98%', label: 'Occupancy', color: 'from-purple-500 to-purple-600', icon: '🏠' },
                                ].map((stat, i) => (
                                    <div key={i} className="relative p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center overflow-hidden group">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                                        <div className="text-2xl mb-2">{stat.icon}</div>
                                        <div className="text-xl sm:text-2xl font-bold text-white mb-1 relative z-10">{stat.value}</div>
                                        <div className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider relative z-10">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-slate-300 font-medium">Revenue Trend</span>
                                    <span className="text-xs text-emerald-400 font-semibold">↑ 12%</span>
                                </div>
                                <div className="flex items-end justify-between gap-1.5 h-16">
                                    {[40, 60, 45, 80, 55, 90, 65, 85, 70, 95].map((h, i) => (
                                        <div
                                            key={i}
                                            className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                                            style={{ height: `${h}%` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-32 relative bg-surface-subtle overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
                
                {/* Decorative background circle */}
                <div className="absolute -left-64 top-64 w-[500px] h-[500px] bg-primary-50 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-24"
                    >
                        <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-slate-200 text-primary-600 font-semibold text-sm mb-6 shadow-sm">
                            Robust Features
                        </div>
                        <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6 tracking-tight">Everything you need to <span className="text-gradient">run your PG</span></h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">Powerful tools designed to automate your daily operations, ensure timely rent collection, and drastically improve tenant satisfaction.</p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-primary-600" />}
                            bg="bg-primary-50"
                            title="Tenant Onboarding"
                            description="Digital onboarding workflows, document storage, and profile management for all your residents. Zero paperwork."
                        />
                        <FeatureCard
                            icon={<CreditCard className="w-6 h-6 text-emerald-600" />}
                            bg="bg-emerald-50"
                            title="Automated Rent"
                            description="Automated payment reminders via WhatsApp, online collections through Razorpay, and instant digital receipts."
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6 text-blue-600" />}
                            bg="bg-blue-50"
                            title="Smart Complaints"
                            description="Let tenants raise issues via their dashboard. Track, assign, and resolve maintenance efficiently to keep them happy."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
                            bg="bg-amber-50"
                            title="Financial Insights"
                            description="Real-time revenue tracking, pending dues alerts, expense management, and comprehensive profit analytics."
                        />
                        <FeatureCard
                            icon={<Smartphone className="w-6 h-6 text-fuchsia-600" />}
                            bg="bg-fuchsia-50"
                            title="Mobile First"
                            description="A fully responsive PWA dashboard that works perfectly on your phone, tablet, or desktop computer."
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-rose-600" />}
                            bg="bg-rose-50"
                            title="Instant Alerts"
                            description="Real-time email and in-app notifications for payments, new complaints, and important system updates."
                        />
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

// Motion Feature Card
const FeatureCard = ({ icon, bg, title, description }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
        }}
        className="card card-hover group"
    >
        <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm border border-black/5`}>
            {icon}
        </div>
        <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors">{title}</h3>
        <p className="text-slate-600 leading-relaxed mb-6">{description}</p>
        <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:text-primary-700 transition-colors overflow-hidden">
            <span className="transform group-hover:translate-x-1 transition-transform">Explore feature</span>
            <svg className="w-4 h-4 ml-1 transform -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
        </div>
    </motion.div>
);

export default Home;
