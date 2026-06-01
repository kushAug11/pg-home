import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OwnerComplaints from './Complaints';
import ownerService from '../../services/owner.service';

// Mock ownerService
vi.mock('../../services/owner.service', () => ({
    default: {
        getComplaints: vi.fn(),
        updateComplaintStatus: vi.fn(),
    },
}));

// Mock the dynamically imported socket.service
vi.mock('../../services/socket.service', () => ({
    initSocket: vi.fn(),
    disconnectSocket: vi.fn(),
    getSocket: vi.fn(() => null),
}));

// Mock Skeleton to keep tests simple
vi.mock('../../components/common/Skeleton', () => ({
    default: ({ className }) => <div data-testid="skeleton" className={className} />,
}));

const mockComplaint = {
    _id: 'c1',
    title: 'Water Leakage',
    description: 'There is a water leak in the bathroom.',
    status: 'Pending',
    priority: 'High',
    category: 'Plumbing',
    createdAt: '2024-01-15T10:00:00Z',
    tenant_id: {
        user_id: { name: 'John Doe' },
        room_id: { number: '101' },
    },
};

describe('Owner Complaints Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state (Skeleton) initially', () => {
        // Never resolves — stays in loading state
        ownerService.getComplaints.mockReturnValue(new Promise(() => {}));
        render(<OwnerComplaints />);
        expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('shows empty state when no complaints are returned', async () => {
        ownerService.getComplaints.mockResolvedValue({ success: true, data: [] });
        render(<OwnerComplaints />);
        await waitFor(() => {
            expect(screen.getByText('No complaints found in this category.')).toBeInTheDocument();
        });
    });

    it('renders the page heading', () => {
        ownerService.getComplaints.mockReturnValue(new Promise(() => {}));
        render(<OwnerComplaints />);
        expect(screen.getByText('Complaint Management')).toBeInTheDocument();
    });

    it('renders complaints list with title and status', async () => {
        ownerService.getComplaints.mockResolvedValue({ success: true, data: [mockComplaint] });
        render(<OwnerComplaints />);
        await waitFor(() => {
            expect(screen.getByText('Water Leakage')).toBeInTheDocument();
            expect(screen.getByText('There is a water leak in the bathroom.')).toBeInTheDocument();
        });
    });

    it('renders complaint priority and category badges', async () => {
        ownerService.getComplaints.mockResolvedValue({ success: true, data: [mockComplaint] });
        render(<OwnerComplaints />);
        await waitFor(() => {
            expect(screen.getByText('High')).toBeInTheDocument();
            expect(screen.getByText('#Plumbing')).toBeInTheDocument();
        });
    });

    it('renders tenant name and room number', async () => {
        ownerService.getComplaints.mockResolvedValue({ success: true, data: [mockComplaint] });
        render(<OwnerComplaints />);
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('101')).toBeInTheDocument();
        });
    });

    it('renders filter buttons for All, Pending, In Progress, Resolved', async () => {
        ownerService.getComplaints.mockResolvedValue({ success: true, data: [] });
        render(<OwnerComplaints />);
        await waitFor(() => {
            expect(screen.getByText('All')).toBeInTheDocument();
            expect(screen.getByText('Pending')).toBeInTheDocument();
            expect(screen.getByText('In Progress')).toBeInTheDocument();
            expect(screen.getByText('Resolved')).toBeInTheDocument();
        });
    });

    it('filters complaints when status filter is clicked', async () => {
        const complaints = [
            mockComplaint,
            { ...mockComplaint, _id: 'c2', title: 'WiFi Issue', status: 'Resolved' },
        ];
        ownerService.getComplaints.mockResolvedValue({ success: true, data: complaints });
        render(<OwnerComplaints />);

        await waitFor(() => {
            expect(screen.getByText('Water Leakage')).toBeInTheDocument();
            expect(screen.getByText('WiFi Issue')).toBeInTheDocument();
        });

        // Filter by "Resolved" — only WiFi Issue should show
        fireEvent.click(screen.getByRole('button', { name: 'Resolved' }));
        expect(screen.queryByText('Water Leakage')).not.toBeInTheDocument();
        expect(screen.getByText('WiFi Issue')).toBeInTheDocument();
    });

    it('owner can update complaint status via dropdown', async () => {
        ownerService.getComplaints.mockResolvedValue({ success: true, data: [mockComplaint] });
        ownerService.updateComplaintStatus.mockResolvedValue({
            success: true,
            data: { ...mockComplaint, status: 'In Progress' },
        });

        render(<OwnerComplaints />);

        await waitFor(() => {
            expect(screen.getByText('Water Leakage')).toBeInTheDocument();
        });

        const select = screen.getByDisplayValue('Pending');
        fireEvent.change(select, { target: { value: 'In Progress' } });

        await waitFor(() => {
            expect(ownerService.updateComplaintStatus).toHaveBeenCalledWith('c1', {
                status: 'In Progress',
                adminComment: undefined,
            });
        });
    });

    it('handles API error gracefully and still stops loading', async () => {
        ownerService.getComplaints.mockRejectedValue(new Error('Network Error'));
        render(<OwnerComplaints />);
        await waitFor(() => {
            // After error, loading stops and empty state shows
            expect(screen.getByText('No complaints found in this category.')).toBeInTheDocument();
        });
    });

    it('shows "Unknown" tenant name when tenant info is missing', async () => {
        const complaintNoTenant = {
            ...mockComplaint,
            _id: 'c3',
            tenant_id: null,
        };
        ownerService.getComplaints.mockResolvedValue({
            success: true,
            data: [complaintNoTenant],
        });
        render(<OwnerComplaints />);
        await waitFor(() => {
            expect(screen.getByText('Unknown')).toBeInTheDocument();
            expect(screen.getByText('N/A')).toBeInTheDocument();
        });
    });
});
