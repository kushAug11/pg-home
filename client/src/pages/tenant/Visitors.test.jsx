import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Visitors from './Visitors';

// Mock react-hot-toast (Visitors.jsx uses: import toast from 'react-hot-toast')
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock tenantService – Visitors.jsx uses tenantService, NOT securityService
vi.mock('../../services/tenant.service', () => ({
    default: {
        getPreAuthVisitors: vi.fn(),
        createPreAuthVisitor: vi.fn(),
    },
}));

import tenantService from '../../services/tenant.service';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Helper data
// ─────────────────────────────────────────────────────────────────────────────
const mockVisitors = [
    {
        _id: 'vis1',
        name: 'Alice Smith',
        phone: '9876543210',
        purpose: 'Visit',
        visitDate: new Date().toISOString(),
        status: 'PENDING',
        qrCodeToken: 'TOKEN-001',
    },
    {
        _id: 'vis2',
        name: 'Bob Builder',
        phone: '9123456780',
        purpose: 'Maintenance',
        visitDate: new Date().toISOString(),
        status: 'CHECKED_IN',
        qrCodeToken: 'TOKEN-002',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Visitors Component – Tenant', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        tenantService.getPreAuthVisitors.mockResolvedValue({ success: true, data: [] });
    });

    it('renders the page heading', async () => {
        render(<Visitors />);
        expect(screen.getByText('Pre-Authorized Visitor Passes')).toBeInTheDocument();
    });

    it('renders the "Authorized Visitors Pass History" section heading', async () => {
        render(<Visitors />);
        expect(screen.getByText('Authorized Visitors Pass History')).toBeInTheDocument();
    });

    it('shows loading spinner while fetching visitors', () => {
        // Never resolves – stay in loading state
        tenantService.getPreAuthVisitors.mockReturnValue(new Promise(() => {}));
        render(<Visitors />);
        expect(screen.getByText('Loading passes...')).toBeInTheDocument();
    });

    it('shows empty state when no passes exist', async () => {
        render(<Visitors />);
        await waitFor(() => {
            expect(screen.getByText('No Visitor Passes Raised')).toBeInTheDocument();
        });
    });

    it('shows empty state action button "Create Your First Pass"', async () => {
        render(<Visitors />);
        await waitFor(() => {
            expect(screen.getByText('Create Your First Pass')).toBeInTheDocument();
        });
    });

    it('renders visitor pass cards when data is available', async () => {
        tenantService.getPreAuthVisitors.mockResolvedValue({ success: true, data: mockVisitors });
        render(<Visitors />);
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob Builder')).toBeInTheDocument();
        });
    });

    it('renders visitor phone numbers', async () => {
        tenantService.getPreAuthVisitors.mockResolvedValue({ success: true, data: mockVisitors });
        render(<Visitors />);
        await waitFor(() => {
            expect(screen.getByText('9876543210')).toBeInTheDocument();
        });
    });

    it('shows QR pass tokens on visitor cards', async () => {
        tenantService.getPreAuthVisitors.mockResolvedValue({ success: true, data: mockVisitors });
        render(<Visitors />);
        await waitFor(() => {
            expect(screen.getByText('TOKEN-001')).toBeInTheDocument();
            expect(screen.getByText('TOKEN-002')).toBeInTheDocument();
        });
    });

    it('shows visitor purpose tags', async () => {
        tenantService.getPreAuthVisitors.mockResolvedValue({ success: true, data: mockVisitors });
        render(<Visitors />);
        await waitFor(() => {
            expect(screen.getByText('Visit')).toBeInTheDocument();
            expect(screen.getByText('Maintenance')).toBeInTheDocument();
        });
    });

    it('shows Create New Pass button', async () => {
        render(<Visitors />);
        expect(screen.getByText('Create New Pass')).toBeInTheDocument();
    });

    it('opens the create pass form when "Create New Pass" is clicked', async () => {
        render(<Visitors />);
        fireEvent.click(screen.getByText('Create New Pass'));
        await waitFor(() => {
            expect(screen.getByText('New Visitor Pre-Authorization Form')).toBeInTheDocument();
        });
    });

    it('hides form and shows Cancel button when form is open', async () => {
        render(<Visitors />);
        fireEvent.click(screen.getByText('Create New Pass'));
        expect(screen.getAllByText('Cancel').length).toBeGreaterThan(0);
    });

    it('creates a visitor pass successfully', async () => {
        tenantService.createPreAuthVisitor.mockResolvedValue({ success: true });
        tenantService.getPreAuthVisitors
            .mockResolvedValueOnce({ success: true, data: [] })
            .mockResolvedValueOnce({ success: true, data: [mockVisitors[0]] });

        render(<Visitors />);
        await waitFor(() => screen.getByText('No Visitor Passes Raised'));

        fireEvent.click(screen.getByText('Create New Pass'));
        await waitFor(() => screen.getByText('New Visitor Pre-Authorization Form'));

        // Fill form fields
        fireEvent.change(screen.getByPlaceholderText(/John Doe, Amazon Agent/i), {
            target: { value: 'Alice Smith' },
        });
        fireEvent.change(screen.getByPlaceholderText(/9876543210/i), {
            target: { value: '9876543210' },
        });

        fireEvent.click(screen.getByText('Generate Digital Pass'));

        await waitFor(() => {
            expect(tenantService.createPreAuthVisitor).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Alice Smith', phone: '9876543210' })
            );
            expect(toast.success).toHaveBeenCalledWith('Pre-authorized pass generated!');
        });
    });

    it('shows error toast when pass creation fails (server error)', async () => {
        tenantService.createPreAuthVisitor.mockRejectedValue(new Error('Server error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<Visitors />);
        fireEvent.click(screen.getByText('Create New Pass'));
        await waitFor(() => screen.getByText('New Visitor Pre-Authorization Form'));

        fireEvent.change(screen.getByPlaceholderText(/John Doe, Amazon Agent/i), {
            target: { value: 'Alice Smith' },
        });
        fireEvent.change(screen.getByPlaceholderText(/9876543210/i), {
            target: { value: '9876543210' },
        });
        fireEvent.click(screen.getByText('Generate Digital Pass'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Server error. Please try again.');
        });
        consoleSpy.mockRestore();
    });

    it('shows error toast when fetching passes fails', async () => {
        tenantService.getPreAuthVisitors.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<Visitors />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load pre-authorized passes');
        });
        consoleSpy.mockRestore();
    });

    it('shows PENDING / CHECKED_IN status badges on visitor cards', async () => {
        tenantService.getPreAuthVisitors.mockResolvedValue({ success: true, data: mockVisitors });
        render(<Visitors />);
        await waitFor(() => {
            expect(screen.getByText('PENDING')).toBeInTheDocument();
            expect(screen.getAllByText('CHECKED_IN').length).toBeGreaterThan(0);
        });
    });

    it('shows "Copy & Share Pass" only for PENDING visitors', async () => {
        tenantService.getPreAuthVisitors.mockResolvedValue({ success: true, data: mockVisitors });
        render(<Visitors />);
        await waitFor(() => {
            const copyBtns = screen.getAllByText('Copy & Share Pass');
            // Only Alice (PENDING) should have it
            expect(copyBtns.length).toBe(1);
        });
    });
});
