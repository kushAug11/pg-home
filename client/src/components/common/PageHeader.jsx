import React from 'react';

const PageHeader = ({ title, subtitle, actions }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
