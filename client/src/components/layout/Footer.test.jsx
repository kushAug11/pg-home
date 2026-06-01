import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';

describe('Footer Component', () => {
    it('renders footer content', () => {
        render(<Footer />);
        expect(screen.getByText('StayManager')).toBeInTheDocument();
        expect(screen.getByText('Product')).toBeInTheDocument();
        expect(screen.getByText('Company')).toBeInTheDocument();
        expect(screen.getByText('Contact Us')).toBeInTheDocument();
        expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    });
});
