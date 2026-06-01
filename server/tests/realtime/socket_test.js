const { io } = require('socket.io-client');
const http = require('http');
const express = require('express');
const { initSocket } = require('../../src/services/socket.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

// Mock data
const PG_1 = '60d21b4667d0d8992e610c85';
const PG_2 = '60d21b4667d0d8992e610c86';
const OWNER_1_ID = '60d21b4667d0d8992e610c87';
const TENANT_1_ID = '60d21b4667d0d8992e610c88';
const TENANT_2_ID = '60d21b4667d0d8992e610c89';

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET);

async function runTest() {
    console.log('🚀 Starting Real-Time Socket.io Simulation...');

    // 1. Setup Mock Server
    const app = express();
    const server = http.createServer(app);
    const socketIO = initSocket(server);
    
    server.listen(4000, () => console.log('✅ Mock Server listening on port 4000'));

    const createClient = (token) => {
        return io('http://localhost:4000', {
            auth: { token }
        });
    };

    // 2. Connect Clients
    const ownerToken = generateToken({ id: OWNER_1_ID, role: 'owner', pg_id: PG_1 });
    const tenant1Token = generateToken({ id: TENANT_1_ID, role: 'tenant', pg_id: PG_1 });
    const tenant2Token = generateToken({ id: TENANT_2_ID, role: 'tenant', pg_id: PG_2 }); // Different PG

    const ownerClient = createClient(ownerToken);
    const tenant1Client = createClient(tenant1Token);
    const tenant2Client = createClient(tenant2Token);

    let testResults = {
        noticeReceived: false,
        complaintReceived: false,
        isolationMaintained: true
    };

    // 3. Test: New Notice (Owner 1 -> PG 1 Tenants)
    tenant1Client.on('NEW_NOTICE', (data) => {
        console.log('📩 Tenant 1 received notice:', data.title);
        testResults.noticeReceived = true;
    });

    tenant2Client.on('NEW_NOTICE', (data) => {
        console.error('❌ ERROR: Tenant 2 (PG 2) received notice from PG 1!');
        testResults.isolationMaintained = false;
    });

    // 4. Test: New Complaint (Tenant 1 -> Owner 1)
    ownerClient.on('NEW_COMPLAINT', (data) => {
        console.log('📩 Owner 1 received complaint:', data.complaint.title);
        testResults.complaintReceived = true;
    });

    // Wait for connections
    await new Promise(r => setTimeout(r, 1000));

    console.log('📡 Simulating: Owner 1 broadcasting Notice to PG 1...');
    socketIO.to(`pg_${PG_1}`).emit('NEW_NOTICE', { title: 'Water Tank Cleaning' });

    console.log('📡 Simulating: Tenant 1 raising Complaint...');
    socketIO.to(`pg_${PG_1}`).emit('NEW_COMPLAINT', { 
        complaint: { title: 'Leaking Tap', tenant_id: TENANT_1_ID },
        tenantName: 'John Doe'
    });

    // Wait for events to propagate
    await new Promise(r => setTimeout(r, 2000));

    // 5. Cleanup & Results
    ownerClient.disconnect();
    tenant1Client.disconnect();
    tenant2Client.disconnect();
    server.close();

    console.log('\n📊 --- Simulation Results ---');
    console.log(`Notice Received by PG 1: ${testResults.noticeReceived ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Complaint Received by Owner: ${testResults.complaintReceived ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Cross-PG Isolation: ${testResults.isolationMaintained ? '✅ PASS' : '❌ FAIL'}`);

    if (testResults.noticeReceived && testResults.complaintReceived && testResults.isolationMaintained) {
        console.log('\n🏆 ALL REAL-TIME TESTS PASSED!');
        process.exit(0);
    } else {
        console.log('\n🚨 SOME TESTS FAILED.');
        process.exit(1);
    }
}

runTest().catch(err => {
    console.error(err);
    process.exit(1);
});
