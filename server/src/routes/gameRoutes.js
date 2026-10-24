/**
 * Game & Simulation Routes (/api/v1/game)
 */

const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Public or optional-auth exploration endpoints
router.get('/roles', (req, res, next) => gameController.getRoles(req, res, next));
router.get('/missions', (req, res, next) => gameController.getMissions(req, res, next));
router.get('/missions/:id', (req, res, next) => gameController.getMissionById(req, res, next));

// Authenticated server-authoritative attempts & decisions
router.post('/attempts/start', requireAuth, (req, res, next) => gameController.startAttempt(req, res, next));
router.post('/attempts/:id/decision', requireAuth, (req, res, next) => gameController.submitDecision(req, res, next));
router.get('/attempts/:id/resume', requireAuth, (req, res, next) => gameController.resumeAttempt(req, res, next));

// Authenticated player progress
router.get('/progress', requireAuth, (req, res, next) => gameController.getUserProgress(req, res, next));

module.exports = router;
