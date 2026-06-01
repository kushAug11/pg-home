import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OwnerExpenses from './Expenses';
import ownerService from '../../services/owner.service';

// Mock ownerService
vi.mock('../../services/owner.service', () => ({
    default: {
        getExpenses: vi.fn(),
        addExpense: vi.fn(),
        deleteExpense: vi.fn(),
        getAnalytics: vi.fn(),
        getFinancialReport: vi.fn(),
    },
}));

// Mock Skeleton
vi.mock('../../components/common/Skeleton', () => ({
    default: ({ className }) => <div data-testid="skeleton" className={className} />,
}));

const mockAnalytics = {
    totalRevenue: 50000,
    totalExpenses: 15000,
    profit: 35000,
    expenseBreakdown: [
        { _id: 'Electricity', total: 5000 },
        { _id: 'Water', total: 2000 },
    ],
};

const mockExpense = {
    _id: 'e1',
    category: 'Electricity',
    amount: 5000,
    description: 'June Monthly Bill',
    date: '2024-06-01T00:00:00Z',
};

describe('Owner Expenses Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm = vi.fn(() => true);
        window.alert = vi.fn();
    });

    it('shows loading state (Skeleton) initially', () => {
        ownerService.getExpenses.mockReturnValue(new Promise(() => {}));
        ownerService.getAnalytics.mockReturnValue(new Promise(() => {}));
        render(<OwnerExpenses />);
        expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('renders the "Financial Overview" page heading', async () => {
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: mockAnalytics });
        render(<OwnerExpenses />);
        expect(screen.getByText('Financial Overview')).toBeInTheDocument();
    });

    it('renders Analytics tab by default with revenue data', async () => {
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: mockAnalytics });
        render(<OwnerExpenses />);

        await waitFor(() => {
            expect(screen.getByText('Total Revenue')).toBeInTheDocument();
            expect(screen.getByText('₹50000')).toBeInTheDocument();
            expect(screen.getByText('Total Expenses')).toBeInTheDocument();
            expect(screen.getByText('₹15000')).toBeInTheDocument();
            expect(screen.getByText('Net Profit')).toBeInTheDocument();
            expect(screen.getByText('₹35000')).toBeInTheDocument();
        });
    });

    it('renders expense breakdown categories in Analytics tab', async () => {
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: mockAnalytics });
        render(<OwnerExpenses />);

        await waitFor(() => {
            expect(screen.getByText('Electricity')).toBeInTheDocument();
            expect(screen.getByText('Water')).toBeInTheDocument();
        });
    });

    it('switches to Expenses tab when "Expenses" button is clicked', async () => {
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: mockAnalytics });
        render(<OwnerExpenses />);

        await waitFor(() => {
            expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Expenses' }));

        await waitFor(() => {
            expect(screen.getByText('Add New Expense')).toBeInTheDocument();
            expect(screen.getByText('Expense History')).toBeInTheDocument();
        });
    });

    it('renders empty expense history when no expenses', async () => {
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: mockAnalytics });
        render(<OwnerExpenses />);

        await waitFor(() => expect(screen.getByText('Total Revenue')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Expenses' }));

        await waitFor(() => {
            expect(screen.getByText('No records found.')).toBeInTheDocument();
        });
    });

    it('renders expense list with amount and category', async () => {
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [mockExpense] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: mockAnalytics });
        render(<OwnerExpenses />);

        await waitFor(() => expect(screen.getByText('Total Revenue')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Expenses' }));

        await waitFor(() => {
            expect(screen.getAllByText('Electricity').length).toBeGreaterThan(0);
            expect(screen.getByText('₹5000')).toBeInTheDocument();
            expect(screen.getByText('June Monthly Bill')).toBeInTheDocument();
        });
    });

    it('can add a new expense via the form', async () => {
        const newExpense = {
            _id: 'e2',
            category: 'Water',
            amount: 2000,
            description: 'Water bill',
            date: new Date().toISOString(),
        };
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: mockAnalytics });
        ownerService.addExpense.mockResolvedValue({ success: true, data: newExpense });

        render(<OwnerExpenses />);

        await waitFor(() => expect(screen.getByText('Total Revenue')).toBeInTheDocument());

        // Switch to Expenses tab
        fireEvent.click(screen.getByRole('button', { name: 'Expenses' }));

        await waitFor(() => {
            expect(screen.getByText('Add New Expense')).toBeInTheDocument();
        });

        // Fill the form
        const amountInput = screen.getByRole('spinbutton'); // type="number"
        const descInput = screen.getByPlaceholderText('e.g. June Monthly Bill');

        fireEvent.change(amountInput, { target: { value: '2000' } });
        fireEvent.change(descInput, { target: { value: 'Water bill' } });

        // Click "Log Expense" button
        fireEvent.click(screen.getByRole('button', { name: /Log Expense/i }));

        await waitFor(() => {
            expect(ownerService.addExpense).toHaveBeenCalledWith({
                amount: '2000',
                category: 'Maintenance', // default category value
                description: 'Water bill',
            });
            expect(screen.getByText('Water bill')).toBeInTheDocument();
        });
    });

    it('handles API error gracefully when loading fails', async () => {
        ownerService.getExpenses.mockRejectedValue(new Error('Network Error'));
        ownerService.getAnalytics.mockRejectedValue(new Error('Network Error'));
        render(<OwnerExpenses />);

        await waitFor(() => {
            // After errors, loading should stop — no skeleton shown
            expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
        });
    });

    it('renders Analytics tab and Expenses tab toggle buttons', async () => {
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: mockAnalytics });
        render(<OwnerExpenses />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Analytics' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Expenses' })).toBeInTheDocument();
        });
    });

    it('renders "Export Report" button', async () => {
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: mockAnalytics });
        render(<OwnerExpenses />);
        expect(screen.getByText(/Export Report/i)).toBeInTheDocument();
    });

    it('shows "No expenses recorded yet." in breakdown when breakdown is empty', async () => {
        const analyticsEmpty = {
            ...mockAnalytics,
            expenseBreakdown: [],
        };
        ownerService.getExpenses.mockResolvedValue({ success: true, data: [] });
        ownerService.getAnalytics.mockResolvedValue({ success: true, data: analyticsEmpty });
        render(<OwnerExpenses />);

        await waitFor(() => {
            expect(screen.getByText('No expenses recorded yet.')).toBeInTheDocument();
        });
    });
});
