import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AdminDashboard from './PlatformDashboard';
import adminService from '../../services/admin.service';

// Mock dependencies
vi.mock('../../services/admin.service', () => ({
    default: {
        getStats: vi.fn(),
    }
}));

// Mock StatsCard
vi.mock('../../components/common/StatsCard', () => ({
    default: ({ title, value }) => <div data-testid="stats-card">{title}: {value}</div>
}));

// Mock Loader
vi.mock('../../components/common/Loader', () => ({
    default: () => <div data-testid="loader">Loading...</div>
}));

describe('Admin Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockStats = {
        totalPGs: 5,
        totalUsers: 50,
        totalOwners: 10,
        totalTenants: 40
    };

    it('shows loader initially', () => {
        // Return a promise that never resolves yet to keep loading state
        adminService.getStats.mockReturnValue(new Promise(() => { }));
        render(<AdminDashboard />);
        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('fetches and displays stats successfully', async () => {
        adminService.getStats.mockResolvedValue({ success: true, data: mockStats });

        render(<AdminDashboard />);

        await waitFor(() => {
            expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
            expect(screen.getByText('Platform Overview')).toBeInTheDocument();
        });

        expect(screen.getByText('Total PGs: 5')).toBeInTheDocument();
        expect(screen.getByText('Total Users: 50')).toBeInTheDocument();
        expect(screen.getByText('Active Owners: 10')).toBeInTheDocument();
        expect(screen.getByText('Total Tenants: 40')).toBeInTheDocument();
    });

    it('displays error message on fetch failure', async () => {
        adminService.getStats.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<AdminDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load dashboard statistics.')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });
});
