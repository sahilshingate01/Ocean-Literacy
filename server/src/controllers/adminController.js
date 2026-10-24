/**
 * Admin Content Management & Governance HTTP Controllers
 */

const adminService = require('../services/adminService');

class AdminController {
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const search = (req.query.search || '').trim();
      const role = req.query.role || null;

      const result = await adminService.getUsers({ page, limit, search, role });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const adminUserId = req.user.id;
      const targetUserId = req.params.id;
      const { role } = req.body;

      const updated = await adminService.updateUserRole(adminUserId, targetUserId, role);
      res.status(200).json({
        success: true,
        data: { user: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const adminUserId = req.user.id;
      const targetUserId = req.params.id;
      const { isActive } = req.body;

      const updated = await adminService.updateUserStatus(adminUserId, targetUserId, isActive);
      res.status(200).json({
        success: true,
        data: { user: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllMissions(req, res, next) {
    try {
      const scenarios = await adminService.getAllMissions();
      res.status(200).json({
        success: true,
        data: { scenarios }
      });
    } catch (err) {
      next(err);
    }
  }

  async getMissionDetail(req, res, next) {
    try {
      const scenario = await adminService.getMissionDetail(req.params.id);
      res.status(200).json({
        success: true,
        data: { scenario }
      });
    } catch (err) {
      next(err);
    }
  }

  async createDraftMission(req, res, next) {
    try {
      const userId = req.user.id;
      const newScenario = await adminService.createDraftMission(userId, req.body);
      res.status(201).json({
        success: true,
        data: { scenario: newScenario }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDraftMission(req, res, next) {
    try {
      const userId = req.user.id;
      const scenarioId = req.params.id;
      const result = await adminService.updateDraftMission(userId, scenarioId, req.body);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async publishMission(req, res, next) {
    try {
      const userId = req.user.id;
      const scenarioId = req.params.id;
      const published = await adminService.publishMission(userId, scenarioId);
      res.status(200).json({
        success: true,
        data: { scenario: published }
      });
    } catch (err) {
      next(err);
    }
  }

  async unpublishMission(req, res, next) {
    try {
      const userId = req.user.id;
      const scenarioId = req.params.id;
      const unpublished = await adminService.unpublishMission(userId, scenarioId);
      res.status(200).json({
        success: true,
        data: { scenario: unpublished }
      });
    } catch (err) {
      next(err);
    }
  }

  async archiveMission(req, res, next) {
    try {
      const userId = req.user.id;
      const scenarioId = req.params.id;
      const archived = await adminService.archiveMission(userId, scenarioId);
      res.status(200).json({
        success: true,
        data: { scenario: archived }
      });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
      const result = await adminService.getAuditLogs({ page, limit });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async moderateScore(req, res, next) {
    try {
      const adminUserId = req.user.id;
      const transactionId = req.params.transactionId;
      const { reason } = req.body;
      const result = await adminService.moderateScore(adminUserId, transactionId, reason);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
