import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn()
    }
}));

import authService from './auth.service';
import api from './api';

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    // ─── login ───────────────────────────────────────────────────────────────

    describe('login', () => {
        it('success: stores token & user in localStorage and returns response data', async () => {
            const mockData = {
                success: true,
                data: { token: 'tok-abc', role: 'tenant', name: 'Alice' }
            };
            api.post.mockResolvedValue({ data: mockData });

            const result = await authService.login('alice@example.com', 'secret');

            expect(api.post).toHaveBeenCalledWith('/auth/login', {
                email: 'alice@example.com',
                password: 'secret'
            });
            expect(localStorage.getItem('token')).toBe('tok-abc');
            expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockData.data);
            expect(result).toEqual(mockData);
        });

        it('failure: does NOT store token and returns error data', async () => {
            const mockData = { success: false, message: 'Invalid credentials' };
            api.post.mockResolvedValue({ data: mockData });

            const result = await authService.login('wrong@example.com', 'bad');

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
            expect(result).toEqual(mockData);
        });

        it('failure when data.data is missing: does NOT store token', async () => {
            // success flag present but no data.data (edge-case)
            const mockData = { success: true };
            api.post.mockResolvedValue({ data: mockData });

            await authService.login('x@x.com', 'pass');

            expect(localStorage.getItem('token')).toBeNull();
        });
    });

    // ─── registerOwner ────────────────────────────────────────────────────────

    describe('registerOwner', () => {
        it('success: stores token in localStorage and returns response data', async () => {
            const mockData = {
                success: true,
                data: { token: 'tok-owner', role: 'owner', name: 'Bob', pgName: 'MyPG' }
            };
            api.post.mockResolvedValue({ data: mockData });

            const result = await authService.registerOwner('Bob', 'bob@pg.com', 'pass123', 'MyPG');

            expect(api.post).toHaveBeenCalledWith('/auth/register', {
                name: 'Bob',
                email: 'bob@pg.com',
                password: 'pass123',
                pgName: 'MyPG',
                role: 'owner'
            });
            expect(localStorage.getItem('token')).toBe('tok-owner');
            expect(result).toEqual(mockData);
        });

        it('failure: does NOT store token', async () => {
            const mockData = { success: false, message: 'Email already exists' };
            api.post.mockResolvedValue({ data: mockData });

            await authService.registerOwner('Bob', 'existing@pg.com', 'pass', 'PG');

            expect(localStorage.getItem('token')).toBeNull();
        });
    });

    // ─── logout ───────────────────────────────────────────────────────────────

    describe('logout', () => {
        it('removes token and user from localStorage', () => {
            localStorage.setItem('token', 'some-token');
            localStorage.setItem('user', JSON.stringify({ name: 'Alice' }));

            authService.logout();

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
        });
    });

    // ─── getCurrentUser ───────────────────────────────────────────────────────

    describe('getCurrentUser', () => {
        it('calls GET /auth/me and returns response data', async () => {
            const mockData = { success: true, data: { name: 'Alice', role: 'tenant' } };
            api.get.mockResolvedValue({ data: mockData });

            const result = await authService.getCurrentUser();

            expect(api.get).toHaveBeenCalledWith('/auth/me');
            expect(result).toEqual(mockData);
        });

        it('propagates errors thrown by the api', async () => {
            api.get.mockRejectedValue(new Error('Network error'));

            await expect(authService.getCurrentUser()).rejects.toThrow('Network error');
        });
    });

    // ─── setupAccount ─────────────────────────────────────────────────────────

    describe('setupAccount', () => {
        it('calls POST /auth/setup-account with token and password', async () => {
            const mockData = {
                success: true,
                data: { token: 'tok-setup', role: 'tenant' }
            };
            api.post.mockResolvedValue({ data: mockData });

            const result = await authService.setupAccount('invite-token', 'newPassword1');

            expect(api.post).toHaveBeenCalledWith('/auth/setup-account', {
                token: 'invite-token',
                password: 'newPassword1'
            });
            expect(localStorage.getItem('token')).toBe('tok-setup');
            expect(result).toEqual(mockData);
        });

        it('does NOT store token on failure', async () => {
            const mockData = { success: false, message: 'Token expired' };
            api.post.mockResolvedValue({ data: mockData });

            await authService.setupAccount('bad-token', 'pass');

            expect(localStorage.getItem('token')).toBeNull();
        });

        it('stores user data in localStorage on success', async () => {
            const userData = { token: 'tok-s', role: 'tenant', name: 'Carol' };
            api.post.mockResolvedValue({ data: { success: true, data: userData } });

            await authService.setupAccount('t', 'p');

            expect(JSON.parse(localStorage.getItem('user'))).toEqual(userData);
        });
    });
});
