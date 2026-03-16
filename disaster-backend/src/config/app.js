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
const fundingRoutes = require('../modules/funding/funding.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');

const { errorHandler, notFound } = require('../middlewares/errorHandler');

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
app.use('/api', limiter);

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

// Events & nested casualties — FIX: casualty mounted di prefix terpisah
app.use(`${API}/events`, eventRoutes);
app.use(`${API}/events`, casualtyRoutes);   // casualtyRoutes handles /:eventId/casualties internally

// Logistics
app.use(`${API}/warehouses`, warehouseRoutes);
app.use(`${API}/shipments`, shipmentRoutes);

// Refugees — FIX: healthRoutes mounted di /shelters bukan prefix terpisah
app.use(`${API}/shelters`, shelterRoutes);
app.use(`${API}/refugees`, refugeeRoutes);
app.use(`${API}/shelters`, healthRoutes);   // healthRoutes handles /:shelterId/health internally

// Operations & Decisions
app.use(`${API}/tasks`, taskRoutes);
app.use(`${API}/decisions`, decisionRoutes);

// Funding & Dashboard
app.use(`${API}/funding`, fundingRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);

// ─── Error handlers ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;

