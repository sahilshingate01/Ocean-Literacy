/**
 * Genuine Global Leaderboard Service
 *
 * Implements database-backed rankings with:
 * - Daily and weekly boundaries locked to Asia/Kolkata (IST = UTC+05:30)
 * - Deterministic tie-breaking (Score DESC, XP DESC, Earliest Completion ASC, UserID ASC)
 * - Opt-in participation filtering (respects user privacy choices)
 * - Exclusion of deactivated accounts and non-authoritative practice attempts
 * - Paginated leaderboards and current-user rank lookup
 */

const prisma = require('../config/prisma');
const config = require('../config');
const { getPeriodBoundaries } = require('../utils/dateUtils');

const SCORING_METHODOLOGY = {
  description: 'Global Ocean Literacy rankings reflect genuine server-evaluated mission decisions.',
  tieBreaking: 'Ties are resolved deterministically by: 1) Total Score, 2) Total XP, 3) Earliest Completion Timestamp, 4) Player UID.',
  timezone: config.leaderboard.timezone,
  practiceNotice: 'Unranked replays and practice attempts do not alter competitive global rankings.',
  optInPolicy: 'Only active players who have explicitly enabled public leaderboard participation in Settings are included.'
};

class LeaderboardService {
  /**
   * Daily Leaderboard
   */
  async getDailyLeaderboard({ page = 1, limit = 25, currentUserId = null, date = new Date() } = {}) {
    const boundaries = getPeriodBoundaries(date, config.leaderboard.timezone);
    const offset = Math.max(0, (page - 1) * limit);

    // Group score transactions within daily window for active, opted-in users
    const results = await prisma.$queryRaw`
      SELECT 
        u."id" AS "userId",
        p."callsign",
        p."activeRoleId",
        p."level",
        COALESCE(SUM(st."pointsDelta"), 0)::int AS "score",
        COALESCE(SUM(st."xpDelta"), 0)::int AS "xp",
        MIN(st."createdAt") AS "firstSubmission"
      FROM "User" u
      JOIN "UserProfile" p ON p."userId" = u."id"
      JOIN "ScoreTransaction" st ON st."userId" = u."id"
      WHERE u."isActive" = true 
        AND u."leaderboardOptIn" = true
        AND st."reason" != 'replay_practice_attempt'
        AND st."createdAt" >= ${boundaries.startOfDayUtc}
        AND st."createdAt" <= ${boundaries.endOfDayUtc}
      GROUP BY u."id", p."callsign", p."activeRoleId", p."level"
      HAVING COALESCE(SUM(st."pointsDelta"), 0) > 0
      ORDER BY "score" DESC, "xp" DESC, "firstSubmission" ASC, u."id" ASC
    `;

    const totalCount = results.length;
    const rankedResults = results.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      callsign: row.callsign,
      activeRoleId: row.activeRoleId,
      level: row.level,
      score: row.score,
      xp: row.xp
    }));

    const paginated = rankedResults.slice(offset, offset + limit);

    let currentUserEntry = null;
    if (currentUserId) {
      currentUserEntry = rankedResults.find(r => r.userId === currentUserId) || null;
    }

    return {
      period: 'daily',
      periodKey: boundaries.dailyKey,
      timezone: boundaries.timeZone,
      startUtc: boundaries.startOfDayUtc,
      endUtc: boundaries.endOfDayUtc,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1
      },
      leaderboard: paginated,
      currentUserRank: currentUserEntry,
      methodology: SCORING_METHODOLOGY
    };
  }

  /**
   * Weekly Leaderboard
   */
  async getWeeklyLeaderboard({ page = 1, limit = 25, currentUserId = null, date = new Date() } = {}) {
    const boundaries = getPeriodBoundaries(date, config.leaderboard.timezone);
    const offset = Math.max(0, (page - 1) * limit);

    const results = await prisma.$queryRaw`
      SELECT 
        u."id" AS "userId",
        p."callsign",
        p."activeRoleId",
        p."level",
        COALESCE(SUM(st."pointsDelta"), 0)::int AS "score",
        COALESCE(SUM(st."xpDelta"), 0)::int AS "xp",
        MIN(st."createdAt") AS "firstSubmission"
      FROM "User" u
      JOIN "UserProfile" p ON p."userId" = u."id"
      JOIN "ScoreTransaction" st ON st."userId" = u."id"
      WHERE u."isActive" = true 
        AND u."leaderboardOptIn" = true
        AND st."reason" != 'replay_practice_attempt'
        AND st."createdAt" >= ${boundaries.startOfWeekUtc}
        AND st."createdAt" <= ${boundaries.endOfWeekUtc}
      GROUP BY u."id", p."callsign", p."activeRoleId", p."level"
      HAVING COALESCE(SUM(st."pointsDelta"), 0) > 0
      ORDER BY "score" DESC, "xp" DESC, "firstSubmission" ASC, u."id" ASC
    `;

    const totalCount = results.length;
    const rankedResults = results.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      callsign: row.callsign,
      activeRoleId: row.activeRoleId,
      level: row.level,
      score: row.score,
      xp: row.xp
    }));

    const paginated = rankedResults.slice(offset, offset + limit);

    let currentUserEntry = null;
    if (currentUserId) {
      currentUserEntry = rankedResults.find(r => r.userId === currentUserId) || null;
    }

    return {
      period: 'weekly',
      periodKey: boundaries.weeklyKey,
      timezone: boundaries.timeZone,
      startUtc: boundaries.startOfWeekUtc,
      endUtc: boundaries.endOfWeekUtc,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1
      },
      leaderboard: paginated,
      currentUserRank: currentUserEntry,
      methodology: SCORING_METHODOLOGY
    };
  }

  /**
   * Overall / All-Time Global Leaderboard
   */
  async getOverallLeaderboard({ page = 1, limit = 25, currentUserId = null } = {}) {
    const offset = Math.max(0, (page - 1) * limit);

    const results = await prisma.$queryRaw`
      SELECT 
        u."id" AS "userId",
        p."callsign",
        p."activeRoleId",
        p."level",
        p."totalScore" AS "score",
        p."totalXp" AS "xp",
        p."updatedAt" AS "lastActive"
      FROM "User" u
      JOIN "UserProfile" p ON p."userId" = u."id"
      WHERE u."isActive" = true 
        AND u."leaderboardOptIn" = true
        AND p."totalScore" > 0
      ORDER BY p."totalScore" DESC, p."totalXp" DESC, p."updatedAt" ASC, u."id" ASC
    `;

    const totalCount = results.length;
    const rankedResults = results.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      callsign: row.callsign,
      activeRoleId: row.activeRoleId,
      level: row.level,
      score: row.score,
      xp: row.xp
    }));

    const paginated = rankedResults.slice(offset, offset + limit);

    let currentUserEntry = null;
    if (currentUserId) {
      currentUserEntry = rankedResults.find(r => r.userId === currentUserId) || null;
    }

    return {
      period: 'overall',
      timezone: config.leaderboard.timezone,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1
      },
      leaderboard: paginated,
      currentUserRank: currentUserEntry,
      methodology: SCORING_METHODOLOGY
    };
  }

  /**
   * Retrieves player's standing across all three leaderboard periods
   */
  async getUserStanding(userId) {
    const [daily, weekly, overall] = await Promise.all([
      this.getDailyLeaderboard({ limit: 1, currentUserId: userId }),
      this.getWeeklyLeaderboard({ limit: 1, currentUserId: userId }),
      this.getOverallLeaderboard({ limit: 1, currentUserId: userId })
    ]);

    return {
      daily: daily.currentUserRank,
      weekly: weekly.currentUserRank,
      overall: overall.currentUserRank
    };
  }
}

module.exports = new LeaderboardService();
