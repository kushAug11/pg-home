import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { KeyRound, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [activeTab, setActiveTab] = useState('owner');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, logout } = useAuth();
    const navigate = useNavigate();
    const portalLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);

            if (result.success) {
                const userRole = result.role;
                if (userRole !== activeTab) {
                    logout();
                    setError(`This account belongs to the ${userRole} portal. Please switch tabs and try again.`);
                    return;
                }

                switch (userRole) {
                    case 'admin': navigate('/admin'); break;
                    case 'owner': navigate('/owner'); break;
                    case 'tenant': navigate('/tenant'); break;
                    default: navigate('/');
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-[#0b0c10]">
            
            {/* Animated Rich Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary-600/20 rounded-full blur-[150px] mix-blend-screen animate-float"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative sm:mx-auto sm:w-full sm:max-w-md text-center z-10 mb-8"
            >
                <div className="glass-dark inline-flex p-3 rounded-2xl mb-6 shadow-glow cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/logo.svg" alt="StayManager" className="h-10 w-auto brightness-200" />
                </div>
                <h2 className="text-4xl font-heading font-extrabold text-white tracking-tight">Welcome Back</h2>
                <p className="mt-3 text-slate-300 font-light text-lg">Enter your details to access your dashboard.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
            >
                <div className="glass backdrop-blur-2xl py-10 px-6 sm:px-10 rounded-3xl border border-white/50 shadow-2xl relative overflow-hidden">
                    
                    {/* Inner glowing highlight */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>

                    {/* Tabs */}
                    <div className="flex bg-slate-900/10 backdrop-blur-md p-1.5 rounded-xl mb-8 border border-white/20">
                        {['owner', 'tenant', 'admin'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setActiveTab(role)}
                                className={`flex-1 py-2.5 text-sm font-bold capitalize rounded-lg transition-all duration-300 ${activeTab === role
                                    ? 'bg-white text-primary-600 shadow-md transform scale-[1.02]'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-sm text-red-400 px-4 py-3 rounded-xl text-sm text-center animate-fade-in">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <Input
                                id="email"
                                label="Email address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                icon={Mail}
                            />

                            <Input
                                id="password"
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                icon={KeyRound}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="text-sm">
                                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                                    Forgot your password?
                                </a>
                            </div>
                        </div>

                        <Button type="submit" variant="primary" className="w-full text-lg py-3 mt-4" isLoading={isLoading}>
                            Sign In to {portalLabel} Portal
                        </Button>
                    </form>

                    {activeTab === 'owner' && (
                        <div className="mt-8 text-center border-t border-slate-200/50 pt-6">
                            <p className="text-sm text-slate-600 font-medium">
                                New to StayManager? <span className="font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer transition-colors" onClick={() => navigate('/register')}>Create an account</span>
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
