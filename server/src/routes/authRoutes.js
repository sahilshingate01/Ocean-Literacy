/**
 * Authentication Routes (/api/v1/auth)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimiter');
const config = require('../config');

const authLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  prefix: 'auth_rl',
  message: 'Too many authentication attempts. Please try again later.'
});

// Public authentication endpoints with rate limiting
router.post('/register', authLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/request-password-reset', authLimiter, (req, res, next) => authController.requestPasswordReset(req, res, next));
router.post('/reset-password', authLimiter, (req, res, next) => authController.resetPassword(req, res, next));

// Protected authenticated routes
router.post('/logout', optionalAuth, (req, res, next) => authController.logout(req, res, next));
router.get('/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));
router.patch('/settings', requireAuth, (req, res, next) => authController.updateSettings(req, res, next));

// DPDP Privacy Compliance Endpoints
router.get('/export-data', requireAuth, (req, res, next) => authController.exportData(req, res, next));
router.delete('/delete-account', requireAuth, (req, res, next) => authController.deleteAccount(req, res, next));

module.exports = router;
