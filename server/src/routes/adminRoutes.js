/**
 * Admin Content Management & Governance Routes (/api/v1/admin)
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All admin routes require authentication
router.use(requireAuth);

// Content Editor & Administrator Routes (Drafting & Review)
router.get('/missions', requireRole('CONTENT_EDITOR', 'ADMIN'), (req, res, next) => adminController.getAllMissions(req, res, next));
router.get('/missions/:id', requireRole('CONTENT_EDITOR', 'ADMIN'), (req, res, next) => adminController.getMissionDetail(req, res, next));
router.post('/missions', requireRole('CONTENT_EDITOR', 'ADMIN'), (req, res, next) => adminController.createDraftMission(req, res, next));
router.put('/missions/:id', requireRole('CONTENT_EDITOR', 'ADMIN'), (req, res, next) => adminController.updateDraftMission(req, res, next));

// Administrator Only Routes (Publishing, User Management, Audit & Moderation)
router.get('/stats', requireRole('ADMIN'), (req, res, next) => adminController.getStats(req, res, next));
router.get('/users', requireRole('ADMIN'), (req, res, next) => adminController.getUsers(req, res, next));
router.patch('/users/:id/role', requireRole('ADMIN'), (req, res, next) => adminController.updateUserRole(req, res, next));
router.patch('/users/:id/status', requireRole('ADMIN'), (req, res, next) => adminController.updateUserStatus(req, res, next));

router.post('/missions/:id/publish', requireRole('ADMIN'), (req, res, next) => adminController.publishMission(req, res, next));
router.post('/missions/:id/unpublish', requireRole('ADMIN'), (req, res, next) => adminController.unpublishMission(req, res, next));
router.post('/missions/:id/archive', requireRole('ADMIN'), (req, res, next) => adminController.archiveMission(req, res, next));

router.get('/audit-logs', requireRole('ADMIN'), (req, res, next) => adminController.getAuditLogs(req, res, next));
router.delete('/leaderboards/moderation/:transactionId', requireRole('ADMIN'), (req, res, next) => adminController.moderateScore(req, res, next));

module.exports = router;
