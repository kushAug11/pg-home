import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({ label, error, className = '', type, icon: Icon, ...props }) => {
    const inputId = props.id || props.name;
    const [showPassword, setShowPassword] = useState(false);

    // Determine if this is a password field
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

    return (
        <div className={`w-full ${className}`}>
            {label && <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    id={inputId}
                    type={inputType}
                    className={`input-field ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} ${isPasswordField ? 'pr-10' : ''} ${Icon ? 'pl-10' : ''} ${props.inputClassName || ''}`}
                    {...props}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default Input;
