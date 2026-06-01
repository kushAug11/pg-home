import React from 'react';

const Skeleton = ({ variant = 'text', className = '', count = 1 }) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'circle':
                return 'rounded-full';
            case 'rect':
            case 'card':
                return 'rounded-lg';
            default:
                return 'rounded';
        }
    };

    const getHeight = () => {
        switch (variant) {
            case 'circle':
                return 'h-12 w-12';
            case 'text':
                return 'h-4 w-full';
            case 'rect':
                return 'h-32 w-full';
            case 'card':
                return 'h-64 w-full';
            case 'table-row':
                return 'h-16 w-full';
            default:
                return 'h-4 w-full';
        }
    };

    const renderSkeleton = (key) => (
        <div
            key={key}
            className={`bg-slate-200 animate-pulse ${getVariantClasses()} ${getHeight()} ${className}`}
        />
    );

    if (count === 1) {
        return renderSkeleton('single');
    }

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <React.Fragment key={index}>
                    {renderSkeleton(index)}
                </React.Fragment>
            ))}
        </>
    );
};

export default Skeleton;
