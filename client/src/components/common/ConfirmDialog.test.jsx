import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        AlertTriangle: (props) => <div data-testid="alert-icon" {...props} />,
        X: (props) => <div data-testid="close-icon" {...props} />,
    };
});

describe('ConfirmDialog Component', () => {
    it('renders nothing when isOpen is false', () => {
        render(<ConfirmDialog isOpen={false} />);
        expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });

    it('renders correctly when isOpen is true', () => {
        render(<ConfirmDialog isOpen={true} />);
        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to proceed/)).toBeInTheDocument();
    });

    it('renders custom title and message', () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Delete User"
                message="This user will be permanently deleted."
            />
        );
        expect(screen.getByText('Delete User')).toBeInTheDocument();
        expect(screen.getByText('This user will be permanently deleted.')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
        const handleClose = vi.fn();
        render(<ConfirmDialog isOpen={true} onClose={handleClose} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Close icon is clicked', () => {
        const handleClose = vi.fn();
        render(<ConfirmDialog isOpen={true} onClose={handleClose} />);
        fireEvent.click(screen.getByTestId('close-icon').closest('button'));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when Confirm is clicked', () => {
        const handleConfirm = vi.fn();
        render(<ConfirmDialog isOpen={true} onConfirm={handleConfirm} />);
        fireEvent.click(screen.getByText('Confirm'));
        expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('shows loading state on Confirm button', () => {
        render(<ConfirmDialog isOpen={true} isLoading={true} />);
        const confirmButton = screen.getByText('Confirm').closest('button');
        expect(confirmButton).toBeDisabled();
        // Button component renders Loader2 when isLoading is true. 
        // We can assume Button works (tested separately) but we can check disabled state.
    });
});
