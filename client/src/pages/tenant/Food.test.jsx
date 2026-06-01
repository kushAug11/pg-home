import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Food from './Food';

// Mock react-hot-toast (Food.jsx uses: import { toast } from 'react-hot-toast')
vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock messService with all methods used by Food.jsx
vi.mock('../../services/mess.service', () => ({
    default: {
        getMenu: vi.fn(),
        getMyVouchers: vi.fn(),
        markAttendance: vi.fn(),
        purchaseVoucher: vi.fn(),
    },
}));

// Import mocked modules for assertions
import messService from '../../services/mess.service';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Helper data
// ─────────────────────────────────────────────────────────────────────────────
const mockMenu = [
    {
        _id: 'm1',
        date: new Date().toISOString(),
        meals: {
            breakfast: 'Idli & Sambar',
            lunch: 'Rice & Dal',
            snacks: 'Banana',
            dinner: 'Chapati & Sabzi',
        },
    },
];

const mockVouchers = [
    {
        _id: 'v1',
        mealType: 'Lunch',
        price: 80,
        status: 'UNUSED',
        voucherCode: 'MEAL-001',
        purchaseDate: new Date().toISOString(),
        isGuestVoucher: false,
        guestName: '',
    },
    {
        _id: 'v2',
        mealType: 'Dinner',
        price: 80,
        status: 'USED',
        voucherCode: 'MEAL-002',
        purchaseDate: new Date().toISOString(),
        useDate: new Date().toISOString(),
        isGuestVoucher: true,
        guestName: 'John Doe',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Food Component – Tenant', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: getMenu resolves with data; getMyVouchers resolves with empty
        messService.getMenu.mockResolvedValue(mockMenu);
        messService.getMyVouchers.mockResolvedValue({ success: true, data: [] });
    });

    // ── Tab 1: Menu ──────────────────────────────────────────────────────────

    it('renders the page header', async () => {
        render(<Food />);
        // PageHeader renders the title
        await waitFor(() => {
            expect(screen.getByText(/Food, Menu & Mess Services/i)).toBeInTheDocument();
        });
    });

    it('renders the menu tab and voucher tab buttons', async () => {
        render(<Food />);
        expect(screen.getByText(/Daily Menu & Attendance/i)).toBeInTheDocument();
        expect(screen.getByText(/Meal Coupons/i)).toBeInTheDocument();
    });

    it('shows loading skeleton while fetching menu', () => {
        // Never resolves during this check
        messService.getMenu.mockReturnValue(new Promise(() => {}));
        render(<Food />);
        // The loading state renders 4 animate-pulse divs with class animate-pulse
        const pulseElements = document.querySelectorAll('.animate-pulse');
        expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('renders all four meal cards after menu loads', async () => {
        render(<Food />);
        await waitFor(() => {
            expect(screen.getByText('breakfast')).toBeInTheDocument();
            expect(screen.getByText('lunch')).toBeInTheDocument();
            expect(screen.getByText('snacks')).toBeInTheDocument();
            expect(screen.getByText('dinner')).toBeInTheDocument();
        });
    });

    it('renders menu item content from service response', async () => {
        render(<Food />);
        await waitFor(() => {
            expect(screen.getByText('Idli & Sambar')).toBeInTheDocument();
            expect(screen.getByText('Rice & Dal')).toBeInTheDocument();
        });
    });

    it('shows "No menu set for today" for empty meal slots', async () => {
        messService.getMenu.mockResolvedValue([
            { _id: 'm1', date: new Date().toISOString(), meals: { breakfast: '', lunch: '', snacks: '', dinner: '' } },
        ]);
        render(<Food />);
        await waitFor(() => {
            const emptySlots = screen.getAllByText('No menu set for today');
            expect(emptySlots.length).toBeGreaterThan(0);
        });
    });

    it('calls markAttendance with "eating" when I\'m Eating is clicked', async () => {
        messService.markAttendance.mockResolvedValue({ success: true });
        render(<Food />);
        await waitFor(() => expect(screen.getAllByText("I'm Eating").length).toBeGreaterThan(0));

        fireEvent.click(screen.getAllByText("I'm Eating")[0]);
        await waitFor(() => {
            expect(messService.markAttendance).toHaveBeenCalledWith(
                expect.any(String),
                'breakfast',
                'eating'
            );
        });
    });

    it('calls markAttendance with "skipped" when Skip Meal is clicked', async () => {
        messService.markAttendance.mockResolvedValue({ success: true });
        render(<Food />);
        await waitFor(() => expect(screen.getAllByText('Skip Meal').length).toBeGreaterThan(0));

        fireEvent.click(screen.getAllByText('Skip Meal')[0]);
        await waitFor(() => {
            expect(messService.markAttendance).toHaveBeenCalledWith(
                expect.any(String),
                'breakfast',
                'skipped'
            );
        });
    });

    it('shows toast error when menu fetch fails', async () => {
        messService.getMenu.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<Food />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load menu');
        });
        consoleSpy.mockRestore();
    });

    // ── Tab 2: Vouchers ──────────────────────────────────────────────────────

    it('switches to Meal Coupons tab when clicked', async () => {
        messService.getMyVouchers.mockResolvedValue({ success: true, data: [] });
        render(<Food />);

        fireEvent.click(screen.getByText(/Meal Coupons/i));
        await waitFor(() => {
            expect(screen.getByText('Extra Meal Coupons')).toBeInTheDocument();
        });
    });

    it('shows empty state when no vouchers exist', async () => {
        messService.getMyVouchers.mockResolvedValue({ success: true, data: [] });
        render(<Food />);

        fireEvent.click(screen.getByText(/Meal Coupons/i));
        await waitFor(() => {
            expect(screen.getByText('No Meal Coupons Ordered')).toBeInTheDocument();
        });
    });

    it('renders voucher cards when vouchers are loaded', async () => {
        messService.getMyVouchers.mockResolvedValue({ success: true, data: mockVouchers });
        render(<Food />);

        fireEvent.click(screen.getByText(/Meal Coupons/i));
        await waitFor(() => {
            expect(screen.getByText('Lunch Coupon')).toBeInTheDocument();
            expect(screen.getByText('Dinner Coupon')).toBeInTheDocument();
        });
    });

    it('shows guest name on guest voucher cards', async () => {
        messService.getMyVouchers.mockResolvedValue({ success: true, data: mockVouchers });
        render(<Food />);

        fireEvent.click(screen.getByText(/Meal Coupons/i));
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });

    it('opens purchase form when Purchase Coupon button is clicked', async () => {
        messService.getMyVouchers.mockResolvedValue({ success: true, data: [] });
        render(<Food />);

        fireEvent.click(screen.getByText(/Meal Coupons/i));
        await waitFor(() => screen.getByText('Extra Meal Coupons'));

        fireEvent.click(screen.getByText(/Purchase Coupon/i));
        expect(screen.getByText('Purchase Meal Coupon')).toBeInTheDocument();
    });

    it('shows guest name field when "This coupon is for a visiting guest" is checked', async () => {
        messService.getMyVouchers.mockResolvedValue({ success: true, data: [] });
        render(<Food />);

        fireEvent.click(screen.getByText(/Meal Coupons/i));
        await waitFor(() => screen.getByText('Extra Meal Coupons'));
        fireEvent.click(screen.getByText(/Purchase Coupon/i));

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/John Doe/i)).toBeInTheDocument();
        });
    });

    it('submits voucher purchase and shows success toast', async () => {
        messService.getMyVouchers.mockResolvedValue({ success: true, data: [] });
        messService.purchaseVoucher.mockResolvedValue({ success: true });
        render(<Food />);

        fireEvent.click(screen.getByText(/Meal Coupons/i));
        await waitFor(() => screen.getByText('Extra Meal Coupons'));
        fireEvent.click(screen.getByText(/Purchase Coupon/i));

        fireEvent.click(screen.getByText('Order & Bill to Rent'));
        await waitFor(() => {
            expect(messService.purchaseVoucher).toHaveBeenCalledWith(
                expect.objectContaining({ mealType: 'Lunch', price: 80 })
            );
            expect(toast.success).toHaveBeenCalledWith('Meal coupon purchased! Added to next rent bill.');
        });
    });

    it('shows error toast when voucher purchase fails', async () => {
        messService.getMyVouchers.mockResolvedValue({ success: true, data: [] });
        messService.purchaseVoucher.mockRejectedValue(new Error('Server error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<Food />);
        fireEvent.click(screen.getByText(/Meal Coupons/i));
        await waitFor(() => screen.getByText('Extra Meal Coupons'));
        fireEvent.click(screen.getByText(/Purchase Coupon/i));
        fireEvent.click(screen.getByText('Order & Bill to Rent'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Server error. Purchase failed.');
        });
        consoleSpy.mockRestore();
    });

    it('shows voucher fetch error toast', async () => {
        messService.getMyVouchers.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<Food />);
        fireEvent.click(screen.getByText(/Meal Coupons/i));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load vouchers');
        });
        consoleSpy.mockRestore();
    });

    it('opens QR modal when a voucher card is clicked', async () => {
        messService.getMyVouchers.mockResolvedValue({ success: true, data: mockVouchers });
        render(<Food />);

        fireEvent.click(screen.getByText(/Meal Coupons/i));
        await waitFor(() => screen.getByText('Lunch Coupon'));

        // Click the voucher card (it's a <button>)
        fireEvent.click(screen.getByText('Lunch Coupon'));
        await waitFor(() => {
            expect(screen.getByText('Mess Entry Food Pass')).toBeInTheDocument();
        });
    });
});
