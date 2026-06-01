import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import { vi } from 'vitest';

// Mock Component
const MockChildren = () => <div>Protected Content</div>;

describe('ProtectedRoute Helper', () => {

    it('shows loading state initially', () => {
        render(
            <AuthContext.Provider value={{ user: null, loading: true }}>
                <BrowserRouter>
                    <ProtectedRoute>
                        <MockChildren />
                    </ProtectedRoute>
                </BrowserRouter>
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('redirects if not authenticated', () => {
        // Mock Navigate? Or check if children overlap.
        // In integration tests, we check URL changes. 
        // Here we just check content is NOT rendered.

        render(
            <AuthContext.Provider value={{ user: null, loading: false }}>
                <BrowserRouter>
                    <ProtectedRoute>
                        <MockChildren />
                    </ProtectedRoute>
                </BrowserRouter>
            </AuthContext.Provider>
        );
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children if authenticated', () => {
        render(
            <AuthContext.Provider value={{ user: { role: 'tenant' }, loading: false }}>
                <BrowserRouter>
                    <ProtectedRoute allowedRoles={['tenant']}>
                        <MockChildren />
                    </ProtectedRoute>
                </BrowserRouter>
            </AuthContext.Provider>
        );
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
});
