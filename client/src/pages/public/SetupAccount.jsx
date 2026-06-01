import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const SetupAccount = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid setup link. Please check your email.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await authService.setupAccount(token, password);
            navigate('/tenant'); // Redirect to Tenant Dashboard
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to setup account. Link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h2>
                    <p className="text-gray-600">The setup link is missing or invalid.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Setup Your Account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Create a secure password to access your dashboard.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <Input
                            label="New Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Min 6 characters"
                        />
                        <Input
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter password"
                        />
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                    >
                        {loading ? 'Setting up...' : 'Activate Account'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default SetupAccount;
