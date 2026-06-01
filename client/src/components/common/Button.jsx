import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button Component
 * Supports multiple variants, sizes, and loading states.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'} [props.variant='primary'] - Visual style variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Button size
 * @param {boolean} [props.isLoading=false] - Shows loading spinner and disables button if true
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {...Object} props.rest - Other standard button attributes (onClick, type, etc.)
 */
const Button = ({ children, variant = 'primary', size = 'md', isLoading, className = '', ...props }) => {
    // Relies mostly on .btn class defined in index.css
    const baseStyles = 'btn focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'btn-primary focus:ring-primary-500',
        secondary: 'btn-outline focus:ring-slate-400',
        accent: 'btn-accent focus:ring-accent',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg active:scale-95 focus:ring-red-500',
        ghost: 'bg-transparent hover:bg-slate-100/50 text-slate-600 active:scale-95 hover:text-primary-600',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg font-bold',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 pointer-events-none mix-blend-overlay"></span>
        </button>
    );
};

export default Button;
