import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OwnerNotices from './Notices';
import ownerService from '../../services/owner.service';

// Mock ownerService
vi.mock('../../services/owner.service', () => ({
    default: {
        getNotices: vi.fn(),
        createNotice: vi.fn(),
        deleteNotice: vi.fn(),
    },
}));

// Mock Skeleton
vi.mock('../../components/common/Skeleton', () => ({
    default: ({ className }) => <div data-testid="skeleton" className={className} />,
}));

const mockNotice = {
    _id: 'n1',
    title: 'Water Tank Cleaning',
    message: 'The water tank will be cleaned on Sunday.',
    type: 'Info',
    createdAt: '2024-02-10T08:00:00Z',
};

describe('Owner Notices Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm = vi.fn(() => true);
        window.alert = vi.fn();
    });

    it('shows loading state (Skeleton) initially', () => {
        ownerService.getNotices.mockReturnValue(new Promise(() => {}));
        render(<OwnerNotices />);
        expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('renders the "Post New Notice" heading always', () => {
        ownerService.getNotices.mockReturnValue(new Promise(() => {}));
        render(<OwnerNotices />);
        expect(screen.getByText('Post New Notice')).toBeInTheDocument();
    });

    it('renders empty state when no notices are returned', async () => {
        ownerService.getNotices.mockResolvedValue({ success: true, data: [] });
        render(<OwnerNotices />);
        await waitFor(() => {
            expect(screen.getByText('No notices posted yet.')).toBeInTheDocument();
        });
    });

    it('renders the "Previous Notices" heading', async () => {
        ownerService.getNotices.mockResolvedValue({ success: true, data: [] });
        render(<OwnerNotices />);
        await waitFor(() => {
            expect(screen.getByText('Previous Notices')).toBeInTheDocument();
        });
    });

    it('renders notice list with title and message', async () => {
        ownerService.getNotices.mockResolvedValue({ success: true, data: [mockNotice] });
        render(<OwnerNotices />);
        await waitFor(() => {
            expect(screen.getByText('Water Tank Cleaning')).toBeInTheDocument();
            expect(screen.getByText('The water tank will be cleaned on Sunday.')).toBeInTheDocument();
        });
    });

    it('renders the form with Title, Type, and Message fields', async () => {
        ownerService.getNotices.mockResolvedValue({ success: true, data: [] });
        render(<OwnerNotices />);
        await waitFor(() => {
            expect(screen.getByLabelText('Title')).toBeInTheDocument();
            expect(screen.getByLabelText('Type')).toBeInTheDocument();
            expect(screen.getByLabelText('Message')).toBeInTheDocument();
        });
    });

    it('renders the "Post Notice" submit button', async () => {
        ownerService.getNotices.mockResolvedValue({ success: true, data: [] });
        render(<OwnerNotices />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Post Notice/i })).toBeInTheDocument();
        });
    });

    it('creates a notice on form submit and adds it to the list', async () => {
        const newNotice = {
            _id: 'n2',
            title: 'Holiday Announcement',
            message: 'Office closed on Monday.',
            type: 'Info',
            createdAt: new Date().toISOString(),
        };

        ownerService.getNotices.mockResolvedValue({ success: true, data: [] });
        ownerService.createNotice.mockResolvedValue({ success: true, data: newNotice });

        render(<OwnerNotices />);

        await waitFor(() => {
            expect(screen.getByLabelText('Title')).toBeInTheDocument();
        });

        // Fill in the form
        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Holiday Announcement' },
        });
        fireEvent.change(screen.getByPlaceholderText('Details about the announcement...'), {
            target: { value: 'Office closed on Monday.' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Post Notice/i }));

        await waitFor(() => {
            expect(ownerService.createNotice).toHaveBeenCalledWith({
                title: 'Holiday Announcement',
                message: 'Office closed on Monday.',
                type: 'Info',
            });
            expect(screen.getByText('Holiday Announcement')).toBeInTheDocument();
        });
    });

    it('clears the form after successful notice creation', async () => {
        const newNotice = {
            _id: 'n3',
            title: 'Test Notice',
            message: 'Test message.',
            type: 'Urgent',
            createdAt: new Date().toISOString(),
        };

        ownerService.getNotices.mockResolvedValue({ success: true, data: [] });
        ownerService.createNotice.mockResolvedValue({ success: true, data: newNotice });

        render(<OwnerNotices />);

        await waitFor(() => expect(screen.getByLabelText('Title')).toBeInTheDocument());

        const titleInput = screen.getByLabelText('Title');
        const messageInput = screen.getByPlaceholderText('Details about the announcement...');

        fireEvent.change(titleInput, { target: { value: 'Test Notice' } });
        fireEvent.change(messageInput, { target: { value: 'Test message.' } });
        fireEvent.click(screen.getByRole('button', { name: /Post Notice/i }));

        await waitFor(() => {
            expect(titleInput.value).toBe('');
            expect(messageInput.value).toBe('');
        });
    });

    it('deletes a notice when delete button is clicked and confirmed', async () => {
        ownerService.getNotices.mockResolvedValue({ success: true, data: [mockNotice] });
        ownerService.deleteNotice.mockResolvedValue({ success: true });
        window.confirm = vi.fn(() => true);

        render(<OwnerNotices />);

        await waitFor(() => {
            expect(screen.getByText('Water Tank Cleaning')).toBeInTheDocument();
        });

        // The delete button is the trash icon button for the notice
        // It has onClick={() => handleDelete(notice._id)}
        const deleteButtons = screen.getAllByRole('button');
        // Find the one in the notices list (not the submit button)
        const trashButton = deleteButtons.find(
            (btn) => !btn.textContent.includes('Post') && !btn.textContent.includes('Posting')
        );
        expect(trashButton).toBeDefined();
        fireEvent.click(trashButton);

        await waitFor(() => {
            expect(ownerService.deleteNotice).toHaveBeenCalledWith('n1');
            expect(screen.queryByText('Water Tank Cleaning')).not.toBeInTheDocument();
        });
    });

    it('handles API error gracefully on fetch', async () => {
        ownerService.getNotices.mockRejectedValue(new Error('Network Error'));
        render(<OwnerNotices />);
        await waitFor(() => {
            // After error, loading ends and empty state shows
            expect(screen.getByText('No notices posted yet.')).toBeInTheDocument();
        });
    });

    it('shows "Posting..." button text while submitting', async () => {
        ownerService.getNotices.mockResolvedValue({ success: true, data: [] });
        // Never resolves to keep it in loading state
        ownerService.createNotice.mockReturnValue(new Promise(() => {}));

        render(<OwnerNotices />);
        await waitFor(() => expect(screen.getByLabelText('Title')).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText('Details about the announcement...'), {
            target: { value: 'Content' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Post Notice/i }));

        await waitFor(() => {
            expect(screen.getByText('Posting...')).toBeInTheDocument();
        });
    });
});
