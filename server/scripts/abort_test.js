const axios = require('axios');

async function testAbort() {
    console.log('🧪 Testing Network Interruption (Client Abort)...');
    
    const controller = new AbortController();
    
    setTimeout(() => {
        console.log('--- Aborting request... ---');
        controller.abort();
    }, 100);

    try {
        await axios.get('http://localhost:5000/api/public/hostels', { signal: controller.signal });
        console.log('❌ Request finished unexpectedly');
    } catch (err) {
        if (err.name === 'CanceledError' || axios.isCancel(err)) {
            console.log('✅ Client aborted request successfully.');
        } else {
            console.log(`ℹ️ Request failed: ${err.message}`);
        }
    }
}

testAbort();
