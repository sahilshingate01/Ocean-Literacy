/**
 * Ocean Literacy Express Application Configuration
 *
 * Implements security headers, strict CORS, body parsers,
 * static asset serving for web/Android browsers, API routing, and centralized error handling.
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { requestLogger } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Renderer uses custom CSP in index.html
    crossOriginEmbedderPolicy: false
  })
);

// 2. Strict CORS Allowlist
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as Electron desktop, mobile, curl, or same-origin)
      if (!origin) return callback(null, true);
      if (config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('CORS request blocked by origin allowlist policy.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key']
  })
);

// 3. Request Parsers & Logging
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(config.cookie.secret));
app.use(requestLogger);

// 4. Mount API Routes
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/game`, gameRoutes);
app.use(`${config.apiPrefix}/progress`, (req, res, next) => {
  // Aliased progress endpoint forwarding to gameController
  req.url = '/progress' + req.url;
  gameRoutes(req, res, next);
});
app.use(`${config.apiPrefix}/leaderboards`, (req, res, next) => {
  if (app.get('leaderboardRoutes')) return app.get('leaderboardRoutes')(req, res, next);
  next();
});
app.use(`${config.apiPrefix}/integrations`, (req, res, next) => {
  if (app.get('incoisRoutes')) return app.get('incoisRoutes')(req, res, next);
  next();
});
app.use(`${config.apiPrefix}/admin`, (req, res, next) => {
  if (app.get('adminRoutes')) return app.get('adminRoutes')(req, res, next);
  next();
});
app.use(`${config.apiPrefix}/health`, (req, res, next) => {
  if (app.get('healthRoutes')) return app.get('healthRoutes')(req, res, next);
  next();
});

// 5. Static Assets Serving for Web Browser & Android Access
// Serves src/renderer directly from the backend
const rendererPath = path.resolve(__dirname, '../../src/renderer');
app.use(express.static(rendererPath));

// Also serve assets/icons for the browser
const assetsPath = path.resolve(__dirname, '../../assets');
app.use('/assets', express.static(assetsPath));

// Fallback route for SPA web client navigation
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith(config.apiPrefix)) {
    return next(); // pass to 404 handler
  }
  res.sendFile(path.join(rendererPath, 'index.html'));
});

// 6. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
