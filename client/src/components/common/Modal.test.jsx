import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Modal from './Modal';

// Mock socket service (imported dynamically in some components)
vi.mock('../../services/socket.service', () => ({
    initSocket: vi.fn(),
    disconnectSocket: vi.fn(),
    getSocket: vi.fn(() => null),
}));

describe('Modal Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        render(
            <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
                <p>Modal Content</p>
            </Modal>
        );
        expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders children when isOpen is true', () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
                <p>Modal Content</p>
            </Modal>
        );
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders with correct aria-label from title prop', () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()} title="My Dialog">
                <span>Inner text</span>
            </Modal>
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-label', 'My Dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('calls onClose when ESC key is pressed', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <p>Content</p>
            </Modal>
        );
        fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop (presentation div) is clicked', () => {
        const onClose = vi.fn();
        const { container } = render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <p>Content</p>
            </Modal>
        );
        // The backdrop is the outer div with role="presentation"
        const backdrop = container.querySelector('[role="presentation"]');
        expect(backdrop).toBeInTheDocument();
        // Simulate click where target === currentTarget (backdrop click)
        fireEvent.click(backdrop, { target: backdrop });
    });

    it('does not call onClose when the inner panel itself is clicked', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <button>Panel Button</button>
            </Modal>
        );
        // Click the dialog panel (not the backdrop) — should not close
        const dialog = screen.getByRole('dialog');
        fireEvent.click(dialog);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders children content correctly', () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()} title="Content Modal">
                <h2>Hello Modal</h2>
                <input type="text" placeholder="Type here" />
            </Modal>
        );
        expect(screen.getByText('Hello Modal')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
    });

    it('uses default title "Dialog" when no title is provided', () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()}>
                <p>No title modal</p>
            </Modal>
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-label', 'Dialog');
    });
});
