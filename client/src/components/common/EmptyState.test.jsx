import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from './EmptyState';
import { Settings } from 'lucide-react';

// Mock Lucide icons to avoid rendering issues if any
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        FolderOpen: (props) => <div data-testid="folder-icon" {...props} />,
        Search: (props) => <div data-testid="search-icon" {...props} />,
        Settings: (props) => <div data-testid="settings-icon" {...props} />,
    };
});

describe('EmptyState Component', () => {
    it('renders default title and description', () => {
        render(<EmptyState />);
        expect(screen.getByText('No data found')).toBeInTheDocument();
        expect(screen.getByText(/Try adjusting your search/)).toBeInTheDocument();
        expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    });

    it('renders custom title, description and icon', () => {
        render(
            <EmptyState
                title="Custom Title"
                description="Custom Description"
                icon={Settings}
            />
        );
        expect(screen.getByText('Custom Title')).toBeInTheDocument();
        expect(screen.getByText('Custom Description')).toBeInTheDocument();
        expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('does not render button when actionLabel is missing', () => {
        render(<EmptyState />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders action button and calls onAction', () => {
        const handleAction = vi.fn();
        render(
            <EmptyState
                actionLabel="Create New"
                onAction={handleAction}
            />
        );

        const button = screen.getByRole('button', { name: 'Create New' });
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(handleAction).toHaveBeenCalledTimes(1);
    });
});
