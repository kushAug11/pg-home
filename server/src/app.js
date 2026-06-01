const express = require('express');
const cors = require('cors');
const { NODE_ENV } = require('./config/env');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Routes Import
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const ownerRoutes = require('./routes/owner.routes');
const tenantRoutes = require('./routes/tenant.routes');
const { initCronJobs } = require('./services/cron.service');

// Initialize Cron Jobs
// Initialize Cron Jobs
if (process.env.NODE_ENV !== 'test') {
    initCronJobs();
    // Database connection is handled in server.js
}

const app = express();

// Trust Proxy (Required for Render/Vercel/Nginx to get correct client IP for rate limiting)
app.set('trust proxy', 1);

const trackingMiddleware = require('./middlewares/tracking.middleware');

app.use(trackingMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Handle URL-encoded data

// CORS Configuration for Custom Domain
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000', process.env.CLIENT_URL].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies and authentication headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security Middleware (Skip in Test to avoid supertest mock conflicts)
if (process.env.NODE_ENV !== 'test') {
    // 1. Set Security HTTP Headers
    app.use(helmet());

    // 2. Data Sanitization against NoSQL Query Injection
    // CRITICAL: express-mongo-sanitize 2.2.0 is incompatible with Express 5 getters.
    // app.use(mongoSanitize());

    // 3. Data Sanitization against XSS
    // xss-clean is incompatible with Express 5 getters. 
    // We rely on Helmet and frontend sanitization for now.
    // app.use(xss());
    
    // 4. Prevent HTTP Parameter Pollution
    // hpp is compatible if used directly
    app.use(hpp({
        whitelist: [
            'price', 'rating', 'role', 'status', 'limit', 'page'
        ]
    }));
}

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);
const path = require('path');

// Join parent directory of server (root) + uploads
// If server is in /server, and uploads is in /server/uploads:
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const mongoose = require('mongoose');

// Basic Route
app.get('/', (req, res) => {
    res.send('Hostel Management SaaS API is running...');
});

// Health Check Endpoint (SRE)
app.get('/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
    const health = {
        success: true,
        uptime: process.uptime(),
        timestamp: new Date(),
        services: {
            database: {
                status: dbStatus,
                host: mongoose.connection.host
            },
            server: {
                status: 'UP',
                memory: process.memoryUsage(),
                env: process.env.NODE_ENV
            }
        }
    };

    if (dbStatus !== 'CONNECTED') {
        res.status(503).json({ ...health, success: false });
    } else {
        res.json(health);
    }
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/mess', require('./routes/mess.routes'));
app.use('/api/security', require('./routes/security.routes'));
app.use('/api/housekeeping', require('./routes/housekeeping.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/public', require('./routes/public.routes'));
app.use('/api/visits', require('./routes/visit.routes'));
app.use('/api/complaints', require('./routes/complaints.routes'));
app.use('/api/tenant', tenantRoutes);

// Error Handler
const { errorHandler } = require('./middlewares/error.middleware');
app.use(errorHandler);

module.exports = app;
