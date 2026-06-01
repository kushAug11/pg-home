import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Input from './Input';

describe('Input Component', () => {
    it('renders correctly with label', () => {
        render(<Input label="Username" name="username" />);
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('renders input element with correct attributes', () => {
        render(<Input name="email" type="email" placeholder="Enter email" />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('type', 'email');
        expect(input).toHaveAttribute('placeholder', 'Enter email');
    });

    it('handles onChange events', () => {
        const handleChange = vi.fn();
        render(<Input name="test" onChange={handleChange} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Hello' } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('displays error message when error prop is present', () => {
        render(<Input name="password" error="Password is required" />);
        expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('applies error styling when error exists', () => {
        render(<Input name="username" error="Invalid username" />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('border-red-500');
        expect(input).toHaveClass('focus:ring-red-500/20');
    });

    it('does not apply error styling when no error', () => {
        render(<Input name="username" />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('input-field');
        expect(input).not.toHaveClass('border-red-500');
    });
});
