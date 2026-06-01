import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const Features = () => {
    const featuresList = [
        "Room Inventory Management",
        "Digital Tenant Onboarding (KYC)",
        "Automated Rent & Bill Generation",
        "Expense Tracking & Reports",
        "Complaint & Maintenance Ticket System",
        "Tenant Mobile App Access",
        "Multi-PG/Branch Support",
        "WhatsApp & SMS Notifications"
    ];

    return (
        <div className="py-20 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Designed to solve the real problems of PG owners. From admission to exit, we've got you covered.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featuresList.map((feature, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start space-x-3">
                            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="font-medium text-slate-800">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;
