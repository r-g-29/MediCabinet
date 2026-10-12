// Express app configuration – middleware, routes, error handler
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const medicineRoutes = require('./routes/medicines');
const referenceRoutes = require('./routes/reference');
const scheduleRoutes = require('./routes/schedules');
const doseRoutes = require('./routes/doses');
const notificationRoutes = require('./routes/notifications');
const devRoutes = require('./routes/dev');
const statsRoutes = require('./routes/stats');
const emergencyRoutes = require('./routes/emergency');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS – allow the Vite dev client
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

// Request logging (dev)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting – 1000 requests per 15 minutes per IP (generous for dev/testing)
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'MediCabinet API is running' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/doses', doseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/dev', devRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// Central error handler – must be last
app.use(errorHandler);

module.exports = app;
