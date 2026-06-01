const http = require('http');

const checkPort = (port, name) => {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
            console.log(`✅ ${name} (Port ${port}) is UP. Status: ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', (err) => {
            console.error(`❌ ${name} (Port ${port}) is DOWN. Error: ${err.message}`);
            resolve(false);
        });

        req.setTimeout(2000, () => {
            req.abort();
            console.error(`❌ ${name} (Port ${port}) TIMED OUT.`);
            resolve(false);
        });
    });
};

const runChecks = async () => {
    console.log('Checking Server Connectivity...');
    const backendUp = await checkPort(5000, 'Backend Server');
    const frontendUp = await checkPort(5173, 'Frontend Client'); // VITE default

    if (backendUp && frontendUp) {
        console.log('--- ALL SYSTEMS GO ---');
    } else {
        console.log('--- SYSTEM ISSUES DETECTED ---');
    }
};

runChecks();
