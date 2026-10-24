/**
 * Global Leaderboard Routes (/api/v1/leaderboards)
 */

const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

// Public rankings (with optionalAuth so logged-in users get their rank highlighted)
router.get('/daily', optionalAuth, (req, res, next) => leaderboardController.getDaily(req, res, next));
router.get('/weekly', optionalAuth, (req, res, next) => leaderboardController.getWeekly(req, res, next));
router.get('/overall', optionalAuth, (req, res, next) => leaderboardController.getOverall(req, res, next));

// Authenticated current-user rank overview
router.get('/me', requireAuth, (req, res, next) => leaderboardController.getMyStanding(req, res, next));

module.exports = router;
