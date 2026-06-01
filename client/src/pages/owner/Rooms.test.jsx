import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Rooms from './Rooms';
import ownerService from '../../services/owner.service';

// Mock ownerService
vi.mock('../../services/owner.service', () => ({
    default: {
        getRooms: vi.fn(),
        createRoom: vi.fn(),
        deleteRoom: vi.fn(),
        updateRoom: vi.fn(),
        getTenants: vi.fn()
    }
}));

describe('Owner Rooms Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ownerService.getTenants.mockResolvedValue({ success: true, data: [] });
    });

    const mockRooms = [
        { _id: '1', number: '101', type: 'Single', price: 5000, capacity: 1, occupied: 0 },
        { _id: '2', number: '102', type: 'Double', price: 8000, capacity: 2, occupied: 0 }
    ];

    it('renders room list correctly', async () => {
        ownerService.getRooms.mockResolvedValue({ success: true, data: mockRooms });
        ownerService.getTenants.mockResolvedValue({ success: true, data: [] });

        render(<Rooms />);

        await waitFor(() => {
            expect(screen.getByText('Room 101')).toBeInTheDocument();
            expect(screen.getByText('Room 102')).toBeInTheDocument();
            // Component renders "₹5000/month" in the grid card
            expect(screen.getByText('₹5000/month')).toBeInTheDocument();
        });
    });

    it('notifies on fetch error', async () => {
        ownerService.getRooms.mockRejectedValue(new Error('Failed'));
        ownerService.getTenants.mockResolvedValue({ success: true, data: [] });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(<Rooms />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching rooms:', expect.any(Error));
        });
    });

    it('opens add room modal and submits form', async () => {
        ownerService.getRooms.mockResolvedValue({ success: true, data: [] });
        ownerService.createRoom.mockResolvedValue({ success: true, data: mockRooms[0] });
        ownerService.getTenants.mockResolvedValue({ success: true, data: [] });

        render(<Rooms />);

        // Wait for loading to finish then open Modal
        await waitFor(() => expect(screen.queryByText('No rooms added yet.')).toBeInTheDocument());

        // Click "Add Room" button (contains SVG + text "Add Room")
        fireEvent.click(screen.getByText('Add Room'));
        expect(screen.getByText('Add New Room')).toBeInTheDocument();

        // Fill Form
        fireEvent.change(screen.getByLabelText(/Room Number/i), { target: { value: '101' } });
        fireEvent.change(screen.getByLabelText(/Rent/i), { target: { value: '5000' } });
        fireEvent.change(screen.getByLabelText(/Capacity/i), { target: { value: '1' } });

        // Submit
        fireEvent.click(screen.getByText('Create Room'));

        await waitFor(() => {
            expect(ownerService.createRoom).toHaveBeenCalled();
            expect(screen.queryByText('Add New Room')).not.toBeInTheDocument(); // Modal closed
            expect(screen.getByText('Room 101')).toBeInTheDocument(); // Room added to list
        });
    });

    it('handles delete room', async () => {
        ownerService.getRooms.mockResolvedValue({ success: true, data: mockRooms });
        ownerService.deleteRoom.mockResolvedValue({ success: true });
        ownerService.getTenants.mockResolvedValue({ success: true, data: [] });

        render(<Rooms />);

        await waitFor(() => screen.getByText('Room 101'));

        // Click delete on first room using aria label or by finding the trash icon button
        // The delete button is a <button> containing Trash2 icon with class text-rose-500
        const deleteBtns = document.querySelectorAll('button.p-2.text-rose-500');
        if (deleteBtns.length > 0) {
            fireEvent.click(deleteBtns[0]);
        }

        // Wait for custom ConfirmDialog and click "Delete Room"
        await waitFor(() => screen.getByRole('button', { name: 'Delete Room' }));
        fireEvent.click(screen.getByRole('button', { name: 'Delete Room' }));

        await waitFor(() => {
            expect(ownerService.deleteRoom).toHaveBeenCalledWith('1');
            expect(screen.queryByText('Room 101')).not.toBeInTheDocument();
        });
    });
});
