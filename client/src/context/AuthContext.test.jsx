import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

// Mock auth service
vi.mock('../services/auth.service', () => ({
    default: {
        getCurrentUser: vi.fn(),
        login: vi.fn(),
        registerOwner: vi.fn(),
        logout: vi.fn()
    }
}));

// Mock socket service – AuthContext uses dynamic import() so we mock the module path
vi.mock('../services/socket.service', () => ({
    initSocket: vi.fn(),
    disconnectSocket: vi.fn()
}));

import authService from '../services/auth.service';

// ── Helper component that exposes context values ─────────────────────────────

const TestConsumer = ({ onRender }) => {
    const ctx = useAuth();
    onRender(ctx);
    return (
        <div>
            <span data-testid="loading">{String(ctx.loading)}</span>
            <span data-testid="user">{ctx.user ? ctx.user.name : 'null'}</span>
        </div>
    );
};

const renderWithProvider = (onRender = () => {}) =>
    render(
        <AuthProvider>
            <TestConsumer onRender={onRender} />
        </AuthProvider>
    );

// ─────────────────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    // ── Initial load: no token ─────────────────────────────────────────────

    it('user is null and loading becomes false when no token in localStorage', async () => {
        // No token set → getCurrentUser should NOT be called
        renderWithProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(authService.getCurrentUser).not.toHaveBeenCalled();
    });

    // ── Initial load: valid token ──────────────────────────────────────────

    it('user is set when token exists and getCurrentUser succeeds', async () => {
        localStorage.setItem('token', 'valid-token');
        authService.getCurrentUser.mockResolvedValue({
            success: true,
            data: { name: 'Alice', role: 'tenant' }
        });

        renderWithProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        expect(screen.getByTestId('user').textContent).toBe('Alice');
        expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    // ── Initial load: invalid/expired token ───────────────────────────────

    it('user is null and token is removed when getCurrentUser returns success:false', async () => {
        localStorage.setItem('token', 'expired-token');
        authService.getCurrentUser.mockResolvedValue({ success: false });

        renderWithProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('user is null and token is removed when getCurrentUser throws', async () => {
        localStorage.setItem('token', 'bad-token');
        authService.getCurrentUser.mockRejectedValue(new Error('401 Unauthorized'));

        renderWithProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(localStorage.getItem('token')).toBeNull();
    });

    // ── login ──────────────────────────────────────────────────────────────

    it('login success: user is set and returns {success:true, role}', async () => {
        authService.getCurrentUser.mockResolvedValue({ success: false }); // no initial user
        authService.login.mockResolvedValue({
            success: true,
            data: { name: 'Bob', role: 'owner', token: 'new-tok' }
        });

        let contextRef = {};
        renderWithProvider((ctx) => { contextRef = ctx; });

        // Wait for initial load to finish
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

        let loginResult;
        await act(async () => {
            loginResult = await contextRef.login('bob@pg.com', 'pass');
        });

        expect(loginResult).toEqual({ success: true, role: 'owner' });
        expect(screen.getByTestId('user').textContent).toBe('Bob');
    });

    it('login failure: returns {success:false, message}', async () => {
        authService.getCurrentUser.mockResolvedValue({ success: false });
        authService.login.mockResolvedValue({
            success: false,
            message: 'Invalid credentials'
        });

        let contextRef = {};
        renderWithProvider((ctx) => { contextRef = ctx; });

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

        let loginResult;
        await act(async () => {
            loginResult = await contextRef.login('wrong@x.com', 'bad');
        });

        expect(loginResult).toEqual({ success: false, message: 'Invalid credentials' });
        expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('login network error: returns {success:false, message}', async () => {
        authService.getCurrentUser.mockResolvedValue({ success: false });
        const networkErr = new Error('Network Error');
        networkErr.code = 'ERR_NETWORK';
        authService.login.mockRejectedValue(networkErr);

        let contextRef = {};
        renderWithProvider((ctx) => { contextRef = ctx; });

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

        let loginResult;
        await act(async () => {
            loginResult = await contextRef.login('x@x.com', 'p');
        });

        expect(loginResult.success).toBe(false);
        expect(loginResult.message).toContain('Server Offline');
    });

    // ── logout ────────────────────────────────────────────────────────────

    it('logout: user becomes null and authService.logout is called', async () => {
        localStorage.setItem('token', 'valid-tok');
        authService.getCurrentUser.mockResolvedValue({
            success: true,
            data: { name: 'Alice', role: 'tenant' }
        });
        authService.logout.mockImplementation(() => {});

        let contextRef = {};
        renderWithProvider((ctx) => { contextRef = ctx; });

        await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Alice'));

        act(() => {
            contextRef.logout();
        });

        await waitFor(() => {
            expect(screen.getByTestId('user').textContent).toBe('null');
        });

        expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    // ── registerOwner ─────────────────────────────────────────────────────

    it('registerOwner success: user is set and returns {success:true}', async () => {
        authService.getCurrentUser.mockResolvedValue({ success: false });
        authService.registerOwner.mockResolvedValue({
            success: true,
            data: { name: 'Carol', role: 'owner', token: 'reg-tok' }
        });

        let contextRef = {};
        renderWithProvider((ctx) => { contextRef = ctx; });

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

        let regResult;
        await act(async () => {
            regResult = await contextRef.registerOwner('Carol', 'carol@pg.com', 'pass', 'CarolPG');
        });

        expect(regResult).toEqual({ success: true });
        expect(screen.getByTestId('user').textContent).toBe('Carol');
    });

    it('registerOwner failure: returns {success:false, message}', async () => {
        authService.getCurrentUser.mockResolvedValue({ success: false });
        authService.registerOwner.mockResolvedValue({
            success: false,
            message: 'Email taken'
        });

        let contextRef = {};
        renderWithProvider((ctx) => { contextRef = ctx; });

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

        let regResult;
        await act(async () => {
            regResult = await contextRef.registerOwner('Dave', 'dave@pg.com', 'p', 'DavePG');
        });

        expect(regResult).toEqual({ success: false, message: 'Email taken' });
        expect(screen.getByTestId('user').textContent).toBe('null');
    });
});
