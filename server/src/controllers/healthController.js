/**
 * Operational Health & Diagnostic Controllers
 *
 * Implements /liveness, /readiness, and /diagnostic status endpoints
 * for Kubernetes, Docker, and host institution operations monitoring.
 */

const prisma = require('../config/prisma');
const config = require('../config');

class HealthController {
  /**
   * Liveness probe: returns 200 if process is responsive
   */
  async getLiveness(req, res) {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Readiness probe: checks database connectivity and schema readiness
   */
  async getReadiness(req, res) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'READY',
        database: 'CONNECTED',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(503).json({
        status: 'NOT_READY',
        database: 'DISCONNECTED',
        error: 'Database connection failed.',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Diagnostic status (sanitized — no passwords, tokens, or sensitive details)
   */
  async getDiagnostic(req, res) {
    try {
      const dbCheck = await prisma.$queryRaw`SELECT 1`.then(() => 'CONNECTED').catch(() => 'DISCONNECTED');
      const memory = process.memoryUsage();

      res.status(200).json({
        status: 'HEALTHY',
        version: '2.0.0',
        environment: config.env,
        uptimeSeconds: Math.floor(process.uptime()),
        timezone: config.leaderboard.timezone,
        database: dbCheck,
        memoryUsage: {
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
          rssMb: Math.round(memory.rss / (1024 * 1024))
        },
        services: {
          incoisIntegration: 'OPERATIONAL_ADAPTER_ACTIVE',
          rateLimiter: 'ACTIVE',
          authProvider: 'LOCAL_JWT_ARGON2_BCRYPT'
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({
        status: 'DEGRADED',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new HealthController();
