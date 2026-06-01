import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from './Login';
import { AuthContext } from '../../context/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Login Component', () => {
    const mockLogin = vi.fn();
    const mockLogout = vi.fn();

    const renderLogin = () => {
        render(
            <AuthContext.Provider value={{ login: mockLogin, logout: mockLogout }}>
                <BrowserRouter>
                    <Login />
                </BrowserRouter>
            </AuthContext.Provider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form with default owner tab', () => {
        renderLogin();
        expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In to Owner Portal/i })).toBeInTheDocument();
    });

    it('validates input fields', () => {
        const { container } = render(
            <AuthContext.Provider value={{ login: mockLogin, logout: mockLogout }}>
                <BrowserRouter>
                    <Login />
                </BrowserRouter>
            </AuthContext.Provider>
        );
        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = container.querySelector('input[type="password"]');

        expect(emailInput).toBeRequired();
        expect(passwordInput).toBeRequired();
    });

    it('handles login submission', async () => {
        mockLogin.mockResolvedValue({ success: true, role: 'owner' });
        renderLogin();

        const passwordInput = document.querySelector('input[type="password"]');
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Sign In to Owner Portal/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
            expect(mockNavigate).toHaveBeenCalledWith('/owner');
        });
    });

    it('displays error message on failed login', async () => {
        mockLogin.mockResolvedValue({ success: false, message: 'Invalid credentials' });
        renderLogin();

        const passwordInput = document.querySelector('input[type="password"]');
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
        fireEvent.click(screen.getByRole('button', { name: /Sign In to Owner Portal/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('blocks cross-portal login and logs out the session', async () => {
        mockLogin.mockResolvedValue({ success: true, role: 'tenant' });
        renderLogin();

        const passwordInput = document.querySelector('input[type="password"]');
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'tenant@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Sign In to Owner Portal/i }));

        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalled();
            expect(screen.getByText(/belongs to the tenant portal/i)).toBeInTheDocument();
        });
    });
});
