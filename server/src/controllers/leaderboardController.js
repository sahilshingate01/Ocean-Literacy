/**
 * Global Leaderboard HTTP Controllers
 */

const leaderboardService = require('../services/leaderboardService');

class LeaderboardController {
  async getDaily(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const currentUserId = req.user?.id || null;

      const result = await leaderboardService.getDailyLeaderboard({ page, limit, currentUserId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getWeekly(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const currentUserId = req.user?.id || null;

      const result = await leaderboardService.getWeeklyLeaderboard({ page, limit, currentUserId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getOverall(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const currentUserId = req.user?.id || null;

      const result = await leaderboardService.getOverallLeaderboard({ page, limit, currentUserId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyStanding(req, res, next) {
    try {
      const userId = req.user.id;
      const standing = await leaderboardService.getUserStanding(userId);
      res.status(200).json({
        success: true,
        data: standing
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LeaderboardController();
