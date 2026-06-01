const axios = require('axios');

const testTenantFlow = async () => {
    const uniqueId = Date.now();
    const email = `tenant_${uniqueId}@test.com`;
    const password = 'password123';

    try {
        // 1. Register as Tenant
        console.log(`Registering new tenant: ${email}`);
        const regRes = await axios.post('http://localhost:5000/api/auth/register', {
            name: `Test Tenant ${uniqueId}`,
            email,
            password,
            role: 'tenant'
        });
        console.log('Registration Success:', regRes.data.success);
        console.log('Registered Role:', regRes.data.data.role);

        // 2. Login
        console.log('Attempting Login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email,
            password
        });
        console.log('Login Success:', loginRes.data.success);
        console.log('Login Role:', loginRes.data.data.role);

        if (loginRes.data.data.role === 'tenant') {
            console.log('✅ TEST PASSED: User identified as Tenant');
        } else {
            console.error('❌ TEST FAILED: Role mismatch');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error(error.response.data);
    }
};

testTenantFlow();
