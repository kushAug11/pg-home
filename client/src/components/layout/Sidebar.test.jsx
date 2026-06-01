import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import * as AuthContext from '../../context/AuthContext'; // Import namespace for mocking

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        LayoutDashboard: () => <div data-testid="icon-dashboard" />,
        Building2: () => <div data-testid="icon-building" />,
        Users: () => <div data-testid="icon-users" />,
        FileText: () => <div data-testid="icon-file" />,
        Bell: () => <div data-testid="icon-bell" />,
        LogOut: () => <div data-testid="icon-logout" />,
        TrendingUp: () => <div data-testid="icon-trending" />,
    };
});

describe('Sidebar Component', () => {
    const mockLogout = vi.fn();

    const renderSidebar = (role) => {
        // Mock useAuth
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: { role },
            logout: mockLogout,
        });

        return render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );
    };

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders admin links', () => {
        renderSidebar('admin');
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('All PGs')).toBeInTheDocument();
        expect(screen.getByText('Audit Logs')).toBeInTheDocument();
        expect(screen.queryByText('My Room')).not.toBeInTheDocument();
    });

    it('renders owner links', () => {
        renderSidebar('owner');
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Rooms')).toBeInTheDocument();
        expect(screen.getByText('Tenants')).toBeInTheDocument();
        expect(screen.getByText('Complaints')).toBeInTheDocument();
        expect(screen.getByText('Notices')).toBeInTheDocument();
        expect(screen.getByText('Finances')).toBeInTheDocument();
        expect(screen.queryByText('All PGs')).not.toBeInTheDocument();
    });

    it('renders tenant links', () => {
        renderSidebar('tenant');
        expect(screen.getByText('My Room')).toBeInTheDocument();
        expect(screen.getByText('Payments')).toBeInTheDocument();
        expect(screen.getByText('My Complaints')).toBeInTheDocument();
        expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });

    it('calls logout when button clicked', () => {
        renderSidebar('admin');
        fireEvent.click(screen.getByText('Logout'));
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });
});
