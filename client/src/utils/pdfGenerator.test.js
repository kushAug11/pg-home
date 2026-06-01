import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Create individual vi.fn() spies for every jsPDF instance method ───────────
const mockDoc = {
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    ellipse: vi.fn(),
    splitTextToSize: vi.fn().mockReturnValue(['line1']),
    save: vi.fn()
};

// ── Mock jsPDF so that `new jsPDF(...)` always returns mockDoc ────────────────
// We use a class so it is natively a constructor; vi.clearAllMocks() only resets
// call records, NOT the class implementation itself.
vi.mock('jspdf', () => {
    class MockJsPDF {
        constructor() {
            // expose every method from mockDoc on `this`
            Object.assign(this, mockDoc);
        }
    }
    return { jsPDF: MockJsPDF };
});

import { generateRentReceipt } from './pdfGenerator';

// ─────────────────────────────────────────────────────────────────────────────

describe('generateRentReceipt', () => {
    beforeEach(() => {
        // Only reset call history, not implementations
        Object.values(mockDoc).forEach((fn) => fn.mockClear());
        // Ensure splitTextToSize always returns a usable value
        mockDoc.splitTextToSize.mockReturnValue(['line1']);
    });

    // ── doc.save() is always called ────────────────────────────────────────

    it('calls doc.save() when given a full payment object', () => {
        const payment = {
            _id: 'pay123',
            amount: 5000,
            gateway_order_id: 'order_abc',
            gateway_payment_id: 'pay_xyz',
            transaction_date: new Date().toISOString(),
            payment_mode: 'ONLINE'
        };
        const profile = {
            pg: { name: 'MyPG', address: '1 Main St', contact: '9876543210' },
            tenant: {
                user_id: { name: 'Alice', email: 'alice@x.com' },
                moveInDate: new Date()
            },
            room: { number: '101' }
        };

        generateRentReceipt(payment, profile);

        expect(mockDoc.save).toHaveBeenCalledTimes(1);
    });

    it('saves with a filename containing the payment _id when no gateway_order_id', () => {
        const payment = { _id: 'pay123', amount: 5000 };

        generateRentReceipt(payment, null);

        expect(mockDoc.save).toHaveBeenCalledWith(
            expect.stringContaining('pay123')
        );
    });

    it('saves with a filename containing gateway_order_id when provided', () => {
        const payment = { _id: 'pay123', amount: 5000, gateway_order_id: 'order_abc' };

        generateRentReceipt(payment, null);

        expect(mockDoc.save).toHaveBeenCalledWith(
            expect.stringContaining('order_abc')
        );
    });

    // ── Minimal payment object ─────────────────────────────────────────────

    it('works with minimal payment object { _id, amount } without throwing', () => {
        const payment = { _id: 'pay123', amount: 5000 };

        expect(() => generateRentReceipt(payment, null)).not.toThrow();
        expect(mockDoc.save).toHaveBeenCalledTimes(1);
    });

    // ── Null / undefined profile – fallback values ─────────────────────────

    it('uses fallback PG name "StayEase Residency" when profile is null', () => {
        const payment = { _id: 'pay456', amount: 8000 };

        generateRentReceipt(payment, null);

        expect(mockDoc.save).toHaveBeenCalledTimes(1);

        const allTextCalls = mockDoc.text.mock.calls.map((args) => args[0]).flat();
        expect(allTextCalls).toContain('StayEase Residency');
    });

    it('does not throw when profile is undefined', () => {
        const payment = { _id: 'pay789', amount: 3000 };

        expect(() => generateRentReceipt(payment, undefined)).not.toThrow();
        expect(mockDoc.save).toHaveBeenCalledTimes(1);
    });

    // ── Tenant name from nested payment object ─────────────────────────────

    it('uses tenant name from payment.tenant_id.user_id.name when present', () => {
        const payment = {
            _id: 'pay001',
            amount: 7000,
            tenant_id: {
                user_id: { name: 'Nested Tenant', email: 'nested@x.com' },
                room_id: { number: '202' }
            }
        };

        generateRentReceipt(payment, null);

        const allTextCalls = mockDoc.text.mock.calls.map((args) => args[0]).flat();
        expect(allTextCalls).toContain('Nested Tenant');
    });

    it('falls back to profile.tenant.user_id.name when payment.tenant_id is absent', () => {
        const payment = { _id: 'pay002', amount: 4500 };
        const profile = {
            tenant: { user_id: { name: 'Profile Tenant', email: 'pt@x.com' } }
        };

        generateRentReceipt(payment, profile);

        const allTextCalls = mockDoc.text.mock.calls.map((args) => args[0]).flat();
        expect(allTextCalls).toContain('Profile Tenant');
    });

    it('falls back to "Valued Resident" when no tenant name is available anywhere', () => {
        const payment = { _id: 'pay003', amount: 2000 };

        generateRentReceipt(payment, null);

        const allTextCalls = mockDoc.text.mock.calls.map((args) => args[0]).flat();
        expect(allTextCalls).toContain('Valued Resident');
    });

    // ── Document construction calls ────────────────────────────────────────

    it('calls setFillColor, rect and text on the jsPDF document', () => {
        const payment = { _id: 'pay555', amount: 1000 };

        generateRentReceipt(payment, null);

        expect(mockDoc.setFillColor).toHaveBeenCalled();
        expect(mockDoc.rect).toHaveBeenCalled();
        expect(mockDoc.text).toHaveBeenCalled();
    });

    // ── Receipt type labels ────────────────────────────────────────────────

    it('renders DEPOSIT type label correctly', () => {
        const payment = { _id: 'pay888', amount: 10000, type: 'DEPOSIT' };

        generateRentReceipt(payment, null);

        const allTextCalls = mockDoc.text.mock.calls.map((args) => args[0]).flat();
        expect(
            allTextCalls.some((t) => typeof t === 'string' && t.includes('Security Deposit'))
        ).toBe(true);
    });

    it('renders Monthly Room Rent label for non-DEPOSIT type', () => {
        const payment = { _id: 'pay999', amount: 6000, type: 'RENT' };

        generateRentReceipt(payment, null);

        const allTextCalls = mockDoc.text.mock.calls.map((args) => args[0]).flat();
        expect(
            allTextCalls.some((t) => typeof t === 'string' && t.includes('Monthly Room Rent'))
        ).toBe(true);
    });

    // ── pg_id fallback path ────────────────────────────────────────────────

    it('reads pg name from profile.pg_id.name when profile.pg is absent', () => {
        const payment = { _id: 'pay777', amount: 5500 };
        const profile = {
            pg_id: {
                name: 'PG_ID Name',
                address: '2nd Cross',
                contact_number: '1234567890'
            }
        };

        generateRentReceipt(payment, profile);

        const allTextCalls = mockDoc.text.mock.calls.map((args) => args[0]).flat();
        expect(allTextCalls).toContain('PG_ID Name');
    });
});
