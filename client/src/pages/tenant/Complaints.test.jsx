import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TenantComplaints from './Complaints';
import tenantService from '../../services/tenant.service';

// Mock tenantService
// Note: The component uses tenantService.raiseComplaint (not createComplaint)
vi.mock('../../services/tenant.service', () => ({
    default: {
        getComplaints: vi.fn(),
        raiseComplaint: vi.fn(),
    },
}));

const mockComplaint = {
    _id: 'tc1',
    title: 'Broken Tap',
    description: 'The tap in the bathroom is broken.',
    status: 'Pending',
    priority: 'High',
    category: 'Plumbing',
    createdAt: '2024-03-10T09:00:00Z',
};

describe('Tenant Complaints Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the main heading "Complaints & Issues"', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        render(<TenantComplaints />);
        expect(screen.getByText('Complaints & Issues')).toBeInTheDocument();
    });

    it('renders the "Raise a New Complaint" form section', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        render(<TenantComplaints />);
        expect(screen.getByText('Raise a New Complaint')).toBeInTheDocument();
    });

    it('renders empty state when no complaints are returned', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        render(<TenantComplaints />);
        await waitFor(() => {
            expect(screen.getByText('No complaints found.')).toBeInTheDocument();
        });
    });

    it('renders "Your Complaints History" section heading', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        render(<TenantComplaints />);
        expect(screen.getByText('Your Complaints History')).toBeInTheDocument();
    });

    it('renders complaints list with title and priority', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [mockComplaint] });
        render(<TenantComplaints />);
        await waitFor(() => {
            expect(screen.getByText('Broken Tap')).toBeInTheDocument();
            expect(screen.getByText('High Priority')).toBeInTheDocument();
            expect(screen.getByText('The tap in the bathroom is broken.')).toBeInTheDocument();
        });
    });

    it('renders complaint status badge', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [mockComplaint] });
        render(<TenantComplaints />);
        await waitFor(() => {
            expect(screen.getByText('Pending')).toBeInTheDocument();
        });
    });

    it('renders complaint category badge', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [mockComplaint] });
        render(<TenantComplaints />);
        await waitFor(() => {
            expect(screen.getByText('Plumbing')).toBeInTheDocument();
        });
    });

    it('renders the form fields: Title/Subject, Category, Priority, Description', () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        render(<TenantComplaints />);
        expect(screen.getByLabelText('Title / Subject')).toBeInTheDocument();
        expect(screen.getByLabelText('Category')).toBeInTheDocument();
        expect(screen.getByLabelText('Priority')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('renders the "Submit Complaint" button', () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        render(<TenantComplaints />);
        expect(screen.getByRole('button', { name: 'Submit Complaint' })).toBeInTheDocument();
    });

    it('tenant can submit a new complaint successfully', async () => {
        tenantService.getComplaints
            .mockResolvedValueOnce({ success: true, data: [] })
            .mockResolvedValueOnce({ success: true, data: [mockComplaint] });
        tenantService.raiseComplaint.mockResolvedValue({ success: true });

        render(<TenantComplaints />);

        // Fill in the form
        fireEvent.change(screen.getByLabelText('Title / Subject'), {
            target: { value: 'Broken Tap' },
        });
        fireEvent.change(screen.getByLabelText('Description'), {
            target: { value: 'The tap in the bathroom is broken.' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Submit Complaint' }));

        await waitFor(() => {
            expect(tenantService.raiseComplaint).toHaveBeenCalledWith({
                title: 'Broken Tap',
                description: 'The tap in the bathroom is broken.',
                category: 'Other',
                priority: 'Medium',
            });
            expect(screen.getByText('Complaint raised successfully!')).toBeInTheDocument();
        });
    });

    it('shows success message after successful submission', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        tenantService.raiseComplaint.mockResolvedValue({ success: true });

        render(<TenantComplaints />);

        fireEvent.change(screen.getByLabelText('Title / Subject'), {
            target: { value: 'Leaking roof' },
        });
        fireEvent.change(screen.getByLabelText('Description'), {
            target: { value: 'Roof leaks when it rains.' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Submit Complaint' }));

        await waitFor(() => {
            expect(screen.getByText('Complaint raised successfully!')).toBeInTheDocument();
        });
    });

    it('shows failure message when API returns success: false', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        tenantService.raiseComplaint.mockResolvedValue({ success: false });

        render(<TenantComplaints />);

        fireEvent.change(screen.getByLabelText('Title / Subject'), {
            target: { value: 'Test' },
        });
        fireEvent.change(screen.getByLabelText('Description'), {
            target: { value: 'Test description.' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Submit Complaint' }));

        await waitFor(() => {
            expect(screen.getByText('Failed to raise complaint.')).toBeInTheDocument();
        });
    });

    it('shows server error message when API throws an exception', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        tenantService.raiseComplaint.mockRejectedValue(new Error('Server Error'));

        render(<TenantComplaints />);

        fireEvent.change(screen.getByLabelText('Title / Subject'), {
            target: { value: 'Network Test' },
        });
        fireEvent.change(screen.getByLabelText('Description'), {
            target: { value: 'Testing error.' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Submit Complaint' }));

        await waitFor(() => {
            expect(screen.getByText('Server Error. Please try again.')).toBeInTheDocument();
        });
    });

    it('shows "Submitting..." button text while form is being submitted', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        // Never resolves
        tenantService.raiseComplaint.mockReturnValue(new Promise(() => {}));

        render(<TenantComplaints />);

        fireEvent.change(screen.getByLabelText('Title / Subject'), {
            target: { value: 'Test' },
        });
        fireEvent.change(screen.getByLabelText('Description'), {
            target: { value: 'Test desc.' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Submit Complaint' }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
        });
    });

    it('resets form fields after successful submission', async () => {
        tenantService.getComplaints.mockResolvedValue({ success: true, data: [] });
        tenantService.raiseComplaint.mockResolvedValue({ success: true });

        render(<TenantComplaints />);

        const titleInput = screen.getByLabelText('Title / Subject');
        const descInput = screen.getByLabelText('Description');

        fireEvent.change(titleInput, { target: { value: 'Old Title' } });
        fireEvent.change(descInput, { target: { value: 'Old description.' } });

        fireEvent.click(screen.getByRole('button', { name: 'Submit Complaint' }));

        await waitFor(() => {
            expect(titleInput.value).toBe('');
            expect(descInput.value).toBe('');
        });
    });

    it('renders admin response section when adminComment is present', async () => {
        const complaintWithAdmin = {
            ...mockComplaint,
            adminComment: 'We will fix it tomorrow.',
        };
        tenantService.getComplaints.mockResolvedValue({
            success: true,
            data: [complaintWithAdmin],
        });
        render(<TenantComplaints />);

        await waitFor(() => {
            expect(screen.getByText('Admin Response:')).toBeInTheDocument();
            expect(screen.getByText('We will fix it tomorrow.')).toBeInTheDocument();
        });
    });

    it('handles getComplaints API error gracefully', async () => {
        tenantService.getComplaints.mockRejectedValue(new Error('Fetch Failed'));
        render(<TenantComplaints />);
        // Should not crash, just show empty state
        await waitFor(() => {
            expect(screen.getByText('No complaints found.')).toBeInTheDocument();
        });
    });
});
