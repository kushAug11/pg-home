const axios = require('axios');

const registerOwner = async () => {
    const uniqueId = Date.now();
    const payload = {
        name: `Test Owner ${uniqueId}`,
        email: `owner_${uniqueId}@test.com`,
        password: 'password123',
        pgName: `Test PG ${uniqueId}`,
        role: 'owner'
    };

    try {
        console.log('Attempting registration with:', payload);
        const res = await axios.post('http://localhost:5000/api/auth/register', payload);
        console.log('Success:', res.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

registerOwner();
