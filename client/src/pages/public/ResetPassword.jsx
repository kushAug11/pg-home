import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Mail, Key } from 'lucide-react';
import api from '../../services/api';
import Input from '../../components/common/Input';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialEmail = location.state?.email || '';

    const [email, setEmail] = useState(initialEmail); // Allow editing in case passed state is wrong
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/reset-password', {
                email,
                otp,
                password
            });

            if (res.data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
                    <p className="text-gray-500 mb-6">Your password has been updated. Redirecting to login...</p>
                    <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                        Go to Login Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="h-8 w-8 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
                        <p className="text-gray-500 mt-2">Enter the OTP sent to your email.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {!initialEmail && (
                        <div className="mb-4 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                            Notice: We couldn't auto-detect your email. Please enter it manually.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={Mail}
                            placeholder="Confirm email"
                        />

                        <Input
                            label="OTP Code"
                            type="text"
                            required
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            icon={Key}
                            inputClassName="tracking-widest font-mono text-center text-lg"
                            placeholder="XXXXXX"
                        />

                        <Input
                            label="New Password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={Lock}
                            placeholder="Minimum 6 characters"
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            icon={Lock}
                            placeholder="Re-enter password"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-70"
                        >
                            {loading ? 'Resetting...' : 'Set New Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
