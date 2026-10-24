/**
 * Game & Simulation HTTP Controllers
 */

const gameService = require('../services/gameService');

class GameController {
  async getRoles(req, res, next) {
    try {
      const roles = await gameService.getRoles();
      res.status(200).json({
        success: true,
        data: { roles }
      });
    } catch (err) {
      next(err);
    }
  }

  async getMissions(req, res, next) {
    try {
      const { roleId, difficulty } = req.query;
      const missions = await gameService.getPublishedMissions({ roleId, difficulty });
      res.status(200).json({
        success: true,
        data: { missions }
      });
    } catch (err) {
      next(err);
    }
  }

  async getMissionById(req, res, next) {
    try {
      const mission = await gameService.getMissionById(req.params.id);
      res.status(200).json({
        success: true,
        data: { mission }
      });
    } catch (err) {
      next(err);
    }
  }

  async startAttempt(req, res, next) {
    try {
      const userId = req.user.id;
      const { scenarioId } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;

      if (!scenarioId) {
        return res.status(400).json({ success: false, error: { message: 'scenarioId is required.' } });
      }

      const result = await gameService.startAttempt({
        userId,
        scenarioId,
        idempotencyKey
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async submitDecision(req, res, next) {
    try {
      const userId = req.user.id;
      const attemptId = req.params.id;
      const { optionId } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;

      if (!optionId) {
        return res.status(400).json({ success: false, error: { message: 'optionId is required.' } });
      }

      const result = await gameService.submitDecision({
        userId,
        attemptId,
        optionId,
        idempotencyKey
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async resumeAttempt(req, res, next) {
    try {
      const userId = req.user.id;
      const attemptId = req.params.id;
      const result = await gameService.resumeAttempt({ userId, attemptId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const progress = await gameService.getUserProgress(userId);
      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GameController();
