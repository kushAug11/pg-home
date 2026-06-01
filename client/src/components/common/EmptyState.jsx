import React from 'react';
import { Search, FolderOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
    title = 'No data found',
    description = 'Try adjusting your search or filter to find what you are looking for.',
    icon: Icon = FolderOpen,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 ${className}`}>
            <div className="bg-white p-3 rounded-full shadow-sm mb-4">
                <Icon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>

            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
