const PLAN_LIMITS = {
    'Free': {
        maxTenants: 5,
        features: [
            'Basic Tenant Management',
            'Manual Payments',
            'Email Support'
        ]
    },
    'Starter': {
        maxTenants: 20,
        features: [
            'Everything in Free',
            'Rent Tracking & Reminders (Email)',
            'Complaint Management System',
            'Notice Board',
            'Basic Dashboard Stats'
        ]
    },
    'Pro': {
        maxTenants: 100,
        features: [
            'Everything in Starter',
            'Automated WhatsApp Reminders',
            'Expense Management & Reports',
            'Financial Analytics (Profit/Loss)',
            'Priority Support',
            'Data Export (CSV)'
        ]
    },
    'Enterprise': {
        maxTenants: Infinity,
        features: [
            'Everything in Pro',
            'Unlimited Tenants',
            'Multi-Branch Management',
            'Custom Branding',
            'Dedicated Account Manager',
            'API Access'
        ]
    }
};

module.exports = { PLAN_LIMITS };
