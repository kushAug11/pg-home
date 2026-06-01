import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchInput from './SearchInput';

describe('SearchInput Component', () => {
    it('renders a search input with default placeholder', () => {
        render(<SearchInput value="" onChange={vi.fn()} />);
        const input = screen.getByPlaceholderText('Search...');
        expect(input).toBeInTheDocument();
    });

    it('renders with a custom placeholder', () => {
        render(<SearchInput value="" onChange={vi.fn()} placeholder="Find tenants..." />);
        expect(screen.getByPlaceholderText('Find tenants...')).toBeInTheDocument();
    });

    it('has correct type="text"', () => {
        render(<SearchInput value="" onChange={vi.fn()} />);
        const input = screen.getByPlaceholderText('Search...');
        expect(input).toHaveAttribute('type', 'text');
    });

    it('calls onChange when user types', () => {
        const onChange = vi.fn();
        render(<SearchInput value="" onChange={onChange} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'hello' } });
        expect(onChange).toHaveBeenCalledWith('hello');
    });

    it('displays the current value', () => {
        render(<SearchInput value="current value" onChange={vi.fn()} />);
        const input = screen.getByDisplayValue('current value');
        expect(input).toBeInTheDocument();
    });

    it('calls onChange with updated text on every keystroke', () => {
        const onChange = vi.fn();
        render(<SearchInput value="te" onChange={onChange} />);
        const input = screen.getByDisplayValue('te');
        fireEvent.change(input, { target: { value: 'tes' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('tes');
    });
});
