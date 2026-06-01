import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Register from './Register';
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

describe('Register Component', () => {
    const mockRegisterOwner = vi.fn();

    const renderRegister = () => {
        render(
            <AuthContext.Provider value={{ registerOwner: mockRegisterOwner }}>
                <BrowserRouter>
                    <Register />
                </BrowserRouter>
            </AuthContext.Provider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders registration form', () => {
        renderRegister();
        expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Register as Owner/i })).toBeInTheDocument();
    });

    it('validates input fields', () => {
        const { container } = render(
            <AuthContext.Provider value={{ registerOwner: mockRegisterOwner }}>
                <BrowserRouter>
                    <Register />
                </BrowserRouter>
            </AuthContext.Provider>
        );
        expect(screen.getByPlaceholderText('John Doe')).toBeRequired();
        expect(screen.getByPlaceholderText('Sunshine PG')).toBeRequired();
        expect(screen.getByPlaceholderText('you@example.com')).toBeRequired();
        expect(container.querySelector('input[type="password"]')).toBeRequired();
    });

    it('handles registration submission', async () => {
        mockRegisterOwner.mockResolvedValue({ success: true });
        renderRegister();

        const passwordInput = document.querySelector('input[type="password"]');
        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'New Owner' } });
        fireEvent.change(screen.getByPlaceholderText('Sunshine PG'), { target: { value: 'Luxury PG' } });
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'owner@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Register as Owner/i }));

        await waitFor(() => {
            expect(mockRegisterOwner).toHaveBeenCalledWith('New Owner', 'owner@test.com', 'password123', 'Luxury PG');
            expect(mockNavigate).toHaveBeenCalledWith('/owner');
        });
    });

    it('displays error message on failed registration', async () => {
        mockRegisterOwner.mockResolvedValue({ success: false, message: 'Registration failed' });
        renderRegister();

        const passwordInput = document.querySelector('input[type="password"]');
        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'New Owner' } });
        fireEvent.change(screen.getByPlaceholderText('Sunshine PG'), { target: { value: 'Luxury PG' } });
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'owner@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Register as Owner/i }));

        await waitFor(() => {
            expect(screen.getByText('Registration failed')).toBeInTheDocument();
        });
    });
});
