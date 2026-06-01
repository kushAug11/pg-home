import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import VisitorLog from './VisitorLog';

// Mock react-hot-toast (VisitorLog.jsx uses: import { toast } from 'react-hot-toast')
vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock securityService with all methods used by VisitorLog.jsx
vi.mock('../../services/security.service', () => ({
    default: {
        getActiveVisitors: vi.fn(),
        getPendingRequests: vi.fn(),
        getPreAuthVisitors: vi.fn(),
        logEntry: vi.fn(),
        markExit: vi.fn(),
        updateRequestStatus: vi.fn(),
        checkInPreAuthVisitor: vi.fn(),
    },
}));

import securityService from '../../services/security.service';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Helper data
// ─────────────────────────────────────────────────────────────────────────────
const mockActiveVisitors = [
    {
        _id: 'av1',
        name: 'Suresh Patel',
        phone: '9000000001',
        purpose: 'Delivery',
        details: 'Meeting owner',
        entryTime: new Date().toISOString(),
    },
    {
        _id: 'av2',
        name: 'Meena Rao',
        phone: '9000000002',
        purpose: 'Visit',
        details: 'Family visit',
        entryTime: new Date().toISOString(),
    },
];

const mockPendingRequests = [
    {
        _id: 'req1',
        guest_name: 'Kiran Nair',
        relation: 'Brother',
        fromDate: new Date().toISOString(),
        toDate: new Date().toISOString(),
    },
];

const mockPreAuthList = [
    {
        _id: 'pa1',
        name: 'Raj Kumar',
        phone: '9111111111',
        purpose: 'Visit',
        visitDate: new Date().toISOString(),
        status: 'PENDING',
        qrCodeToken: 'PASS-TOKEN-001',
        tenant_id: {
            user_id: { name: 'Amit Singh' },
            room_id: { number: '202' },
        },
    },
    {
        _id: 'pa2',
        name: 'Deepa Menon',
        phone: '9222222222',
        purpose: 'Delivery',
        visitDate: new Date().toISOString(),
        status: 'CHECKED_IN',
        qrCodeToken: 'PASS-TOKEN-002',
        tenant_id: {
            user_id: { name: 'Priya Das' },
            room_id: { number: '305' },
        },
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('VisitorLog Component – Owner / Security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        securityService.getActiveVisitors.mockResolvedValue([]);
        securityService.getPendingRequests.mockResolvedValue([]);
        securityService.getPreAuthVisitors.mockResolvedValue([]);
    });

    // ── Page structure ────────────────────────────────────────────────────────

    it('renders the page header "Security & Visitors"', async () => {
        render(<VisitorLog />);
        await waitFor(() => {
            expect(screen.getByText(/Security & Visitors/i)).toBeInTheDocument();
        });
    });

    it('renders all three tab buttons', async () => {
        render(<VisitorLog />);
        expect(screen.getByText('Visitor Log')).toBeInTheDocument();
        expect(screen.getByText('Guest Requests')).toBeInTheDocument();
        expect(screen.getByText('QR Pre-Authorizations')).toBeInTheDocument();
    });

    // ── Tab 1: Visitor Log ────────────────────────────────────────────────────

    it('shows Log New Entry card form on default tab', async () => {
        render(<VisitorLog />);
        await waitFor(() => {
            expect(screen.getByText('Log New Entry')).toBeInTheDocument();
        });
    });

    it('shows empty state when no active visitors', async () => {
        render(<VisitorLog />);
        await waitFor(() => {
            expect(screen.getByText('No visitors currently inside.')).toBeInTheDocument();
        });
    });

    it('shows "Currently Inside (N)" count heading', async () => {
        render(<VisitorLog />);
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Currently Inside/i })).toBeInTheDocument();
        });
    });

    it('renders visitor entries when active visitors exist', async () => {
        securityService.getActiveVisitors.mockResolvedValue(mockActiveVisitors);
        render(<VisitorLog />);
        await waitFor(() => {
            expect(screen.getByText('Suresh Patel')).toBeInTheDocument();
            expect(screen.getByText('Meena Rao')).toBeInTheDocument();
        });
    });

    it('renders visitor purpose and details', async () => {
        securityService.getActiveVisitors.mockResolvedValue(mockActiveVisitors);
        render(<VisitorLog />);
        await waitFor(() => {
            expect(screen.getByText(/Delivery.*Meeting owner/)).toBeInTheDocument();
        });
    });

    it('shows "Mark Exit" button for each active visitor', async () => {
        securityService.getActiveVisitors.mockResolvedValue(mockActiveVisitors);
        render(<VisitorLog />);
        await waitFor(() => {
            const exitBtns = screen.getAllByText('Mark Exit');
            expect(exitBtns.length).toBe(2);
        });
    });

    it('calls markExit when Mark Exit button is clicked', async () => {
        securityService.getActiveVisitors.mockResolvedValue(mockActiveVisitors);
        securityService.markExit.mockResolvedValue({ success: true });
        render(<VisitorLog />);

        await waitFor(() => screen.getAllByText('Mark Exit'));
        fireEvent.click(screen.getAllByText('Mark Exit')[0]);

        await waitFor(() => {
            expect(securityService.markExit).toHaveBeenCalledWith('av1');
            expect(toast.success).toHaveBeenCalledWith('Visitor Exited');
        });
    });

    it('shows Log Entry button and can log a new visitor entry', async () => {
        securityService.logEntry.mockResolvedValue({ success: true });
        securityService.getActiveVisitors
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([mockActiveVisitors[0]]);

        render(<VisitorLog />);
        await waitFor(() => screen.getByText('No visitors currently inside.'));

        // Fill in the form
        const nameInput = screen.getAllByRole('textbox')[0]; // first input is Name
        const phoneInput = screen.getAllByRole('textbox')[1]; // second is Phone
        fireEvent.change(nameInput, { target: { value: 'Test Visitor' } });
        fireEvent.change(phoneInput, { target: { value: '9999999999' } });

        fireEvent.click(screen.getByText('Log Entry'));

        await waitFor(() => {
            expect(securityService.logEntry).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Test Visitor', phone: '9999999999' })
            );
            expect(toast.success).toHaveBeenCalledWith('Visitor Logged');
        });
    });

    it('shows toast error when fetching visitors fails', async () => {
        securityService.getActiveVisitors.mockRejectedValue(new Error('Network error'));
        render(<VisitorLog />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load visitors');
        });
    });

    // ── Tab 2: Guest Requests ─────────────────────────────────────────────────

    it('switches to Guest Requests tab and shows empty state', async () => {
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('Guest Requests'));
        await waitFor(() => {
            expect(screen.getByText('No pending guest requests.')).toBeInTheDocument();
        });
    });

    it('renders pending guest request cards', async () => {
        securityService.getPendingRequests.mockResolvedValue(mockPendingRequests);
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('Guest Requests'));
        await waitFor(() => {
            expect(screen.getByText('Guest: Kiran Nair')).toBeInTheDocument();
            expect(screen.getByText('Relation: Brother')).toBeInTheDocument();
        });
    });

    it('shows badge count on Guest Requests tab when requests exist', async () => {
        securityService.getPendingRequests.mockResolvedValue(mockPendingRequests);
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('Guest Requests'));
        await waitFor(() => {
            // The badge shows the count
            expect(screen.getByText('1')).toBeInTheDocument();
        });
    });

    it('calls updateRequestStatus(APPROVED) when approve icon is clicked', async () => {
        securityService.getPendingRequests.mockResolvedValue(mockPendingRequests);
        securityService.updateRequestStatus.mockResolvedValue({ success: true });
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('Guest Requests'));
        await waitFor(() => screen.getByText('Guest: Kiran Nair'));

        // Click the Approve button (title="Approve")
        fireEvent.click(screen.getByTitle('Approve'));
        await waitFor(() => {
            expect(securityService.updateRequestStatus).toHaveBeenCalledWith('req1', 'APPROVED');
            expect(toast.success).toHaveBeenCalledWith('Request APPROVED');
        });
    });

    it('calls updateRequestStatus(REJECTED) when reject icon is clicked', async () => {
        securityService.getPendingRequests.mockResolvedValue(mockPendingRequests);
        securityService.updateRequestStatus.mockResolvedValue({ success: true });
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('Guest Requests'));
        await waitFor(() => screen.getByText('Guest: Kiran Nair'));

        fireEvent.click(screen.getByTitle('Reject'));
        await waitFor(() => {
            expect(securityService.updateRequestStatus).toHaveBeenCalledWith('req1', 'REJECTED');
        });
    });

    // ── Tab 3: QR Pre-Authorizations ─────────────────────────────────────────

    it('switches to QR Pre-Authorizations tab', async () => {
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => {
            expect(screen.getByText('Scan or Enter QR Pass')).toBeInTheDocument();
        });
    });

    it('shows empty pre-auth state when no passes exist', async () => {
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => {
            expect(screen.getByText('No tenant pre-authorizations created yet.')).toBeInTheDocument();
        });
    });

    it('shows Pre-Authorized Visitor Passes list when data is available', async () => {
        securityService.getPreAuthVisitors.mockResolvedValue(mockPreAuthList);
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => {
            expect(screen.getByText('Raj Kumar')).toBeInTheDocument();
            expect(screen.getByText('Deepa Menon')).toBeInTheDocument();
        });
    });

    it('shows PENDING and CHECKED_IN status badges on pre-auth cards', async () => {
        securityService.getPreAuthVisitors.mockResolvedValue(mockPreAuthList);
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => {
            expect(screen.getByText('PENDING')).toBeInTheDocument();
            expect(screen.getByText('CHECKED_IN')).toBeInTheDocument();
        });
    });

    it('renders tenant name and room number on pre-auth cards', async () => {
        securityService.getPreAuthVisitors.mockResolvedValue(mockPreAuthList);
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => {
            expect(screen.getByText(/Amit Singh.*Room 202/i)).toBeInTheDocument();
        });
    });

    it('shows QR pass tokens on pre-auth cards', async () => {
        securityService.getPreAuthVisitors.mockResolvedValue(mockPreAuthList);
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => {
            expect(screen.getByText('PASS-TOKEN-001')).toBeInTheDocument();
            expect(screen.getByText('PASS-TOKEN-002')).toBeInTheDocument();
        });
    });

    it('shows "Instant Check-In" button only for PENDING passes', async () => {
        securityService.getPreAuthVisitors.mockResolvedValue(mockPreAuthList);
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => {
            const checkInBtns = screen.getAllByText('Instant Check-In');
            // Only Raj Kumar is PENDING
            expect(checkInBtns.length).toBe(1);
        });
    });

    it('calls checkInPreAuthVisitor when Instant Check-In is clicked', async () => {
        securityService.getPreAuthVisitors.mockResolvedValue(mockPreAuthList);
        securityService.checkInPreAuthVisitor.mockResolvedValue({
            success: true,
            message: 'Visitor Checked In Successfully!',
        });
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => screen.getByText('Instant Check-In'));

        fireEvent.click(screen.getByText('Instant Check-In'));
        await waitFor(() => {
            expect(securityService.checkInPreAuthVisitor).toHaveBeenCalledWith('PASS-TOKEN-001');
            expect(toast.success).toHaveBeenCalledWith('Visitor Checked In Successfully!');
        });
    });

    it('can verify a pass token using the input form', async () => {
        securityService.checkInPreAuthVisitor.mockResolvedValue({
            success: true,
            message: 'Visitor Checked In Successfully!',
        });
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => screen.getByText('Scan or Enter QR Pass'));

        const input = screen.getByPlaceholderText(/pass_abc123xyz/i);
        fireEvent.change(input, { target: { value: 'PASS-TOKEN-TEST' } });
        fireEvent.click(screen.getByText(/Verify & Check-In/i));

        await waitFor(() => {
            expect(securityService.checkInPreAuthVisitor).toHaveBeenCalledWith('PASS-TOKEN-TEST');
        });
    });

    it('shows error toast when pre-auth fetch fails', async () => {
        securityService.getPreAuthVisitors.mockRejectedValue(new Error('Network error'));
        render(<VisitorLog />);
        fireEvent.click(screen.getByText('QR Pre-Authorizations'));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load pre-authorized passes');
        });
    });
});
