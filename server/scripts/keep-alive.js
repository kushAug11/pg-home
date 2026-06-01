// Keep-Alive Service for Render Free Tier
// This prevents the backend from sleeping

const BACKEND_URL = 'https://hostelspgs-managament-website-1.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function pingBackend() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();
        console.log(`[${new Date().toISOString()}] ✅ Backend is alive:`, data);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Ping failed:`, error.message);
    }
}

// Ping immediately on start
pingBackend();

// Then ping every 10 minutes
setInterval(pingBackend, PING_INTERVAL);

console.log(`🔄 Keep-alive service started. Pinging ${BACKEND_URL} every 10 minutes.`);
