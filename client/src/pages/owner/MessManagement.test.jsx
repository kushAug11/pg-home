import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import MessManagement from './MessManagement';

// Mock react-hot-toast (MessManagement.jsx uses: import { toast } from 'react-hot-toast')
vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock messService with all methods used by MessManagement.jsx
vi.mock('../../services/mess.service', () => ({
    default: {
        getMenu: vi.fn(),
        updateMenu: vi.fn(),
        getAnalytics: vi.fn(),
        getVouchersList: vi.fn(),
        verifyVoucher: vi.fn(),
    },
}));

import messService from '../../services/mess.service';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Helper data
// ─────────────────────────────────────────────────────────────────────────────
const mockMenuData = [
    {
        _id: 'm1',
        date: new Date().toISOString(),
        meals: { breakfast: 'Poha', lunch: 'Rice & Dal', snacks: 'Tea & Biscuit', dinner: 'Roti & Sabzi' },
    },
];

const mockAnalytics = {
    stats: [
        { meal: 'breakfast', total: 10, eating: 8, skipped: 2 },
        { meal: 'lunch', total: 10, eating: 9, skipped: 1 },
    ],
};

const mockVouchersList = [
    {
        _id: 'vc1',
        mealType: 'Lunch',
        price: 80,
        status: 'UNUSED',
        voucherCode: 'MEAL-001',
        purchaseDate: new Date().toISOString(),
        isGuestVoucher: false,
        tenant_id: {
            user_id: { name: 'Ravi Kumar' },
            room_id: { number: '101' },
        },
    },
    {
        _id: 'vc2',
        mealType: 'Dinner',
        price: 80,
        status: 'USED',
        voucherCode: 'MEAL-002',
        purchaseDate: new Date().toISOString(),
        useDate: new Date().toISOString(),
        isGuestVoucher: true,
        guestName: 'Priya Sharma',
        tenant_id: {
            user_id: { name: 'Ravi Kumar' },
            room_id: { number: '101' },
        },
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('MessManagement Component – Owner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        messService.getMenu.mockResolvedValue(mockMenuData);
        messService.getAnalytics.mockResolvedValue(mockAnalytics);
        messService.getVouchersList.mockResolvedValue(mockVouchersList);
        messService.updateMenu.mockResolvedValue({ success: true });
        messService.verifyVoucher.mockResolvedValue({ success: true, message: 'Voucher redeemed successfully!' });
    });

    // ── Page structure ────────────────────────────────────────────────────────

    it('renders the page header "Mess Menu & Coupons Manager"', async () => {
        render(<MessManagement />);
        await waitFor(() => {
            expect(screen.getByText(/Mess Menu & Coupons Manager/i)).toBeInTheDocument();
        });
    });

    it('renders both tab buttons', async () => {
        render(<MessManagement />);
        expect(screen.getByText(/Weekly Menu & Forecasts/i)).toBeInTheDocument();
        expect(screen.getByText(/Meal Coupon Redemptions/i)).toBeInTheDocument();
    });

    // ── Tab 1: Weekly Menu ────────────────────────────────────────────────────

    it('shows loading state while menu is being fetched', () => {
        messService.getMenu.mockReturnValue(new Promise(() => {}));
        messService.getAnalytics.mockResolvedValue(mockAnalytics);
        render(<MessManagement />);
        expect(screen.getByText('Loading weekly menu...')).toBeInTheDocument();
    });

    it('renders the weekly menu table headers after loading', async () => {
        render(<MessManagement />);
        await waitFor(() => {
            expect(screen.getByText('Day')).toBeInTheDocument();
            // Visible meal columns
            expect(screen.getAllByText('breakfast').length).toBeGreaterThan(0);
            expect(screen.getAllByText('lunch').length).toBeGreaterThan(0);
        });
    });

    it('renders 7 day rows in the menu table', async () => {
        render(<MessManagement />);
        await waitFor(() => {
            // Each day renders one of Mon-Sun – check for at least Monday & Tuesday
            expect(screen.getByText('Monday')).toBeInTheDocument();
            expect(screen.getByText('Tuesday')).toBeInTheDocument();
        });
    });

    it('shows "Today\'s Consumption Forecast" card', async () => {
        render(<MessManagement />);
        await waitFor(() => {
            expect(screen.getByText("Today's Consumption Forecast")).toBeInTheDocument();
        });
    });

    it('renders analytics forecast stats', async () => {
        render(<MessManagement />);
        await waitFor(() => {
            expect(screen.getAllByText('breakfast').length).toBeGreaterThan(0);
            // Eating count from analytics
            expect(screen.getByText('8')).toBeInTheDocument();
        });
    });

    it('shows "No forecast data" message when analytics is empty', async () => {
        messService.getAnalytics.mockResolvedValue({ stats: [] });
        render(<MessManagement />);
        await waitFor(() => {
            expect(screen.getByText('No forecast data available for today.')).toBeInTheDocument();
        });
    });

    it('shows "Save Changes" button', async () => {
        render(<MessManagement />);
        await waitFor(() => {
            expect(screen.getByText('Save Changes')).toBeInTheDocument();
        });
    });

    it('calls updateMenu for each day when Save Changes is clicked', async () => {
        render(<MessManagement />);
        await waitFor(() => screen.getByText('Save Changes'));

        fireEvent.click(screen.getByText('Save Changes'));
        await waitFor(() => {
            // Should call updateMenu 7 times (once per day)
            expect(messService.updateMenu).toHaveBeenCalledTimes(7);
            expect(toast.success).toHaveBeenCalledWith('Weekly menu saved successfully!');
        });
    });

    it('shows toast error when menu save fails', async () => {
        messService.updateMenu.mockRejectedValue(new Error('Save failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<MessManagement />);
        await waitFor(() => screen.getByText('Save Changes'));
        fireEvent.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to save menu');
        });
        consoleSpy.mockRestore();
    });

    it('shows toast error when menu fetch fails', async () => {
        messService.getMenu.mockRejectedValue(new Error('Fetch failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<MessManagement />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load menu');
        });
        consoleSpy.mockRestore();
    });

    // ── Tab 2: Voucher Redemptions ────────────────────────────────────────────

    it('switches to the Voucher Redemptions tab', async () => {
        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));
        await waitFor(() => {
            expect(screen.getByText('Redeem Meal Coupon')).toBeInTheDocument();
        });
    });

    it('shows loading state in vouchers tab while fetching', () => {
        messService.getVouchersList.mockReturnValue(new Promise(() => {}));
        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));
        expect(screen.getByText('Loading vouchers...')).toBeInTheDocument();
    });

    it('shows "No meal coupons ordered" empty state when list is empty', async () => {
        messService.getVouchersList.mockResolvedValue([]);
        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));
        await waitFor(() => {
            expect(screen.getByText('No meal coupons ordered in this PG yet.')).toBeInTheDocument();
        });
    });

    it('renders voucher list items when vouchers exist', async () => {
        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));
        await waitFor(() => {
            expect(screen.getByText('Lunch Coupon')).toBeInTheDocument();
            expect(screen.getByText('Dinner Coupon')).toBeInTheDocument();
        });
    });

    it('shows tenant name and room number on voucher items', async () => {
        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));
        await waitFor(() => {
            const tenantElements = screen.getAllByText(/Tenant:/i);
            expect(tenantElements.length).toBeGreaterThan(0);
            expect(tenantElements[0].textContent).toContain('Ravi Kumar');
            expect(tenantElements[0].textContent).toContain('101');
        });
    });

    it('shows "Redeem Coupon" button only for UNUSED vouchers', async () => {
        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));
        await waitFor(() => {
            const redeemBtns = screen.getAllByText('Redeem Coupon');
            // Only 1 UNUSED voucher in mockVouchersList
            expect(redeemBtns.length).toBe(1);
        });
    });

    it('calls verifyVoucher when Redeem Coupon button is clicked on a list item', async () => {
        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));
        await waitFor(() => screen.getByText('Redeem Coupon'));

        fireEvent.click(screen.getByText('Redeem Coupon'));
        await waitFor(() => {
            expect(messService.verifyVoucher).toHaveBeenCalledWith('MEAL-001');
            expect(toast.success).toHaveBeenCalledWith('Voucher redeemed successfully!');
        });
    });

    it('can verify a coupon by code using the input form', async () => {
        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));
        await waitFor(() => screen.getByText('Redeem Meal Coupon'));

        const input = screen.getByPlaceholderText(/meal_coup_abc123xyz/i);
        fireEvent.change(input, { target: { value: 'MEAL-TEST-XYZ' } });
        fireEvent.click(screen.getByText(/Verify & Redeem Coupon/i));

        await waitFor(() => {
            expect(messService.verifyVoucher).toHaveBeenCalledWith('MEAL-TEST-XYZ');
            expect(toast.success).toHaveBeenCalledWith('Voucher redeemed successfully!');
        });
    });

    it('shows error when voucher fetch fails', async () => {
        messService.getVouchersList.mockRejectedValue(new Error('Fetch error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load meal vouchers');
        });
        consoleSpy.mockRestore();
    });

    it('shows guest name badge on guest vouchers', async () => {
        render(<MessManagement />);
        fireEvent.click(screen.getByText(/Meal Coupon Redemptions/i));
        await waitFor(() => {
            expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
        });
    });

    it('renders week navigation – Previous Week and Next Week buttons', async () => {
        render(<MessManagement />);
        await waitFor(() => screen.getByTitle('Previous Week'));
        expect(screen.getByTitle('Previous Week')).toBeInTheDocument();
        expect(screen.getByTitle('Next Week')).toBeInTheDocument();
    });
});
