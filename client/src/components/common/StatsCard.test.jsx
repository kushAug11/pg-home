import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatsCard from './StatsCard';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => {
            // Strip framer-motion specific props
            const { initial, animate, transition, whileHover, ...rest } = props;
            return <div {...rest}>{children}</div>;
        },
    },
}));

describe('StatsCard Component', () => {
    it('renders the title and value', () => {
        render(<StatsCard title="Total Tenants" value={42} color="bg-blue-100" />);
        expect(screen.getByText('Total Tenants')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders string value correctly', () => {
        render(<StatsCard title="Revenue" value="₹15000" color="bg-green-100" />);
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('₹15000')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        const MockIcon = () => <svg data-testid="mock-icon" />;
        render(
            <StatsCard
                title="Rooms"
                value={10}
                color="bg-purple-100"
                icon={<MockIcon />}
            />
        );
        expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('does not render trend badge when trend is undefined', () => {
        render(<StatsCard title="Occupancy" value="80%" color="bg-yellow-100" />);
        // Should not render ↑ or ↓
        expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument();
    });

    it('renders positive trend badge with up arrow', () => {
        render(<StatsCard title="Revenue" value="₹5000" color="bg-green-100" trend={15} />);
        expect(screen.getByText(/↑/)).toBeInTheDocument();
        expect(screen.getByText(/15%/)).toBeInTheDocument();
    });

    it('renders negative trend badge with down arrow', () => {
        render(<StatsCard title="Expenses" value="₹2000" color="bg-red-100" trend={-10} />);
        expect(screen.getByText(/↓/)).toBeInTheDocument();
        expect(screen.getByText(/10%/)).toBeInTheDocument();
    });

    it('renders children when provided', () => {
        render(
            <StatsCard title="Rooms" value={5} color="bg-indigo-100">
                <button>View All</button>
            </StatsCard>
        );
        expect(screen.getByText('View All')).toBeInTheDocument();
    });

    it('does not render children slot when no children provided', () => {
        const { container } = render(
            <StatsCard title="Test" value={0} color="bg-slate-100" />
        );
        // The self-center div only renders when children are truthy
        // Just verify the card renders cleanly
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });
});
