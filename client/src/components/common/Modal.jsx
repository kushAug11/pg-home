import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Accessible Modal Wrapper
 * Provides: aria-modal, role="dialog", focus trap, ESC key close, backdrop click close.
 * 
 * UI-024 FIX: All modals should wrap their content in this component for a11y compliance.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Called when modal should close (ESC, backdrop click)
 * @param {string} [props.title] - Accessible title for aria-label
 * @param {string} [props.className] - Additional classes for the backdrop
 * @param {string} [props.panelClassName] - Additional classes for the inner panel
 * @param {React.ReactNode} props.children - Modal content
 */
const Modal = ({ isOpen, onClose, title = 'Dialog', className = '', panelClassName = '', children }) => {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    // Store the previously focused element and focus the modal on open
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;
            // Small delay to ensure the modal is rendered before focusing
            const timer = setTimeout(() => {
                if (modalRef.current) {
                    const firstFocusable = modalRef.current.querySelector(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (firstFocusable) {
                        firstFocusable.focus();
                    } else {
                        modalRef.current.focus();
                    }
                }
            }, 50);
            return () => clearTimeout(timer);
        } else {
            // Restore focus when modal closes
            if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
                previousActiveElement.current.focus();
            }
        }
    }, [isOpen]);

    // ESC key handler
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus trap: keep Tab cycling within the modal
    const handleKeyDown = useCallback((e) => {
        if (e.key !== 'Tab' || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab: if on first element, wrap to last
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab: if on last element, wrap to first
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in ${className}`}
            onClick={(e) => {
                // Close on backdrop click (not on panel click)
                if (e.target === e.currentTarget) onClose();
            }}
            role="presentation"
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                className={`bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh] border border-slate-100 outline-none ${panelClassName}`}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;
