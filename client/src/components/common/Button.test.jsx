import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('calls onClick handler when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders primary variant by default', () => {
        render(<Button>Primary</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('btn-primary');
        expect(button).toHaveClass('focus:ring-primary-500');
    });

    it('renders different variants correctly', () => {
        const { rerender } = render(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-outline');

        rerender(<Button variant="danger">Danger</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-red-500');

        rerender(<Button variant="ghost">Ghost</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    });

    it('renders different sizes correctly', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByRole('button')).toHaveClass('px-3');

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole('button')).toHaveClass('px-6');
    });

    it('shows loader and disables button when isLoading is true', () => {
        render(<Button isLoading>Loading</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button.querySelector('.animate-spin')).toBeTruthy();
    });

    it('disables button when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('passes through additional props', () => {
        render(<Button type="submit" aria-label="Submit Form">Submit</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).toHaveAttribute('aria-label', 'Submit Form');
    });
});
