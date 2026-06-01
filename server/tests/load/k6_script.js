import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 50 },  // Stay at 50 users (Baseline)
        { duration: '30s', target: 0 },  // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    },
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
    // 1. Simulate Login (Tenant)
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: 'tenant@test.com',
        password: 'password123',
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
        'login success': (r) => r.status === 200,
    });

    if (loginRes.status === 200) {
        const token = loginRes.json('data.token');
        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        };

        // 2. Fetch User Profile (Light Read)
        const meRes = http.get(`${BASE_URL}/auth/me`, params);
        check(meRes, {
            'get me success': (r) => r.status === 200,
        });

        // 3. Simulate Dashboard Load (Heavy Read - if endpoints existed)
        // sleep(1);
    }

    sleep(1);
}
