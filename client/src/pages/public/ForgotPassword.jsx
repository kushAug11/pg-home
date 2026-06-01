import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setMessage('OTP sent! Please check your email.');
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-[#0b0c10]">

            {/* Animated Rich Background — matching Login/Register */}
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
                <h2 className="text-4xl font-heading font-extrabold text-white tracking-tight">Forgot Password?</h2>
                <p className="mt-3 text-slate-300 font-light text-lg">Enter your email to receive a password reset OTP.</p>
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

                    {message && (
                        <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/50 backdrop-blur-sm text-emerald-400 rounded-xl text-sm text-center animate-fade-in">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/50 backdrop-blur-sm text-red-400 px-4 py-3 rounded-xl text-sm text-center animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            id="forgot-email"
                            label="Email Address"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            icon={Mail}
                        />

                        <Button type="submit" variant="primary" className="w-full text-lg py-3 mt-4" isLoading={loading}>
                            Send OTP
                            {!loading && <ArrowRight size={18} className="ml-2" />}
                        </Button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-200/50 pt-6">
                        <Link to="/login" className="text-sm text-slate-400 hover:text-primary-400 flex items-center justify-center gap-1 transition-colors font-medium">
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
