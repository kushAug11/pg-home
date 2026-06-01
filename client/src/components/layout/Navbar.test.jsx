import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        Building2: () => <div data-testid="logo-icon" />,
        Menu: () => <div data-testid="menu-icon" />,
        X: () => <div data-testid="close-icon" />,
    };
});

describe('Navbar Component', () => {
    const renderNavbar = () => {
        return render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );
    };

    it('renders logo and desktop links', () => {
        renderNavbar();
        expect(screen.getByAltText('StayManager')).toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Features')).toBeInTheDocument();
        expect(screen.getByText('Pricing')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('toggles mobile menu when clicked', () => {
        renderNavbar();

        // Initial state: Mobile menu hidden (implied by typical CSS, but logic-wise check button)
        // Note: JS DOM default window width might obscure "hidden md:flex". 
        // Testing Library doesn't fully emulate CSS media queries visibility without setup.
        // However, we can test the state change logic.

        const menuButton = screen.getByTestId('menu-icon').closest('button');
        fireEvent.click(menuButton);

        // Now X icon should be visible
        expect(screen.getByTestId('close-icon')).toBeInTheDocument();

        // Mobile links should be in the document (assuming conditionals work)
        // Since we simplified the check to "renders", let's check for a mobile-specific container existence or re-query
        // The mobile menu adds links that are duplicates of desktop. 
        // `getAllByText('Home')` would return 2 elements if mobile menu is open.
        const homeLinks = screen.getAllByText('Home');
        expect(homeLinks.length).toBeGreaterThan(1); // 1 desktop + 1 mobile

        fireEvent.click(screen.getByTestId('close-icon').closest('button'));
        expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });
});
