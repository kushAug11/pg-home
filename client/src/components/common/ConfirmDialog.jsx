import React, { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    onCancel,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed? This action cannot be undone.',
    confirmLabel = 'Confirm',
    confirmText,
    cancelLabel = 'Cancel',
    variant = 'danger', // danger, warning, info
    isLoading = false
}) => {
    const dialogRef = useRef(null);
    const previousActiveElement = useRef(null);

    // Determine the actual close handler (support both onClose and onCancel props)
    const handleClose = onClose || onCancel;

    // Determine if dialog should render (support both isOpen prop and always-open pattern)
    const shouldRender = isOpen !== undefined ? isOpen : true;

    // Focus trap + ESC key
    useEffect(() => {
        if (!shouldRender) return;

        previousActiveElement.current = document.activeElement;

        const timer = setTimeout(() => {
            if (dialogRef.current) {
                const firstBtn = dialogRef.current.querySelector('button');
                if (firstBtn) firstBtn.focus();
            }
        }, 50);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                handleClose?.();
            }

            if (e.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            if (previousActiveElement.current?.focus) {
                previousActiveElement.current.focus();
            }
        };
    }, [shouldRender, handleClose]);

    if (!shouldRender) return null;

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <AlertTriangle className="h-6 w-6 text-red-600" />;
            case 'warning':
                return <AlertTriangle className="h-6 w-6 text-amber-600" />;
            default:
                return <AlertTriangle className="h-6 w-6 text-blue-600" />;
        }
    };

    const getIconBg = () => {
        switch (variant) {
            case 'danger':
                return 'bg-red-100';
            case 'warning':
                return 'bg-amber-100';
            default:
                return 'bg-blue-100';
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose?.();
            }}
            role="presentation"
        >
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-label={title}
                aria-describedby="confirm-dialog-message"
                tabIndex={-1}
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 outline-none"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">
                        {title}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full flex-shrink-0 ${getIconBg()}`}>
                            {getIcon()}
                        </div>
                        <div>
                            <p id="confirm-dialog-message" className="text-slate-600 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3">
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText || confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
