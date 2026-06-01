import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
    }
}));

import ownerService from './owner.service';
import api from './api';

describe('ownerService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── Rooms ────────────────────────────────────────────────────────────────

    describe('getRooms', () => {
        it('calls GET /owner/rooms and returns data', async () => {
            const mockData = { success: true, data: [{ _id: '1', number: '101' }] };
            api.get.mockResolvedValue({ data: mockData });

            const result = await ownerService.getRooms();

            expect(api.get).toHaveBeenCalledWith('/owner/rooms');
            expect(result).toEqual(mockData);
        });
    });

    describe('createRoom', () => {
        it('calls POST /owner/rooms with room data', async () => {
            const roomData = { number: '102', type: 'Single', price: 5000, capacity: 1 };
            const mockData = { success: true, data: { _id: '2', ...roomData } };
            api.post.mockResolvedValue({ data: mockData });

            const result = await ownerService.createRoom(roomData);

            expect(api.post).toHaveBeenCalledWith('/owner/rooms', roomData);
            expect(result).toEqual(mockData);
        });
    });

    describe('updateRoom', () => {
        it('calls PUT /owner/rooms/:id with updated data', async () => {
            const updatedData = { price: 6000 };
            const mockData = { success: true, data: { _id: '1', price: 6000 } };
            api.put.mockResolvedValue({ data: mockData });

            const result = await ownerService.updateRoom('1', updatedData);

            expect(api.put).toHaveBeenCalledWith('/owner/rooms/1', updatedData);
            expect(result).toEqual(mockData);
        });
    });

    describe('deleteRoom', () => {
        it('calls DELETE /owner/rooms/:id', async () => {
            const mockData = { success: true, message: 'Room deleted' };
            api.delete.mockResolvedValue({ data: mockData });

            const result = await ownerService.deleteRoom('1');

            expect(api.delete).toHaveBeenCalledWith('/owner/rooms/1');
            expect(result).toEqual(mockData);
        });
    });

    // ─── Tenants ──────────────────────────────────────────────────────────────

    describe('getTenants', () => {
        it('calls GET /owner/tenants and returns data', async () => {
            const mockData = { success: true, data: [{ _id: 't1', name: 'Alice' }] };
            api.get.mockResolvedValue({ data: mockData });

            const result = await ownerService.getTenants();

            expect(api.get).toHaveBeenCalledWith('/owner/tenants');
            expect(result).toEqual(mockData);
        });
    });

    describe('addTenant', () => {
        it('calls POST /owner/tenants with plain JSON data', async () => {
            const tenantData = { name: 'Alice', email: 'alice@example.com', roomId: 'r1' };
            const mockData = { success: true, data: { _id: 't1', ...tenantData } };
            api.post.mockResolvedValue({ data: mockData });

            const result = await ownerService.addTenant(tenantData);

            expect(api.post).toHaveBeenCalledWith('/owner/tenants', tenantData, {});
            expect(result).toEqual(mockData);
        });

        it('calls POST /owner/tenants with FormData and multipart header', async () => {
            const formData = new FormData();
            formData.append('name', 'Bob');
            const mockData = { success: true, data: { _id: 't2' } };
            api.post.mockResolvedValue({ data: mockData });

            const result = await ownerService.addTenant(formData);

            expect(api.post).toHaveBeenCalledWith(
                '/owner/tenants',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            expect(result).toEqual(mockData);
        });
    });

    // ─── Complaints ───────────────────────────────────────────────────────────

    describe('getComplaints', () => {
        it('calls GET /owner/complaints and returns data', async () => {
            const mockData = { success: true, data: [{ _id: 'c1', subject: 'Leaky tap' }] };
            api.get.mockResolvedValue({ data: mockData });

            const result = await ownerService.getComplaints();

            expect(api.get).toHaveBeenCalledWith('/owner/complaints');
            expect(result).toEqual(mockData);
        });
    });

    describe('updateComplaintStatus', () => {
        it('calls PUT /owner/complaints/:id with status data', async () => {
            const statusData = { status: 'resolved' };
            const mockData = { success: true };
            api.put.mockResolvedValue({ data: mockData });

            const result = await ownerService.updateComplaintStatus('c1', statusData);

            expect(api.put).toHaveBeenCalledWith('/owner/complaints/c1', statusData);
            expect(result).toEqual(mockData);
        });
    });

    // ─── Notices ──────────────────────────────────────────────────────────────

    describe('createNotice', () => {
        it('calls POST /owner/notices with notice data', async () => {
            const noticeData = { title: 'Water cut', message: 'From 9am to 11am' };
            const mockData = { success: true, data: { _id: 'n1', ...noticeData } };
            api.post.mockResolvedValue({ data: mockData });

            const result = await ownerService.createNotice(noticeData);

            expect(api.post).toHaveBeenCalledWith('/owner/notices', noticeData);
            expect(result).toEqual(mockData);
        });
    });

    describe('getNotices', () => {
        it('calls GET /owner/notices', async () => {
            const mockData = { success: true, data: [] };
            api.get.mockResolvedValue({ data: mockData });

            const result = await ownerService.getNotices();

            expect(api.get).toHaveBeenCalledWith('/owner/notices');
            expect(result).toEqual(mockData);
        });
    });

    describe('deleteNotice', () => {
        it('calls DELETE /owner/notices/:id', async () => {
            const mockData = { success: true };
            api.delete.mockResolvedValue({ data: mockData });

            const result = await ownerService.deleteNotice('n1');

            expect(api.delete).toHaveBeenCalledWith('/owner/notices/n1');
            expect(result).toEqual(mockData);
        });
    });

    // ─── Dashboard Stats ──────────────────────────────────────────────────────

    describe('getDashboardStats', () => {
        it('calls GET /owner/dashboard-stats and returns data', async () => {
            const mockData = { success: true, data: { totalRooms: 10, occupiedRooms: 7 } };
            api.get.mockResolvedValue({ data: mockData });

            const result = await ownerService.getDashboardStats();

            expect(api.get).toHaveBeenCalledWith('/owner/dashboard-stats');
            expect(result).toEqual(mockData);
        });
    });

    // ─── Compatibility ────────────────────────────────────────────────────────

    describe('checkCompatibility', () => {
        it('calls POST /owner/rooms/:id/compatibility with preferences', async () => {
            const prefs = { gender: 'Female', smoking: false };
            const mockData = { success: true, data: { compatible: true, score: 95 } };
            api.post.mockResolvedValue({ data: mockData });

            const result = await ownerService.checkCompatibility('r1', prefs);

            expect(api.post).toHaveBeenCalledWith('/owner/rooms/r1/compatibility', prefs);
            expect(result).toEqual(mockData);
        });
    });

    // ─── Analytics & Expenses ─────────────────────────────────────────────────

    describe('getAnalytics', () => {
        it('calls GET /owner/analytics', async () => {
            const mockData = { success: true, data: {} };
            api.get.mockResolvedValue({ data: mockData });

            await ownerService.getAnalytics();

            expect(api.get).toHaveBeenCalledWith('/owner/analytics');
        });
    });

    describe('addExpense', () => {
        it('calls POST /owner/expenses with expense data', async () => {
            const expenseData = { description: 'Plumbing', amount: 2000 };
            api.post.mockResolvedValue({ data: { success: true } });

            await ownerService.addExpense(expenseData);

            expect(api.post).toHaveBeenCalledWith('/owner/expenses', expenseData);
        });
    });

    describe('deleteExpense', () => {
        it('calls DELETE /owner/expenses/:id', async () => {
            api.delete.mockResolvedValue({ data: { success: true } });

            await ownerService.deleteExpense('e1');

            expect(api.delete).toHaveBeenCalledWith('/owner/expenses/e1');
        });
    });

    // ─── Payments ─────────────────────────────────────────────────────────────

    describe('getPayments', () => {
        it('calls GET /owner/payments', async () => {
            const mockData = { success: true, data: [] };
            api.get.mockResolvedValue({ data: mockData });

            await ownerService.getPayments();

            expect(api.get).toHaveBeenCalledWith('/owner/payments');
        });
    });

    describe('recordManualPayment', () => {
        it('calls POST /payments/manual with payment data', async () => {
            const paymentData = { tenantId: 't1', amount: 5000, month: 'May' };
            api.post.mockResolvedValue({ data: { success: true } });

            await ownerService.recordManualPayment(paymentData);

            expect(api.post).toHaveBeenCalledWith('/payments/manual', paymentData);
        });
    });

    // ─── Visit Requests ───────────────────────────────────────────────────────

    describe('getVisitRequests', () => {
        it('calls GET /visits', async () => {
            api.get.mockResolvedValue({ data: { success: true, data: [] } });

            await ownerService.getVisitRequests();

            expect(api.get).toHaveBeenCalledWith('/visits');
        });
    });

    describe('updateVisitStatus', () => {
        it('calls PUT /visits/:id with status data', async () => {
            const data = { status: 'approved' };
            api.put.mockResolvedValue({ data: { success: true } });

            await ownerService.updateVisitStatus('v1', data);

            expect(api.put).toHaveBeenCalledWith('/visits/v1', data);
        });
    });

    // ─── Exit Requests ────────────────────────────────────────────────────────

    describe('manageExitRequest', () => {
        it('calls POST /owner/tenants/exit-request', async () => {
            const data = { tenantId: 't1', action: 'approve' };
            api.post.mockResolvedValue({ data: { success: true } });

            await ownerService.manageExitRequest(data);

            expect(api.post).toHaveBeenCalledWith('/owner/tenants/exit-request', data);
        });
    });
});
