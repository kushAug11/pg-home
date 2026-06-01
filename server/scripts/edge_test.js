const axios = require('axios');

async function runEdgeTests() {
    const baseUrl = 'http://localhost:5000/api';
    
    console.log('🧪 Starting Advanced Edge Case Testing...\n');

    // 1. Large Payload Test
    console.log('--- 1. Large Payload Test ---');
    const largeData = 'a'.repeat(200 * 1024); 
    try {
        await axios.post(`${baseUrl}/auth/login`, { email: 'test@example.com', password: largeData });
    } catch (err) {
        if (err.response?.status === 413) {
            console.log('✅ Large payload correctly rejected (413)\n');
        } else {
            console.log(`❌ Unexpected result for large payload: ${err.response?.status || err.message}\n`);
        }
    }

    // 2. NoSQL Injection Test (mongo-sanitize)
    console.log('--- 2. NoSQL Injection Test ---');
    try {
        // Sending a query object instead of a string
        const res = await axios.post(`${baseUrl}/auth/login`, { 
            email: { "$gt": "" }, 
            password: "password123" 
        });
        console.log('❌ NoSQL Injection potentially successful? (Expected sanitization to prevent this)\n');
    } catch (err) {
        // If sanitized, it might fail auth (401) because the query object is stripped or becomes empty
        if (err.response?.status === 401 || err.response?.status === 400) {
            console.log('✅ NoSQL Injection blocked or sanitized (Status ' + err.response.status + ')\n');
        } else {
            console.log(`ℹ️ NoSQL Test result: ${err.response?.status || err.message}\n`);
        }
    }

    // 3. HTTP Parameter Pollution (hpp)
    console.log('--- 3. HTTP Parameter Pollution ---');
    try {
        // Sending duplicate parameters: ?role=owner&role=tenant
        // hpp should take the last one or flatten it depending on config
        const res = await axios.get(`${baseUrl}/public/hostels?role=owner&role=tenant`);
        console.log('✅ Parameter pollution request handled.\n');
    } catch (err) {
        console.log(`ℹ️ HPP Test result: ${err.response?.status || err.message}\n`);
    }

    // 4. Extreme String Lengths in Search
    console.log('--- 4. Extreme String Lengths ---');
    try {
        const longSearch = 's'.repeat(1000);
        await axios.get(`${baseUrl}/public/hostels?search=${longSearch}`);
        console.log('✅ Extreme string length in query handled.\n');
    } catch (err) {
        console.log(`ℹ️ Long string result: ${err.response?.status || err.message}\n`);
    }

}

runEdgeTests();
