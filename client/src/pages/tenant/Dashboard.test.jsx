import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Dashboard from './Dashboard';
import tenantService from '../../services/tenant.service';
import securityService from '../../services/security.service';
import { AuthContext } from '../../context/AuthContext';

// Mock dependencies
vi.mock('../../services/tenant.service', () => ({
    default: {
        getDashboard: vi.fn(),
        getNotices: vi.fn()
    }
}));
vi.mock('../../services/security.service', () => ({
    default: {
        getMyRequests: vi.fn(),
        createGuestRequest: vi.fn()
    }
}));
vi.mock('../../components/common/StatsCard', () => ({
    default: ({ title, value }) => <div data-testid="stats-card">{title}: {value}</div>
}));

describe('Tenant Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockDashboardData = {
        tenant: { rentAmount: 5000, rentStatus: 'Paid' },
        room: { number: '202', type: 'Double' },
        pg: { name: 'Happy Stay PG', address: '123 Street' },
        recentPayments: [],
        recentComplaints: []
    };

    const mockUser = {
        name: 'Test Tenant',
        email: 'tenant@test.com',
        role: 'tenant'
    };

    const renderDashboard = () => {
        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <BrowserRouter>
                    <Dashboard />
                </BrowserRouter>
            </AuthContext.Provider>
        );
    };

    it('renders dashboard with user name', async () => {
        tenantService.getDashboard.mockResolvedValue({ success: true, data: mockDashboardData });
        securityService.getMyRequests.mockResolvedValue({ success: true, data: [] });

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Welcome, Test Tenant/i)).toBeInTheDocument();
        });
    });

    it('displays stats correctly', async () => {
        tenantService.getDashboard.mockResolvedValue({ success: true, data: mockDashboardData });
        securityService.getMyRequests.mockResolvedValue({ success: true, data: [] });

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('My Room: 202')).toBeInTheDocument();
            expect(screen.getByText('Rent Due: ₹5000')).toBeInTheDocument();
        });
    });

    it('handles error fetching stats', async () => {
        tenantService.getDashboard.mockRejectedValue(new Error('Fetch failed'));
        securityService.getMyRequests.mockResolvedValue({ success: true, data: [] });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderDashboard();

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
    });
});
