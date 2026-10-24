/**
 * Server-Authoritative Game & Mission Simulation Engine
 *
 * Enforces transaction-safe decision evaluation, anti-cheat score calculations,
 * idempotency, replay protection, attempt expiration, and achievement progression.
 */

const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

const ATTEMPT_EXPIRY_MINUTES = 30;
const XP_PER_LEVEL = 500;

class GameService {
  /**
   * Retrieves all active playable maritime roles
   */
  async getRoles() {
    return prisma.gameRole.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Retrieves all published mission scenarios
   */
  async getPublishedMissions({ roleId, difficulty } = {}) {
    const where = {
      status: 'PUBLISHED'
    };
    if (roleId) where.roleId = roleId;

    const scenarios = await prisma.missionScenario.findMany({
      where,
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      },
      orderBy: { id: 'asc' }
    });

    // Map to client-safe representation
    return scenarios.map(scen => {
      const v = scen.versions[0];
      if (!v) return null;

      // Filter options by omitting correct/score flags for security until decision time!
      const sanitizedOptions = Array.isArray(v.options)
        ? v.options.map(opt => ({
            id: opt.id,
            text: opt.text
          }))
        : [];

      return {
        id: scen.id,
        roleId: scen.roleId,
        status: scen.status,
        versionNumber: v.versionNumber,
        scenarioVersionId: v.id,
        title: v.title,
        region: v.region,
        topic: v.topic,
        difficulty: v.difficulty,
        objective: v.objective,
        situationBriefing: v.situationBriefing,
        oceanConditions: v.oceanConditions,
        simulationNotice: v.simulationNotice,
        options: sanitizedOptions
      };
    }).filter(Boolean);
  }

  /**
   * Retrieves a single published mission by ID
   */
  async getMissionById(scenarioId) {
    const scenario = await prisma.missionScenario.findUnique({
      where: { id: scenarioId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!scenario || scenario.status !== 'PUBLISHED') {
      throw new AppError('Scenario not found or not published.', 404);
    }

    const v = scenario.versions[0];
    const sanitizedOptions = Array.isArray(v.options)
      ? v.options.map(opt => ({
          id: opt.id,
          text: opt.text
        }))
      : [];

    return {
      id: scenario.id,
      roleId: scenario.roleId,
      status: scenario.status,
      versionNumber: v.versionNumber,
      scenarioVersionId: v.id,
      title: v.title,
      region: v.region,
      topic: v.topic,
      difficulty: v.difficulty,
      objective: v.objective,
      situationBriefing: v.situationBriefing,
      oceanConditions: v.oceanConditions,
      simulationNotice: v.simulationNotice,
      options: sanitizedOptions
    };
  }

  /**
   * Starts a new authoritative mission attempt
   */
  async startAttempt({ userId, scenarioId, idempotencyKey }) {
    // 1. Check idempotency: If key provided and already exists, return existing attempt
    if (idempotencyKey) {
      const existingAttempt = await prisma.missionAttempt.findUnique({
        where: { idempotencyKey },
        include: { scenarioVersion: true, decisions: true }
      });
      if (existingAttempt) {
        return this._formatAttemptResponse(existingAttempt);
      }
    }

    // 2. Fetch published scenario and latest version
    const scenario = await prisma.missionScenario.findUnique({
      where: { id: scenarioId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!scenario || scenario.status !== 'PUBLISHED' || !scenario.versions[0]) {
      throw new AppError('Cannot start mission: Scenario is unavailable or unpublished.', 400);
    }

    const activeVersion = scenario.versions[0];

    // 3. Replay Protection: Check if user has already finalized an attempt for this scenario
    const priorFinalized = await prisma.missionAttempt.findFirst({
      where: {
        userId,
        scenarioId,
        status: 'FINALIZED'
      }
    });
    const isPractice = Boolean(priorFinalized);

    // 4. Expiration timestamp
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + ATTEMPT_EXPIRY_MINUTES * 60 * 1000);

    // 5. Create attempt record in PostgreSQL
    const attempt = await prisma.missionAttempt.create({
      data: {
        userId,
        scenarioId,
        scenarioVersionId: activeVersion.id,
        status: 'IN_PROGRESS',
        idempotencyKey: idempotencyKey || null,
        isPractice,
        startedAt,
        expiresAt
      },
      include: {
        scenarioVersion: true,
        decisions: true
      }
    });

    return this._formatAttemptResponse(attempt);
  }

  /**
   * Evaluates decision purely on the server and applies transaction-safe updates
   */
  async submitDecision({ userId, attemptId, optionId, idempotencyKey }) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch attempt with pessimistic lock or fresh read
      const attempt = await tx.missionAttempt.findUnique({
        where: { id: attemptId },
        include: {
          scenarioVersion: true,
          decisions: true,
          user: { include: { profile: true } }
        }
      });

      if (!attempt) {
        throw new AppError('Mission attempt not found.', 404);
      }

      if (attempt.userId !== userId) {
        throw new AppError('Forbidden: This attempt belongs to another user.', 403);
      }

      if (attempt.status !== 'IN_PROGRESS') {
        throw new AppError(`Cannot submit decision: Attempt is already ${attempt.status.toLowerCase()}.`, 400);
      }

      if (new Date() > attempt.expiresAt) {
        await tx.missionAttempt.update({
          where: { id: attempt.id },
          data: { status: 'EXPIRED' }
        });
        throw new AppError('Mission attempt has expired. Please restart the mission.', 400);
      }

      // Duplicate-submission protection: One decision per attempt
      if (attempt.decisions.length > 0) {
        // Idempotency: Return existing decision record if already submitted
        const existing = attempt.decisions[0];
        return {
          attemptId: attempt.id,
          scenarioId: attempt.scenarioId,
          decision: existing,
          isReplay: attempt.isPractice,
          alreadySubmitted: true
        };
      }

      // 2. Locate option in authoritative version snapshot
      const rawOptions = attempt.scenarioVersion.options;
      if (!Array.isArray(rawOptions)) {
        throw new AppError('Scenario configuration error: Invalid options in version snapshot.', 500);
      }

      const selectedOption = rawOptions.find(o => o.id === optionId);
      if (!selectedOption) {
        throw new AppError('Invalid option ID submitted.', 400);
      }

      // 3. Trusted Server-Side Evaluation Logic
      const isCorrect = selectedOption.type === 'correct';
      const isHazardous = selectedOption.type === 'unsafe' || Boolean(selectedOption.isHazardous);
      const pointsDelta = Number(selectedOption.score) || (isCorrect ? 100 : -50);
      // Replay Protection: Replays award 0 XP and 0 competitive score delta
      const earnedXp = attempt.isPractice ? 0 : (Number(selectedOption.xp) || (isCorrect ? 100 : 0));
      const competitiveScoreDelta = attempt.isPractice ? 0 : pointsDelta;

      // 4. Create Decision Record
      const decisionRecord = await tx.decisionRecord.create({
        data: {
          attemptId: attempt.id,
          scenarioId: attempt.scenarioId,
          optionId: selectedOption.id,
          optionType: selectedOption.type,
          pointsDelta,
          earnedXp,
          isHazardous,
          feedback: selectedOption.feedback,
          scienceTakeaway: selectedOption.scienceTakeaway
        }
      });

      // 5. Finalize Attempt
      const finalizedAttempt = await tx.missionAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FINALIZED',
          finalScore: pointsDelta,
          finalXp: earnedXp,
          finalizedAt: new Date()
        }
      });

      // 6. Record Score Transaction in authoritative ledger
      await tx.scoreTransaction.create({
        data: {
          userId,
          attemptId: attempt.id,
          pointsDelta: competitiveScoreDelta,
          xpDelta: earnedXp,
          reason: attempt.isPractice ? 'replay_practice_attempt' : 'mission_decision'
        }
      });

      // 7. Update User Profile Progress & Streak
      const profile = attempt.user.profile;
      const newScore = Math.max(0, (profile?.totalScore || 0) + competitiveScoreDelta);
      const newXp = Math.max(0, (profile?.totalXp || 0) + earnedXp);
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
      const newStreak = isCorrect ? (profile?.currentStreak || 0) + 1 : 0;
      const newMaxStreak = Math.max(profile?.maxStreak || 0, newStreak);
      const newHazardIncidents = isHazardous ? (profile?.hazardIncidents || 0) + 1 : (profile?.hazardIncidents || 0);
      const newMissionsCompleted = (profile?.missionsCompleted || 0) + 1;

      const updatedProfile = await tx.userProfile.update({
        where: { userId },
        data: {
          totalScore: newScore,
          totalXp: newXp,
          level: newLevel,
          currentStreak: newStreak,
          maxStreak: newMaxStreak,
          hazardIncidents: newHazardIncidents,
          missionsCompleted: newMissionsCompleted
        }
      });

      // 8. Evaluate and unlock achievements
      const newlyUnlockedAchievements = await this._evaluateAchievements(tx, userId, {
        totalCompleted: newMissionsCompleted,
        xp: newXp,
        streak: newStreak,
        maxStreak: newMaxStreak,
        hazardIncidents: newHazardIncidents,
        lastDifficulty: attempt.scenarioVersion.difficulty,
        isCorrect
      });

      const finalProfile = newlyUnlockedAchievements.length > 0
        ? await tx.userProfile.findUnique({ where: { userId } })
        : updatedProfile;

      return {
        attemptId: attempt.id,
        scenarioId: attempt.scenarioId,
        status: 'FINALIZED',
        isReplay: attempt.isPractice,
        evaluation: {
          optionId: selectedOption.id,
          optionType: selectedOption.type,
          isCorrect,
          isHazardous,
          pointsDelta,
          earnedXp,
          feedback: selectedOption.feedback,
          scienceTakeaway: selectedOption.scienceTakeaway
        },
        profile: finalProfile,
        newlyUnlockedAchievements
      };
    });
  }

  /**
   * Resumes an in-progress attempt for network recovery
   */
  async resumeAttempt({ userId, attemptId }) {
    const attempt = await prisma.missionAttempt.findUnique({
      where: { id: attemptId },
      include: {
        scenarioVersion: true,
        decisions: true
      }
    });

    if (!attempt || attempt.userId !== userId) {
      throw new AppError('Attempt not found.', 404);
    }

    if (attempt.status === 'IN_PROGRESS' && new Date() > attempt.expiresAt) {
      await prisma.missionAttempt.update({
        where: { id: attempt.id },
        data: { status: 'EXPIRED' }
      });
      throw new AppError('Attempt has expired.', 400);
    }

    return this._formatAttemptResponse(attempt);
  }

  /**
   * Retrieves player profile, statistics, achievements, and attempt history
   */
  async getUserProgress(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        unlockedAchievements: {
          include: { achievement: true }
        },
        attempts: {
          take: 10,
          orderBy: { startedAt: 'desc' },
          include: {
            scenarioVersion: {
              select: { title: true, difficulty: true, roleId: true }
            },
            decisions: true
          }
        }
      }
    });

    if (!user) throw new AppError('User not found.', 404);

    const finalizedMissions = await prisma.missionAttempt.findMany({
      where: { userId, status: 'FINALIZED' },
      select: { scenarioId: true },
      distinct: ['scenarioId']
    });

    const completedMissionIds = finalizedMissions.map(m => m.scenarioId);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        leaderboardOptIn: user.leaderboardOptIn
      },
      profile: user.profile,
      completedMissionIds,
      unlockedAchievements: user.unlockedAchievements.map(ua => ({
        id: ua.achievementId,
        title: ua.achievement.title,
        icon: ua.achievement.icon,
        desc: ua.achievement.desc,
        unlockedAt: ua.unlockedAt
      })),
      recentAttempts: user.attempts.map(a => ({
        id: a.id,
        scenarioId: a.scenarioId,
        title: a.scenarioVersion.title,
        roleId: a.scenarioVersion.roleId,
        status: a.status,
        score: a.finalScore,
        xp: a.finalXp,
        isPractice: a.isPractice,
        startedAt: a.startedAt,
        finalizedAt: a.finalizedAt
      }))
    };
  }

  // Internal helper to evaluate and record achievements
  async _evaluateAchievements(tx, userId, stats) {
    const existing = await tx.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true }
    });
    const unlockedIds = new Set(existing.map(e => e.achievementId));
    const newUnlocks = [];

    // 1. first_tide: complete 1 mission
    if (!unlockedIds.has('first_tide') && stats.totalCompleted >= 1) {
      newUnlocks.push('first_tide');
    }

    // 2. ocean_sentinel: streak of 5
    if (!unlockedIds.has('ocean_sentinel') && stats.streak >= 5) {
      newUnlocks.push('ocean_sentinel');
    }

    // 3. ocean_scholar: Level 4 or >= 1500 XP
    if (!unlockedIds.has('ocean_scholar') && stats.xp >= 1500) {
      newUnlocks.push('ocean_scholar');
    }

    // 4. storm_survivor: Advanced difficulty correct
    if (!unlockedIds.has('storm_survivor') && stats.lastDifficulty === 'Advanced' && stats.isCorrect) {
      newUnlocks.push('storm_survivor');
    }

    // 5. guardian_of_the_deep: 10 completions with 0 hazards
    if (!unlockedIds.has('guardian_of_the_deep') && stats.totalCompleted >= 10 && stats.hazardIncidents === 0) {
      newUnlocks.push('guardian_of_the_deep');
    }

    // 6. master_navigator: completions across all 5 roles
    if (!unlockedIds.has('master_navigator')) {
      const distinctRoles = await tx.missionAttempt.findMany({
        where: { userId, status: 'FINALIZED' },
        include: { scenarioVersion: { select: { roleId: true } } }
      });
      const rolesSet = new Set(distinctRoles.map(d => d.scenarioVersion?.roleId).filter(Boolean));
      if (rolesSet.size >= 5) {
        newUnlocks.push('master_navigator');
      }
    }

    const createdAchievements = [];
    for (const achId of newUnlocks) {
      const ach = await tx.achievement.findUnique({ where: { id: achId } });
      if (ach) {
        await tx.userAchievement.create({
          data: {
            userId,
            achievementId: achId
          }
        });

        if (ach.xpReward > 0) {
          await tx.userProfile.update({
            where: { userId },
            data: { totalXp: { increment: ach.xpReward } }
          });
          await tx.scoreTransaction.create({
            data: {
              userId,
              pointsDelta: 0,
              xpDelta: ach.xpReward,
              reason: `achievement_bonus_${achId}`
            }
          });
        }

        createdAchievements.push(ach);
      }
    }

    return createdAchievements;
  }

  _formatAttemptResponse(attempt) {
    const v = attempt.scenarioVersion;
    const sanitizedOptions = Array.isArray(v.options)
      ? v.options.map(opt => ({
          id: opt.id,
          text: opt.text
        }))
      : [];

    return {
      attemptId: attempt.id,
      scenarioId: attempt.scenarioId,
      scenarioVersionId: attempt.scenarioVersionId,
      status: attempt.status,
      isPractice: attempt.isPractice,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      finalizedAt: attempt.finalizedAt,
      scenario: {
        title: v.title,
        roleId: v.roleId,
        region: v.region,
        difficulty: v.difficulty,
        objective: v.objective,
        situationBriefing: v.situationBriefing,
        oceanConditions: v.oceanConditions,
        simulationNotice: v.simulationNotice,
        options: sanitizedOptions
      },
      decisions: attempt.decisions
    };
  }
}

module.exports = new GameService();
