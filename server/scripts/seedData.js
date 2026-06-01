const axios = require('axios');

const seedData = async () => {
    try {
        const uniqueId = 'testv3';
        const suffixes = {
            admin: uniqueId,
            owner: uniqueId,
            tenant: uniqueId
        };

        // 1. Create Admin
        try {
            const adminEmail = `admin_${suffixes.admin}@hostel.com`;
            await axios.post('http://localhost:5000/api/auth/register', {
                name: 'Super Admin ' + suffixes.admin,
                email: adminEmail,
                password: 'password123',
                role: 'admin'
            });
            console.log(`LOGIN_CREDENTIALS|admin|${adminEmail}|password123`);
        } catch (err) {
            console.log('Admin creation failed:', err.message);
        }

        // 2. Create Owner
        let ownerToken = null;
        try {
            const ownerEmail = `owner_${suffixes.owner}@hostel.com`;
            const ownerRes = await axios.post('http://localhost:5000/api/auth/register', {
                name: 'Mahi Owner ' + suffixes.owner,
                email: ownerEmail,
                password: 'password123',
                role: 'owner',
                pgName: 'Mahi Luxury PG ' + suffixes.owner
            });
            ownerToken = ownerRes.data.data.token;
            console.log(`LOGIN_CREDENTIALS|owner|${ownerEmail}|password123`);
        } catch (err) {
            console.log('Owner creation failed details:', err.response?.data || err.message);
        }

        // 3. Create Tenant (Direct Register)
        try {
            const tenantEmail = `tenant_${suffixes.tenant}@hostel.com`;
            await axios.post('http://localhost:5000/api/auth/register', {
                name: 'Simple Tenant ' + suffixes.tenant,
                email: tenantEmail,
                password: 'password123',
                role: 'tenant'
            });
            console.log(`LOGIN_CREDENTIALS|tenant|${tenantEmail}|password123`);
        } catch (err) {
            console.log('Tenant creation failed:', err.message);
        }

    } catch (error) {
        console.error('Seed Error:', error.message);
    }
};

seedData();
