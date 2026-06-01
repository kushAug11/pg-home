const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function reproduce() {
    console.log('--- REPRODUCING ADD TENANT ERROR ---');
    try {
        // 1. Register Owner
        // Use a random email to avoid collision if DB wasn't fully wiped (though it is in-memory)
        const email = `owner_${Date.now()}@test.com`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'Debug Owner',
            email: email,
            password: 'password123',
            role: 'owner',
            pgName: 'Debug PG',
            mobile: '5555555555'
        });
        const token = regRes.data.token;
        console.log('1. Owner Registered. Token obtained.');

        // 2. Add Room
        const roomRes = await axios.post(`${API_URL}/owner/rooms`, {
            roomNumber: '999',
            type: 'Single',
            rent: 5000,
            capacity: 1
        }, { headers: { Authorization: `Bearer ${token}` } });
        const roomId = roomRes.data.data._id;
        console.log('2. Room Created. ID:', roomId);

        // 3. Add Tenant
        const form = new FormData();
        form.append('name', 'Debug Tenant');
        form.append('email', `tenant_${Date.now()}@test.com`);
        form.append('mobile', '9998887776');
        form.append('room_id', roomId); // Using correct key now
        form.append('rentAmount', 5000);
        form.append('advanceAmount', 1000);

        // Dummy file
        const dummyPath = path.join(__dirname, 'dummy.txt');
        fs.writeFileSync(dummyPath, 'proof');
        form.append('idProof', fs.createReadStream(dummyPath));

        console.log('3. Sending Add Tenant Request...');
        const tenantRes = await axios.post(`${API_URL}/owner/tenants`, form, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...form.getHeaders()
            }
        });
        console.log('✅ Success! Tenant Added:', tenantRes.data.data._id);

        fs.unlinkSync(dummyPath);
    } catch (error) {
        console.error('❌ FAILED:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No Response Received:', error.request);
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

reproduce();
