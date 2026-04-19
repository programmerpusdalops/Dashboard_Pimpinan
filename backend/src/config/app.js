'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Route imports
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const eventRoutes = require('../modules/events/event.routes');
const casualtyRoutes = require('../modules/casualties/casualty.routes');
const warehouseRoutes = require('../modules/logistics/warehouse.routes');
const shipmentRoutes = require('../modules/logistics/shipment.routes');
const shelterRoutes = require('../modules/refugees/shelter.routes');
const refugeeRoutes = require('../modules/refugees/refugee.routes');
const healthRoutes = require('../modules/refugees/health.routes');
const taskRoutes = require('../modules/operations/task.routes');
const decisionRoutes = require('../modules/decisions/decision.routes');
const instructionRoutes = require('../modules/instructions/instruction.routes');
const fundingRoutes = require('../modules/funding/funding.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const appSettingsRoutes = require('../modules/app-settings/appSettings.routes');
const notificationRoutes = require('../modules/notifications/notification.routes');

const { errorHandler, notFound } = require('../middlewares/errorHandler');
const { checkNavAccess } = require('../middlewares/navAccess.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const app = express();

// Security
app.use(helmet());

// CORS
const allowedOrigins = [
    'http://localhost:5180',
    'http://localhost:5181',
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 200,
    message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// app.use('/api', limiter); // Disabled rate limiting

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── API Routes ───────────────────────────────────────────────
const API = '/api/v1';

// Info endpoint
app.get(API, (req, res) => {
    res.json({ success: true, message: 'Disaster Management API v1', version: '2.0.0' });
});

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);

// Events & nested casualties — akses diproteksi oleh nav_access_configs
app.use(`${API}/events`, eventRoutes);
app.use(`${API}/events`, casualtyRoutes);   // casualtyRoutes handles /:eventId/casualties internally

// Logistics — nav access check via DB
app.use(`${API}/warehouses`, warehouseRoutes);
app.use(`${API}/shipments`, shipmentRoutes);

// Refugees — nav access check via DB
app.use(`${API}/shelters`, shelterRoutes);
app.use(`${API}/refugees`, refugeeRoutes);
app.use(`${API}/shelters`, healthRoutes);   // healthRoutes handles /:shelterId/health internally

// Operations & Decisions — nav access check via DB
app.use(`${API}/tasks`, taskRoutes);
app.use(`${API}/decisions`, decisionRoutes);
app.use(`${API}/instructions`, instructionRoutes);

// Funding & Dashboard
app.use(`${API}/funding`, fundingRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/app-settings`, appSettingsRoutes);
app.use(`${API}/notifications`, notificationRoutes);

// ─── Error handlers ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;

