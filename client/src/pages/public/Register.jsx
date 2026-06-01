import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Building2, User, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        pgName: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { registerOwner } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await registerOwner(formData.name, formData.email, formData.password, formData.pgName);
            if (result.success) {
                navigate('/owner');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An error occurred during registration.');
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
                <h2 className="text-4xl font-heading font-extrabold text-white tracking-tight">Create your account</h2>
                <p className="mt-3 text-slate-300 font-light text-lg">Start managing your PG like a pro today.</p>
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

                    <form className="space-y-6" onSubmit={handleRegister}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-sm text-red-400 px-4 py-3 rounded-xl text-sm text-center animate-fade-in">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <Input
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                icon={User}
                                placeholder="John Doe"
                            />

                            <Input
                                label="PG / Hostel Name"
                                name="pgName"
                                value={formData.pgName}
                                onChange={handleChange}
                                required
                                icon={Building2}
                                placeholder="Sunshine PG"
                            />

                            <Input
                                label="Email address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                icon={Mail}
                                placeholder="you@example.com"
                            />

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                icon={Lock}
                                placeholder="••••••••"
                            />
                        </div>

                        <Button type="submit" variant="primary" className="w-full text-lg py-3 mt-4" isLoading={isLoading}>
                            Register as Owner
                        </Button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-200/50 pt-6">
                        <p className="text-sm text-slate-600 font-medium">
                            Already have an account? <span className="font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer transition-colors" onClick={() => navigate('/login')}>Sign in</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
