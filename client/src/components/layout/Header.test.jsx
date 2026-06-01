import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';
import * as AuthContext from '../../context/AuthContext';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        User: () => <div data-testid="user-icon" />,
    };
});

describe('Header Component', () => {
    it('renders user name and role', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: { name: 'John Doe', role: 'admin' },
        });

        render(<Header />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('renders gracefully without user', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: null,
        });

        render(<Header />);
        // Should not crash, fields might be empty or fallback
        // implementation: <p>{user?.name}</p>. If user is null, renders nothing.
        // If user is null, {user?.name} evaluates to undefined, React renders nothing.
        // We expect the container to exist but text to be absent.
        expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
});
