import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import OwnerTenants from './Tenants';
import ownerService from '../../services/owner.service';

// Mock dependencies
vi.mock('../../services/owner.service');
vi.mock('../../components/common/Skeleton', () => ({
    default: () => <div data-testid="skeleton">Loading...</div>
}));

describe('OwnerTenants Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockTenants = [
        {
            _id: 't1',
            user_id: { name: 'Tenant 1', email: 't1@test.com' },
            contact_number: '1234567890',
            room_id: { number: '101' },
            rentAmount: 5000
        }
    ];

    const mockRooms = [
        { _id: 'r1', number: '101', type: 'Single', capacity: 1 }
    ];

    const file = new File(['dummy'], 'id-proof.pdf', { type: 'application/pdf' });

    it('renders tenants list correctly', async () => {
        ownerService.getTenants.mockResolvedValue({ success: true, data: mockTenants });
        ownerService.getRooms.mockResolvedValue({ success: true, data: mockRooms });

        render(
            <BrowserRouter>
                <OwnerTenants />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Tenant 1')).toBeInTheDocument();
            expect(screen.getByText('1234567890')).toBeInTheDocument();
            expect(screen.getByText('Rent/mo')).toBeInTheDocument();
        });
    });

    it('opens add tenant form and accepts input including mobile', async () => {
        ownerService.getTenants.mockResolvedValue({ success: true, data: [] });
        ownerService.getRooms.mockResolvedValue({ success: true, data: mockRooms });

        render(
            <BrowserRouter>
                <OwnerTenants />
            </BrowserRouter>
        );

        // Wait for loading to finish
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        // Click Add Tenant
        await act(async () => {
            fireEvent.click(screen.getByText('Add Tenant'));
        });

        // Check for inputs
        const nameInput = screen.getByPlaceholderText('Full Name *');
        const emailInput = screen.getByPlaceholderText('Email Address *');
        const mobileInput = screen.getByPlaceholderText('Mobile Number (10 digits) *');
        const passwordInput = screen.getByPlaceholderText('Password *');
        const rentInput = screen.getByPlaceholderText('Rent Amount *');

        expect(nameInput).toBeInTheDocument();
        expect(mobileInput).toBeInTheDocument();

        // Simulate Input
        fireEvent.change(nameInput, { target: { value: 'New Tenant' } });
        fireEvent.change(emailInput, { target: { value: 'new@test.com' } });
        fireEvent.change(mobileInput, { target: { value: '9876543210' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(rentInput, { target: { value: '6000' } });
        fireEvent.change(screen.getByPlaceholderText(/ID Number/), { target: { value: '123456789012' } });

        // Check values
        expect(mobileInput.value).toBe('9876543210');
    });

    it('submits form with correct data', async () => {
        ownerService.getTenants.mockResolvedValue({ success: true, data: [] });
        ownerService.getRooms.mockResolvedValue({ success: true, data: mockRooms });
        ownerService.addTenant.mockResolvedValue({ success: true, data: { ...mockTenants[0], user_id: { name: 'New Tenant' } } });

        render(
            <BrowserRouter>
                <OwnerTenants />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());
        await act(async () => {
            fireEvent.click(screen.getByText('Add Tenant'));
        });

        // Fill form
        fireEvent.change(screen.getByPlaceholderText('Full Name *'), { target: { value: 'New Tenant' } });
        fireEvent.change(screen.getByPlaceholderText('Email Address *'), { target: { value: 'new@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Mobile Number (10 digits) *'), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByPlaceholderText('Password *'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Rent Amount *'), { target: { value: '6000' } });
        fireEvent.change(screen.getByPlaceholderText(/ID Number/), { target: { value: '123456789012' } });
        fireEvent.change(screen.getByPlaceholderText(/Permanent Home Address/), { target: { value: '123 Test Street' } });

        // Select Room
        const roomSelect = document.querySelector('select[name="room_id"]');
        fireEvent.change(roomSelect, { target: { value: 'r1' } });

        const frontInput = document.querySelector('input[name="idProofFront"]');
        const backInput = document.querySelector('input[name="idProofBack"]');
        fireEvent.change(frontInput, { target: { files: [file] } });
        fireEvent.change(backInput, { target: { files: [file] } });

        // Submit
        fireEvent.submit(document.querySelector('form'));

        await waitFor(() => {
            expect(ownerService.addTenant).toHaveBeenCalledWith(expect.any(FormData));
            const formData = ownerService.addTenant.mock.calls[0][0];
            expect(formData.get('name')).toBe('New Tenant');
            expect(formData.get('email')).toBe('new@test.com');
            expect(formData.get('mobile')).toBe('9876543210');
            expect(formData.get('room_id')).toBe('r1');
            expect(formData.get('rentAmount')).toBe('6000');
        });
    });
});
