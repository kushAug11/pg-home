import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Payments from './Payments';
import tenantService from '../../services/tenant.service';

// Mock dependencies
vi.mock('../../services/tenant.service');

// Mock Razorpay
const mockRazorpay = {
    open: vi.fn(),
    on: vi.fn(),
};
window.Razorpay = vi.fn(function MockRazorpay() {
    return mockRazorpay;
});

describe('Tenant Payments Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.alert.mockClear();
        window.confirm.mockReturnValue(true);
    });

    const mockPaymentsDetails = {
        rentAmount: 5000,
        payments: [
            {
                _id: 'p1',
                transaction_date: '2023-10-01',
                amount: 5000,
                type: 'RENT',
                status: 'SUCCESS',
                gateway_order_id: 'order_123'
            }
        ]
    };

    it('renders payments dashboard with history', async () => {
        tenantService.getPayments.mockResolvedValue({ success: true, data: mockPaymentsDetails });

        render(
            <BrowserRouter>
                <Payments />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText('₹5000').length).toBeGreaterThan(0);
            expect(screen.getByText('order_123')).toBeInTheDocument();
            expect(screen.getByText('SUCCESS')).toBeInTheDocument();
        });
    });

    it('initiates payment successfully', async () => {
        tenantService.getPayments.mockResolvedValue({ success: true, data: mockPaymentsDetails });
        tenantService.initiateRentPayment.mockResolvedValue({
            success: true,
            key_id: 'rzp_test_123',
            amount: 500000,
            order_id: 'order_new_1',
        });

        render(
            <BrowserRouter>
                <Payments />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getAllByText('₹5000').length).toBeGreaterThan(0));

        const payButton = screen.getByText('Pay Invoice Now');
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(tenantService.initiateRentPayment).toHaveBeenCalledTimes(1);
            expect(window.Razorpay).toHaveBeenCalled();
            expect(mockRazorpay.open).toHaveBeenCalled();
        });
    });

    it('handles payment failure gracefully', async () => {
        tenantService.getPayments.mockResolvedValue({ success: true, data: mockPaymentsDetails });
        tenantService.initiateRentPayment.mockResolvedValue({ success: false });

        // Mock alert
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(
            <BrowserRouter>
                <Payments />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getAllByText('₹5000').length).toBeGreaterThan(0));
        fireEvent.click(screen.getByText('Pay Invoice Now'));

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('Failed to initiate payment');
        });
    });
});
